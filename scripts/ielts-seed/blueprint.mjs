/**
 * IELTS Reading — RASMIY TUZILMA QOLLANMASI (blueprint).
 *
 * Muammo (2026-07-31, o'quv markazi sinovidan keyin): platforma testlarida savollar
 * uchala passajda ham bir xil qolipda edi (7×TFNG + 3×MCQ + 3×gap-fill), matching
 * turlari umuman yo'q edi va qiyinlik passajdan passajga oshmasdi. Haqiqiy IELTS
 * (Cambridge) testlari bunday emas.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ASOSIY QOIDALAR (Cambridge uslubi)
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. 3 passaj, 40 savol: Passage 1 → 13, Passage 2 → 13, Passage 3 → 14.
 * 2. Savollar BLOK bo'lib keladi. Blok = ketma-ket bir xil turdagi savollar,
 *    tepasida rasmiy ko'rsatma ("Questions 14–18 / Which paragraph contains...").
 *    Bir passajda odatda 2–4 blok, har blokda 3–7 savol.
 * 3. QIYINLIK OSHIB BORADI: Passage 1 — oson, Passage 2 — o'rta, Passage 3 — qiyin.
 *    Shu sababli qiyin turlar (matching features/information, summary completion,
 *    yes/no/not given) 2- va 3-passajda to'planadi.
 * 4. TURLAR TAKRORLANMAYDI: uchala passajning blok tuzilmasi bir xil bo'lishi mumkin emas.
 * 5. Har testda kamida bitta MATCHING oilasidagi blok bo'lishi shart.
 * 6. Completion (gap fill) javoblari so'z chegarasiga bo'ysunadi — default ONE WORD ONLY.
 * 7. "Which paragraph contains..." bo'lgan passajda xatboshilar HARFLANGAN bo'lishi shart
 *    (matnda har xatboshi oldida yakka "A", "B", "C" qatori turadi).
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TEST 1 uchun tasdiqlangan tuzilma (foydalanuvchi belgilagan)
 * ─────────────────────────────────────────────────────────────────────────────
 *   Passage 1 (oson):   1–7   TRUE/FALSE/NOT GIVEN
 *                       8–10  Multiple choice
 *                       11–13 Sentence completion (ONE WORD ONLY)
 *   Passage 2 (o'rta):  14–18 Which paragraph contains the following information?
 *                       19–21 Matching features (A, B yoki C)
 *                       22–26 Sentence completion (ONE WORD ONLY)
 *   Passage 3 (qiyin):  27–31 Which section contains the following information?
 *                       32–35 Summary completion (ONE WORD ONLY)
 *                       36–40 Match each statement with the correct person (A–D)
 *
 * Boshqa testlar shu qoidalar doirasida BOSHQACHA tuzilishi mumkin (matching headings,
 * yes/no/not given, short answer, diagram labelling va h.k.) — asosiysi 1–7-qoidalar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `options` MASSIVIDAGI META-YOZUVLAR (baza sxemasi o'zgarmasligi uchun)
 * ─────────────────────────────────────────────────────────────────────────────
 *   "@Match each statement with the correct person, A, B, C or D."  → blok sarlavhasi
 *   "@words:NO MORE THAN TWO WORDS"                                 → so'z chegarasi
 *   "A) Barcelona", "B) Vienna", ...                                → variantlar
 * Buni `services/ieltsQuestionBlocks.ts` o'qiydi (parseOptions).
 */

export const QUESTIONS_PER_PASSAGE = [13, 13, 14];

/** Passaj darajasiga ko'ra ruxsat etilgan savol turlari */
export const DIFFICULTY = {
  easy: [
    'true_false_not_given',
    'multiple_choice',
    'sentence_completion',
    'short_answer',
    'note_completion',
    'table_completion',
    'diagram_label_completion',
    'flow_chart_completion',
    'matching_information',
  ],
  hard: [
    'matching_features',
    'matching_information',
    'matching_headings',
    'summary_completion',
    'yes_no_not_given',
  ],
};

/** Harf tanlanadigan turlar — xarita belgilash ham shu oilaga kiradi */
export const MATCHING_TYPES = ['matching_features', 'matching_information', 'matching_headings', 'plan_map_labelling'];

export const COMPLETION_TYPES = [
  'sentence_completion',
  'summary_completion',
  'short_answer',
  'note_completion',
  'form_completion',
  'table_completion',
  'flow_chart_completion',
  'diagram_label_completion',
];

