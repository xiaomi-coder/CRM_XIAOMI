#!/usr/bin/env node
/**
 * IELTS platforma testlarini bazaga yuklash.
 *
 * Bu testlar PLATFORM_CENTER_ID ostida saqlanadi — ya'ni BARCHA o'quv
 * markazlariga ko'rinadi (TestsManager ularni "platforma testlari" deb ajratadi).
 * Markazlar o'zi test tuzishga vaqt sarflamaydi.
 *
 * Kontent ORIGINAL — Cambridge/British Council materiallari ko'chirilmagan
 * (ular mualliflik huquqi bilan himoyalangan). Faqat IELTS formati takrorlangan.
 *
 * Ishlatish:
 *   node scripts/ielts-seed/seed.mjs            # yuklash
 *   node scripts/ielts-seed/seed.mjs --dry      # faqat tekshirish, yozmaydi
 *   node scripts/ielts-seed/seed.mjs --strict   # blueprint (IELTS tuzilma) xatolari ham to'siq
 *   node scripts/ielts-seed/seed.mjs --list     # bazadagi platforma testlari
 *   node scripts/ielts-seed/seed.mjs --remove "Test nomi"
 */

import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateReadingBlueprint, validateListeningBlueprint, validateAgainstTranscript } from './blueprint.mjs';

const API = process.env.CRM_API_URL || 'https://api.eduprocrm.uz';
const KEY =
  process.env.CRM_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw';

/** services/ieltsSeedService.ts dagi bilan bir xil bo'lishi SHART */
const PLATFORM_CENTER_ID = '00000000-0000-0000-0000-000000000001';

const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

