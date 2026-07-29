#!/usr/bin/env node
/**
 * Yasalgan audio fayllarni bazadagi savollarga ulash.
 *
 * public/audio/ielts/test-NN-sM.m4a  ->  ielts_listening_questions.audioUrl
 * URL nisbiy: /audio/ielts/... — Vercel static fayl sifatida beradi.
 *
 * Idempotent: qayta ishga tushirsa ham zarar qilmaydi.
 *
 *   node scripts/ielts-seed/audio/link.mjs
 *   node scripts/ielts-seed/audio/link.mjs --dry
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const AUDIO_DIR = join(ROOT, 'public', 'audio', 'ielts');
const TESTS_DIR = join(HERE, '..', 'tests');

const API = process.env.CRM_API_URL || 'https://api.eduprocrm.uz';
const KEY =
  process.env.CRM_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw';

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function rest(path, options = {}) {
  const res = await fetch(`${API}/rest/v1/${path}`, { ...options, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  const dry = process.argv.includes('--dry');

  // test fayl nomi -> test sarlavhasi (bazada shu nom bilan turibdi)
  const titleOf = {};
  for (const f of (await readdir(TESTS_DIR)).filter((x) => x.endsWith('.mjs'))) {
    const mod = (await import(join(TESTS_DIR, f))).default;
    titleOf[f.replace('.mjs', '')] = mod.title;
  }

  let audioFiles = [];
  try {
    audioFiles = (await readdir(AUDIO_DIR)).filter((f) => f.endsWith('.m4a'));
  } catch {
    console.log("public/audio/ielts/ papkasi yo'q — avval generate.mjs ishga tushiring.");
    return;
  }
  if (!audioFiles.length) {
    console.log('Audio fayl topilmadi.');
    return;
  }

  const tests = await rest('ielts_tests?select=id,title,center_id');
  const idOfTitle = Object.fromEntries(tests.map((t) => [t.title, t.id]));

  let updated = 0;
  for (const file of audioFiles.sort()) {
    const m = file.match(/^(test-\d+)-s(\d+)\.m4a$/);
    if (!m) continue;
    const [, testKey, sectionNum] = m;

    const title = titleOf[testKey];
    const testId = title && idOfTitle[title];
    if (!testId) {
      console.log(`⚠️  ${file}: bazada mos test topilmadi`);
      continue;
    }

    const url = `/audio/ielts/${file}`;
    if (dry) {
      console.log(`✓ (dry) ${file} -> ${title} / section ${sectionNum}`);
      continue;
    }

    const res = await rest(
      `ielts_listening_questions?test_id=eq.${testId}&sectionNumber=eq.${sectionNum}`,
      { method: 'PATCH', body: JSON.stringify({ audioUrl: url }) }
    );
    console.log(`✅ ${file} -> section ${sectionNum} (${title.split('—')[1]?.trim() ?? title})`);
    updated += 1;
  }
  console.log(`\nUlandi: ${updated} ta bo'lim`);
}

main().catch((e) => {
  console.error('XATO:', e.message);
  process.exit(1);
});