const MIN_BLOCK = 3;
const MAX_BLOCK = 7;

/** Ketma-ket bir xil turdagi savollarni bloklarga bo'ladi */
export function blocksOf(questions) {
  const blocks = [];
  for (const q of questions) {
    const last = blocks[blocks.length - 1];
    if (last && last.type === q.type) last.questions.push(q);
    else blocks.push({ type: q.type, questions: [q] });
  }
  return blocks;
}

const metaOf = (options) => {
  const meta = { prompt: null, wordLimit: 'ONE WORD ONLY', items: [] };
  for (const o of options || []) {
    const s = String(o);
    if (s.startsWith('@words:')) meta.wordLimit = s.slice(7).trim();
    else if (s.startsWith('@')) meta.prompt = s.slice(1).trim();
    else meta.items.push(s);
  }
  return meta;
};

const maxWords = (limit) => {
  const s = limit.toUpperCase();
  if (s.includes('THREE')) return 3;
  if (s.includes('TWO')) return 2;
  return 1;
};

/**
 * Reading qismini blueprint bo'yicha tekshiradi.
 * @returns {string[]} xatolar ro'yxati (bo'sh bo'lsa — hammasi joyida)
 */
export function validateReadingBlueprint(reading) {
  const errs = [];
  const signatures = [];

  reading.forEach((p, idx) => {
    const label = `Passage ${p.passageNumber ?? idx + 1}`;
    const expected = QUESTIONS_PER_PASSAGE[idx];
    if (p.questions.length !== expected) {
      errs.push(`${label}: ${p.questions.length} savol (${expected} bo'lishi kerak)`);
    }

    const blocks = blocksOf(p.questions);
    signatures.push(blocks.map((b) => `${b.type}:${b.questions.length}`).join('|'));

    if (blocks.length < 2) {
      errs.push(`${label}: faqat 1 blok — kamida 2 xil savol turi bo'lishi kerak`);
    }
    if (blocks.length > 4) {
      errs.push(`${label}: ${blocks.length} blok — 4 tadan oshmasligi kerak`);
    }
    for (const b of blocks) {
      if (b.questions.length < MIN_BLOCK) {
        errs.push(`${label}: "${b.type}" bloki juda kichik (${b.questions.length}, min ${MIN_BLOCK})`);
      }
      if (b.questions.length > MAX_BLOCK) {
        errs.push(`${label}: "${b.type}" bloki juda katta (${b.questions.length}, max ${MAX_BLOCK})`);
      }
    }

    // Bir tur bir passajda ikki marta ajralgan holda kelmasin
    const seen = new Set();
    for (const b of blocks) {
      if (seen.has(b.type)) errs.push(`${label}: "${b.type}" bloki bo'linib takrorlangan`);
      seen.add(b.type);
    }

    // Qiyinlik gradienti
    const types = blocks.map((b) => b.type);
    if (idx === 0) {
      const tooHard = types.filter((t) => DIFFICULTY.hard.includes(t) && !DIFFICULTY.easy.includes(t));
      if (tooHard.length) errs.push(`${label} (oson bo'lishi kerak): qiyin tur ishlatilgan — ${tooHard.join(', ')}`);
    }
    if (idx === 2 && !types.some((t) => DIFFICULTY.hard.includes(t))) {
      errs.push(`${label} (qiyin bo'lishi kerak): birorta ham qiyin savol turi yo'q`);
    }

    // Harflangan xatboshilar — "which paragraph contains" uchun shart
    if (types.includes('matching_information')) {
      const letters = (p.text.match(/^[A-Z]$/gm) || []).length;
      if (letters < 4) {
        errs.push(`${label}: matching_information bor, lekin matnda harflangan xatboshi yo'q (${letters} ta)`);
      }
    }

    // Savol darajasidagi tekshiruv
    for (const b of blocks) {
      const meta = metaOf(b.questions.find((q) => q.options)?.options);

      if (MATCHING_TYPES.includes(b.type)) {
        if (meta.items.length < 3) {
          errs.push(`${label}: "${b.type}" blokida variantlar ro'yxati yo'q (kamida 3 ta kerak)`);
        }
        const letters = meta.items.map((o, i) => (o.match(/^\s*([A-Z])\s*[).:-]/) || [])[1] || String.fromCharCode(65 + i));
        for (const q of b.questions) {
          if (!letters.includes(String(q.answer).trim())) {
            errs.push(`${label}: "${q.text.slice(0, 40)}..." javobi "${q.answer}" variantlar ichida yo'q`);
          }
        }
      }

      if (b.type === 'multiple_choice') {
        for (const q of b.questions) {
          if (!q.options || q.options.length < 3) errs.push(`${label}: MC savolda 3+ variant kerak`);
        }
      }

      if (COMPLETION_TYPES.includes(b.type)) {
        const limit = maxWords(meta.wordLimit);
        for (const q of b.questions) {
          for (const alt of String(q.answer).split('|')) {
            const words = alt.trim().split(/\s+/).filter(Boolean).length;
            if (words > limit) {
              errs.push(`${label}: "${alt.trim()}" javobi ${words} so'z — chegarasi "${meta.wordLimit}"`);
            }
          }
        }
      }

      if (['true_false_not_given', 'yes_no_not_given'].includes(b.type)) {
        const allowed = b.type === 'true_false_not_given'
          ? ['TRUE', 'FALSE', 'NOT GIVEN']
          : ['YES', 'NO', 'NOT GIVEN'];
        for (const q of b.questions) {
          if (!allowed.includes(String(q.answer).trim().toUpperCase())) {
            errs.push(`${label}: "${q.answer}" javobi ${b.type} uchun noto'g'ri`);
          }
        }
      }
    }
  });

  // Uchala passajning tuzilmasi bir xil bo'lmasin
  if (signatures.length === 3 && new Set(signatures).size === 1) {
    errs.push('Uchala passaj bir xil tuzilmada — qiyinlik oshmayapti (blueprint 3- va 4-qoida)');
  }

  const allTypes = reading.flatMap((p) => p.questions.map((q) => q.type));
  if (!allTypes.some((t) => MATCHING_TYPES.includes(t))) {
    errs.push('Testda birorta matching savoli yo\'q (blueprint 5-qoida)');
  }

  return errs;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * LISTENING — RASMIY TUZILMA
 * ─────────────────────────────────────────────────────────────────────────────
 * 4 bo'lim × 10 savol = 40. Har bo'limning o'z vazifasi bor:
 *
 *   Part 1 — kundalik suhbat (2 kishi): ro'yxatga olish, buyurtma, so'rov.
 *            Savollar deyarli doim TO'LDIRISH turida (form/note/table).
 *   Part 2 — kundalik monolog (1 kishi): joy yoki tadbir haqida ma'lumot.
 *            Odatda matching yoki map/plan + MCQ/to'ldirish.
 *   Part 3 — ta'lim suhbati (2–4 kishi): talabalar loyihasi, seminar.
 *            Odatda MCQ va matching ustunlik qiladi.
 *   Part 4 — akademik ma'ruza (1 kishi): odatda bitta 10 lik to'ldirish bloki.
 *
 * ⚠️ Part 1 da form×10 va Part 4 da note×10 — bu XATO EMAS, haqiqiy IELTS naqshi.
 * Asl muammo: 10 ta testda tuzilma aynan bir xil bo'lishi va matching umuman
 * bo'lmasligi edi.
 *
 * ⚠️ AUDIO O'ZGARMAYDI: savollar mavjud transkriptlarda AYTILGAN faktlardan
 * tuzilishi shart — aks holda 40 ta audio faylni qayta yozish kerak bo'ladi.
 *
 * ❗ Hali yo'q: map/plan/diagram labelling — rasm kerak, bazada esa rasm maydoni yo'q.
 */