async function rest(path, options = {}) {
  const res = await fetch(`${API}/rest/v1/${path}`, { ...options, headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

const insertMany = async (table, rows) => {
  if (!rows.length) return 0;
  // Bo'laklab yuborish — juda katta so'rov bo'lmasligi uchun
  const CHUNK = 50;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await rest(table, { method: 'POST', body: JSON.stringify(rows.slice(i, i + CHUNK)) });
  }
  return rows.length;
};

const uuid = () => crypto.randomUUID();

/** Test moduldan bazaga tushadigan qatorlar yasash */
function buildRows(def, testId) {
  const base = { centerId: PLATFORM_CENTER_ID, examType: def.examType, test_id: testId };

  const reading = [];
  let rq = 0;
  for (const p of def.reading) {
    for (const q of p.questions) {
      rq += 1;
      reading.push({
        id: uuid(),
        ...base,
        passageNumber: p.passageNumber,
        passageTitle: p.title,
        passageText: p.text,
        questionNumber: rq,
        questionType: q.type,
        questionText: q.text,
        options: q.options ?? null,
        correctAnswer: String(q.answer),
        points: 1,
      });
    }
  }

  const listening = [];
  let lq = 0;
  for (const s of def.listening) {
    for (const q of s.questions) {
      lq += 1;
      listening.push({
        id: uuid(),
        ...base,
        sectionNumber: s.sectionNumber,
        sectionTitle: s.title,
        // Audio hali yozib olinmagan — o'qituvchi transkriptni ovoz chiqarib o'qiydi
        audioUrl: s.audioUrl ?? 'placeholder',
        questionNumber: lq,
        questionType: q.type,
        questionText: q.text,
        options: q.options ?? null,
        correctAnswer: String(q.answer),
        points: 1,
      });
    }
  }

  const writing = def.writing.map((w) => ({
    id: uuid(),
    ...base,
    taskNumber: w.taskNumber,
    taskPrompt: w.prompt,
    taskImageUrl: w.imageUrl ?? null,
    wordLimitMin: w.wordLimitMin,
    timeMinutes: w.timeMinutes,
  }));

  const speaking = def.speaking.map((s) => ({
    id: uuid(),
    ...base,
    partNumber: s.partNumber,
    questionText: s.text,
    cueCardTopic: s.cueCardTopic ?? null,
    cueCardPoints: s.cueCardPoints ?? null,
    preparationTime: s.preparationTime ?? null,
    speakingTime: s.speakingTime ?? null,
  }));

  return { reading, listening, writing, speaking };
}

/** Sifat nazorati — yuklashdan oldin */
function validate(def) {
  const errs = [];
  const rq = def.reading.reduce((n, p) => n + p.questions.length, 0);
  const lq = def.listening.reduce((n, s) => n + s.questions.length, 0);

  if (!def.title) errs.push('title yo\'q');
  if (!['academic', 'general'].includes(def.examType)) errs.push(`examType noto'g'ri: ${def.examType}`);
  if (def.reading.length !== 3) errs.push(`reading passaj soni ${def.reading.length} (3 bo'lishi kerak)`);
  if (rq !== 40) errs.push(`reading savol ${rq} (40 bo'lishi kerak)`);
  if (lq !== 40) errs.push(`listening savol ${lq} (40 bo'lishi kerak)`);
  if (def.writing.length !== 2) errs.push(`writing task ${def.writing.length} (2 bo'lishi kerak)`);

  for (const p of def.reading) {
    const words = (p.text || '').split(/\s+/).filter(Boolean).length;
    if (words < 500) errs.push(`"${p.title}" passaji juda qisqa (${words} so'z)`);
    for (const q of p.questions) {
      if (!q.text || q.answer === undefined) errs.push(`"${p.title}": savol yoki javob bo'sh`);
      if (q.type === 'multiple_choice' && !q.options) errs.push(`"${p.title}": MC savolda options yo'q`);
    }
  }
  for (const s of def.listening) {
    for (const q of s.questions) {
      if (!q.text || q.answer === undefined) errs.push(`"${s.title}": savol yoki javob bo'sh`);
    }
  }
  return errs;
}

/** Test faylining transkriptini yuklaydi (javoblar aytilganini tekshirish uchun) */
async function loadTranscript(file) {
  try {
    const dir = join(dirname(fileURLToPath(import.meta.url)), 'transcripts');
    const mod = await import(join(dir, file));
    return mod.default;
  } catch {
    return null;
  }
}

async function loadDefs() {
  const dir = join(dirname(fileURLToPath(import.meta.url)), 'tests');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs')).sort();
  const defs = [];
  for (const f of files) {
    const mod = await import(join(dir, f));
    defs.push({ file: f, ...mod.default });
  }
  return defs;
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const strict = args.includes('--strict');

  if (args.includes('--list')) {
    const tests = await rest('ielts_tests?select=id,title,status,center_id,exam_type');
    const platform = tests.filter((t) => (t.center_id ?? t.centerId) === PLATFORM_CENTER_ID);
    console.log(`Platforma testlari: ${platform.length}`);
    for (const t of platform) console.log(`  · ${t.title} [${t.exam_type}/${t.status}]`);
    return;
  }

  const removeIdx = args.indexOf('--remove');
  if (removeIdx !== -1) {
    const title = args[removeIdx + 1];
    const tests = await rest(`ielts_tests?title=eq.${encodeURIComponent(title)}&select=id`);
    for (const t of tests) {
      for (const tbl of [
        'ielts_reading_questions',
        'ielts_listening_questions',
        'ielts_writing_tasks',
        'ielts_speaking_questions',
      ]) {
        await rest(`${tbl}?test_id=eq.${t.id}`, { method: 'DELETE' });
      }
      await rest(`ielts_tests?id=eq.${t.id}`, { method: 'DELETE' });
      console.log(`🗑  o'chirildi: ${title}`);
    }
    return;
  }

  const defs = await loadDefs();
  if (!defs.length) {
    console.log('tests/ papkasida test topilmadi');
    return;
  }

  const existing = await rest('ielts_tests?select=id,title,center_id');
  const have = new Set(
    existing.filter((t) => (t.center_id ?? t.centerId) === PLATFORM_CENTER_ID).map((t) => t.title)
  );

  let added = 0;
  for (const def of defs) {
    const errs = validate(def);
    // IELTS rasmiy tuzilmasi (blueprint.mjs) — savol turlari bloklari va qiyinlik gradienti
    const blueprintErrs = [
      ...validateReadingBlueprint(def.reading),
      ...validateListeningBlueprint(def.listening),
      ...validateAgainstTranscript(def.listening, await loadTranscript(def.file)),
    ];
    if (blueprintErrs.length) {
      console.log(`${strict ? '❌' : '⚠️ '} ${def.file} — IELTS tuzilma (blueprint):`);
      for (const e of blueprintErrs) console.log(`     ${e}`);
      if (strict) continue;
    }
    if (errs.length) {
      console.log(`❌ ${def.file} — ${def.title}`);
      for (const e of errs) console.log(`     ${e}`);
      continue;
    }
    if (have.has(def.title)) {
      console.log(`⏭  bor: ${def.title}`);
      continue;
    }
    const testId = uuid();
    const rows = buildRows(def, testId);
    const counts = `R${rows.reading.length} L${rows.listening.length} W${rows.writing.length} S${rows.speaking.length}`;

    if (dry) {
      console.log(`✓ (dry) ${def.title} — ${counts}`);
      continue;
    }

    const now = new Date().toISOString();
    await rest('ielts_tests', {
      method: 'POST',
      body: JSON.stringify({
        id: testId,
        center_id: PLATFORM_CENTER_ID,
        centerId: PLATFORM_CENTER_ID,
        title: def.title,
        exam_type: def.examType,
        examType: def.examType,
        status: 'active',
        created_at: now,
        createdAt: now,
        updated_at: now,
      }),
    });
    await insertMany('ielts_reading_questions', rows.reading);
    await insertMany('ielts_listening_questions', rows.listening);
    await insertMany('ielts_writing_tasks', rows.writing);
    await insertMany('ielts_speaking_questions', rows.speaking);

    console.log(`✅ ${def.title} — ${counts}`);
    added += 1;
  }
  console.log(`\nJami qo'shildi: ${added}`);
}

main().catch((e) => {
  console.error('XATO:', e.message);
  process.exit(1);
});
