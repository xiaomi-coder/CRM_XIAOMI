#!/usr/bin/env node
/**
 * IELTS Listening audio generatori.
 *
 * Transkriptdan (scripts/ielts-seed/transcripts/) haqiqiy audio yasaydi:
 *   1. Har bir gapni macOS `say` bilan alohida WAV qiladi (spikerga qarab ovoz)
 *   2. Pauzalar bilan birlashtiradi
 *   3. AAC (m4a) ga siqadi — 24 kbps, nutq uchun yetarli
 *
 * Natija: public/audio/ielts/<test>-s<N>.m4a
 * Vercel ularni static fayl sifatida tarqatadi, ya'ni alohida server kerak emas.
 *
 * Ishlatish:
 *   node scripts/ielts-seed/audio/generate.mjs            # yetishmaganini yasaydi
 *   node scripts/ielts-seed/audio/generate.mjs --force    # hammasini qayta yasaydi
 *   node scripts/ielts-seed/audio/generate.mjs test-01    # faqat bittasi
 */

import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const TRANSCRIPTS = join(HERE, '..', 'transcripts');
const OUT_DIR = join(ROOT, 'public', 'audio', 'ielts');
const TMP = join(HERE, '.tmp');

/**
 * Spiker -> macOS ovozi. IELTS asosan Britaniya aksentini ishlatadi.
 * Ovozlar: `say -v '?'` bilan ro'yxatni ko'rish mumkin.
 */
const VOICES = {
  narrator: 'Daniel',   // e'lonlar: "Section 1. You will hear..."
  m1: 'Daniel',         // erkak 1
  m2: 'Rocko (English (UK))',
  f1: 'Shelley (English (UK))', // ayol 1
  f2: 'Sandy (English (UK))',
};
const FALLBACK_VOICE = 'Daniel';

const RATE = 150;       // so'z/daqiqa — haqiqiy IELTS tezligi (~140-150)
const PAUSE_TURN = 0.55; // spiker almashganda
const PAUSE_PARA = 1.2;  // bo'lim/paragraf orasida

let availableVoices = null;
async function voiceExists(name) {
  if (!availableVoices) {
    const { stdout } = await run('say', ['-v', '?']);
    availableVoices = stdout.split('\n').map((l) => l.split(/\s{2,}/)[0].trim());
  }
  return availableVoices.includes(name);
}

async function resolveVoice(speaker) {
  const want = VOICES[speaker] ?? VOICES.narrator;
  return (await voiceExists(want)) ? want : FALLBACK_VOICE;
}

/** Bitta gapni WAV qilish */
async function speak(text, speaker, file) {
  const voice = await resolveVoice(speaker);
  await run('say', ['-v', voice, '-r', String(RATE), '-o', file, '--data-format=LEI16@22050', text]);
}

/** WAV fayllarni pauzalar bilan birlashtirish (Python wave — qo'shimcha paket kerak emas) */
async function joinWavs(files, pauses, out) {
  const py = `
import wave, sys, json
files = json.loads(sys.argv[1]); pauses = json.loads(sys.argv[2]); out = sys.argv[3]
w0 = wave.open(files[0], 'rb'); params = w0.getparams(); rate = w0.getframerate(); w0.close()
o = wave.open(out, 'wb'); o.setparams(params)
for f, p in zip(files, pauses):
    w = wave.open(f, 'rb'); o.writeframes(w.readframes(w.getnframes())); w.close()
    o.writeframes(b'\\x00\\x00' * int(rate * p))
o.close()
`;
  await run('python3', ['-c', py, JSON.stringify(files), JSON.stringify(pauses), out]);
}

/** Bitta bo'lim uchun audio */
async function buildSection(testKey, section) {
  const workDir = join(TMP, `${testKey}-s${section.sectionNumber}`);
  await rm(workDir, { recursive: true, force: true });
  await mkdir(workDir, { recursive: true });

  const files = [];
  const pauses = [];
  let i = 0;
  let prevSpeaker = null;

  for (const line of section.lines) {
    const [speaker, text] = Array.isArray(line) ? line : ['narrator', line];
    if (!text?.trim()) continue;
    const f = join(workDir, `${String(i).padStart(3, '0')}.wav`);
    await speak(text, speaker, f);
    files.push(f);
    // yangi spiker yoki narrator -> uzunroq pauza
    pauses.push(speaker !== prevSpeaker && prevSpeaker !== null ? PAUSE_TURN : PAUSE_TURN * 0.6);
    prevSpeaker = speaker;
    i += 1;
  }
  if (!files.length) throw new Error(`${testKey} s${section.sectionNumber}: transkript bo'sh`);

  // oxirida biroz sukunat
  pauses[pauses.length - 1] = PAUSE_PARA;

  const joined = join(workDir, 'joined.wav');
  await joinWavs(files, pauses, joined);

  await mkdir(OUT_DIR, { recursive: true });
  const outFile = join(OUT_DIR, `${testKey}-s${section.sectionNumber}.m4a`);
  await run('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '24000', joined, outFile]);
  await rm(workDir, { recursive: true, force: true });

  const { size } = await stat(outFile);
  return { outFile, size };
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.find((a) => a.startsWith('test-'));

  if (process.platform !== 'darwin') {
    console.error("XATO: bu skript macOS `say` buyrug'iga tayanadi.");
    process.exit(1);
  }

  let files;
  try {
    files = (await readdir(TRANSCRIPTS)).filter((f) => f.endsWith('.mjs')).sort();
  } catch {
    console.log("transcripts/ papkasi yo'q — avval transkript yozing.");
    return;
  }
  if (only) files = files.filter((f) => f.startsWith(only));

  let made = 0;
  let totalSize = 0;

  for (const file of files) {
    const testKey = file.replace('.mjs', '');
    const mod = (await import(join(TRANSCRIPTS, file))).default;

    for (const section of mod.sections) {
      const outFile = join(OUT_DIR, `${testKey}-s${section.sectionNumber}.m4a`);
      if (!force && existsSync(outFile)) {
        const { size } = await stat(outFile);
        totalSize += size;
        console.log(`⏭  bor: ${testKey}-s${section.sectionNumber}`);
        continue;
      }
      process.stdout.write(`🎧 ${testKey}-s${section.sectionNumber} ... `);
      const { size } = await buildSection(testKey, section);
      totalSize += size;
      made += 1;
      console.log(`${(size / 1024).toFixed(0)} KB`);
    }
  }

  await rm(TMP, { recursive: true, force: true });
  console.log(`\nYasaldi: ${made} ta | Jami hajm: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Papka: public/audio/ielts/`);
}

main().catch((e) => {
  console.error('XATO:', e.message);
  process.exit(1);
});