/** Part 1 va Part 4 uchun ruxsat etilgan turlar (to'ldirish oilasi) */
const LISTENING_COMPLETION = [
  'form_completion',
  'note_completion',
  'table_completion',
  'sentence_completion',
  'summary_completion',
  'flow_chart_completion',
  'short_answer',
];

/** Listening qismini tekshiradi */
export function validateListeningBlueprint(listening) {
  const errs = [];

  if (listening.length !== 4) errs.push(`Listening: ${listening.length} bo'lim (4 bo'lishi kerak)`);

  listening.forEach((s, idx) => {
    const label = `Part ${s.sectionNumber ?? idx + 1}`;
    if (s.questions.length !== 10) {
      errs.push(`${label}: ${s.questions.length} savol (10 bo'lishi kerak)`);
    }

    const blocks = blocksOf(s.questions);
    if (blocks.length > 4) errs.push(`${label}: ${blocks.length} blok — 4 tadan oshmasligi kerak`);
    for (const b of blocks) {
      if (b.questions.length < 2) {
        errs.push(`${label}: "${b.type}" bloki 1 ta savoldan iborat (kamida 2 ta)`);
      }
    }

    const types = blocks.map((b) => b.type);

    // Part 1 va Part 4 — to'ldirish turlari
    if (idx === 0 || idx === 3) {
      const wrong = types.filter((t) => !LISTENING_COMPLETION.includes(t));
      if (wrong.length) {
        errs.push(`${label} (to'ldirish bo'limi): mos kelmaydigan tur — ${wrong.join(', ')}`);
      }
    }

    // Part 2 va Part 3 — kamida bitta MCQ yoki matching bo'lishi kerak
    if (idx === 1 || idx === 2) {
      if (!types.some((t) => t === 'multiple_choice' || MATCHING_TYPES.includes(t))) {
        errs.push(`${label}: MCQ ham, matching ham yo'q — bu bo'lim ular uchun`);
      }
    }

    // Savol darajasidagi tekshiruv (Reading bilan bir xil qoidalar)
    for (const b of blocks) {
      const meta = metaOf(b.questions.find((q) => q.options)?.options);

      if (MATCHING_TYPES.includes(b.type)) {
        if (meta.items.length < 3) {
          errs.push(`${label}: "${b.type}" blokida variantlar ro'yxati yo'q (kamida 3 ta)`);
        }
        const letters = meta.items.map((o, i) => (o.match(/^\s*([A-Z])\s*[).:-]/) || [])[1] || String.fromCharCode(65 + i));
        for (const q of b.questions) {
          if (!letters.includes(String(q.answer).trim())) {
            errs.push(`${label}: "${q.text.slice(0, 40)}..." javobi "${q.answer}" variantlar ichida yo'q`);
          }
        }
      }

      if (b.type === 'multiple_choice') {
        for (const q of b.questions) {
          if (!q.options || q.options.length < 3) errs.push(`${label}: MC savolda 3+ variant kerak`);
        }
      }

      if (LISTENING_COMPLETION.includes(b.type)) {
        const limit = maxWords(meta.wordLimit);
        const numbersFree = /NUMBER/i.test(meta.wordLimit);
        for (const q of b.questions) {
          for (const alt of String(q.answer).split('|')) {
            const words = alt.trim().split(/\s+/).filter(Boolean)
              .filter((w) => !(numbersFree && /^[\d£$%.,:-]+$/.test(w)));
            if (words.length > limit) {
              errs.push(`${label}: "${alt.trim()}" javobi ${words.length} so'z — chegarasi "${meta.wordLimit}"`);
            }
          }
        }
      }
    }
  });

  const allTypes = listening.flatMap((s) => s.questions.map((q) => q.type));
  if (!allTypes.some((t) => MATCHING_TYPES.includes(t))) {
    errs.push('Listening testida birorta matching savoli yo\'q');
  }

  return errs;
}

/**
 * Javoblar transkriptda haqiqatan aytilganmi — audio qayta yozilmasligi uchun
 * eng muhim tekshiruv. To'ldirish javoblari transkript matnida bo'lishi shart.
 */
export function validateAgainstTranscript(listening, transcript) {
  const errs = [];
  if (!transcript) return ['transkript topilmadi'];

  for (const s of listening) {
    const section = transcript.sections.find((x) => x.sectionNumber === s.sectionNumber);
    if (!section) { errs.push(`Part ${s.sectionNumber}: transkript yo'q`); continue; }
    const spoken = section.lines.map((l) => l[1]).join(' ').toLowerCase().replace(/\s+/g, ' ');

    for (const q of s.questions) {
      if (!LISTENING_COMPLETION.includes(q.type)) continue;
      const alts = String(q.answer).split('|').map((a) => a.trim().toLowerCase()).filter(Boolean);
      // Sonlar transkriptda so'z bilan aytiladi ("twenty-four"), javobda esa raqam ("24") —
      // ularni bu yerda solishtirib bo'lmaydi, baholashda `numbersToDigits` hal qiladi.
      if (alts.every((a) => /\d/.test(a))) continue;
      if (!alts.some((a) => spoken.includes(a))) {
        errs.push(`Part ${s.sectionNumber}: "${alts[0]}" javobi transkriptda aytilmagan`);
      }
    }
  }
  return errs;
}
