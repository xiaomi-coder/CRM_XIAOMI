/**
 * IELTS savol bloklari — rasmiy imtihon tuzilmasi.
 *
 * Haqiqiy IELTS'da savollar yakka-yakka turmaydi: bir xil turdagi ketma-ket savollar
 * BLOK hosil qiladi va har blok tepasida rasmiy ko'rsatma turadi, masalan:
 *
 *   Questions 1–7
 *   Do the following statements agree with the information given in the passage?
 *   Write TRUE / FALSE / NOT GIVEN.
 *
 * Bu modul bazadagi savollar ro'yxatini shunday bloklarga bo'ladi va har biriga
 * ko'rsatma matnini beradi. Baza sxemasi O'ZGARMAYDI — hamma narsa mavjud
 * `questionType` + `options` ustunlaridan kelib chiqadi.
 *
 * `options` da meta-yozuvlar (`@` bilan boshlanadi) — bu maxsus kelishuv:
 *   "@Match each measure with the correct city."  → blok ko'rsatmasining 1-qatori
 *   "@words:NO MORE THAN TWO WORDS"               → so'z chegarasi (default: ONE WORD ONLY)
 * Qolgan yozuvlar oddiy variantlar: "A) Barcelona", "B) Vienna", ...
 */

import { IELTSQuestionType } from '../types';

/** Javob harf tanlash orqali beriladigan turlar (A, B, C ...) */
export const LETTER_CHOICE_TYPES: string[] = [
    IELTSQuestionType.MATCHING_INFORMATION,
    IELTSQuestionType.MATCHING_FEATURES,
    IELTSQuestionType.MATCHING_HEADINGS,
];

/** Javob matn kiritish orqali beriladigan (so'z chegarasi bor) turlar */
export const COMPLETION_TYPES: string[] = [
    IELTSQuestionType.SENTENCE_COMPLETION,
    IELTSQuestionType.SUMMARY_COMPLETION,
    IELTSQuestionType.SHORT_ANSWER,
    IELTSQuestionType.NOTE_COMPLETION,
    IELTSQuestionType.FORM_COMPLETION,
    IELTSQuestionType.TABLE_COMPLETION,
    IELTSQuestionType.FLOW_CHART,
    IELTSQuestionType.DIAGRAM_LABEL,
];

export const DEFAULT_WORD_LIMIT = 'ONE WORD ONLY';

export interface ParsedOptions {
    /** Blok ko'rsatmasi uchun maxsus matn (`@...`), agar berilgan bo'lsa */
    prompt?: string;
    /** So'z chegarasi (`@words:...`), completion savollar uchun */
    wordLimit?: string;
    /** Ko'rsatiladigan variantlar: "A) Barcelona", ... */
    items: string[];
}

/** `options` massividagi meta-yozuvlarni oddiy variantlardan ajratadi */
export const parseOptions = (options?: string[] | null): ParsedOptions => {
    const result: ParsedOptions = { items: [] };
    for (const raw of options || []) {
        const opt = String(raw);
        if (!opt.startsWith('@')) {
            result.items.push(opt);
            continue;
        }
        if (opt.startsWith('@words:')) result.wordLimit = opt.slice('@words:'.length).trim();
        else result.prompt = opt.slice(1).trim();
    }
    return result;
};

/** Variant matnidan harf ajratadi: "A) Barcelona" → "A"; "Barcelona" → indeks bo'yicha */
export const optionLetter = (opt: string, index: number): string => {
    const m = opt.match(/^\s*([A-Z])\s*[).:-]/);
    return m ? m[1] : String.fromCharCode(65 + index);
};

/** Variant matnidan harf prefiksini olib tashlaydi: "A) Barcelona" → "Barcelona" */
export const optionLabel = (opt: string): string => opt.replace(/^\s*[A-Z]\s*[).:-]\s*/, '');

/** Ruxsat etilgan maksimal so'z soni ("ONE WORD ONLY" → 1, "NO MORE THAN TWO WORDS" → 2) */
export const maxWordsFor = (wordLimit: string): number => {
    const s = wordLimit.toUpperCase();
    if (s.includes('THREE')) return 3;
    if (s.includes('TWO')) return 2;
    return 1;
};

/** So'z chegarasi matnida raqam ham ruxsat etiladimi ("AND/OR A NUMBER") */
export const allowsNumber = (wordLimit: string): boolean => /NUMBER/i.test(wordLimit);

export interface QuestionBlock<Q> {
    questionType: string;
    /** Blokdagi savollar (raqami bo'yicha tartiblangan) */
    questions: Q[];
    firstNumber: number;
    lastNumber: number;
    /** "Questions 14–18" */
    rangeLabel: string;
    /** Rasmiy ko'rsatma matni (qator-qator) */
    instructions: string[];
    /** Harf tanlanadigan bloklarda umumiy variantlar ro'yxati */
    options: string[];
    /** Completion bloklarida so'z chegarasi */
    wordLimit?: string;
    /** "NB You may use any letter more than once." kerakmi */
    repeatNote: boolean;
}

const letterRangeLabel = (items: string[]): string => {
    if (items.length < 2) return 'A';
    const first = optionLetter(items[0], 0);
    const last = optionLetter(items[items.length - 1], items.length - 1);
    return items.length <= 4
        ? items.map((o, i) => optionLetter(o, i)).join(', ').replace(/, ([A-Z])$/, ' or $1')
        : `${first}–${last}`;
};

/** Blok uchun rasmiy ko'rsatma matni */
const instructionsFor = (
    questionType: string,
    parsed: ParsedOptions,
    range: string,
): string[] => {
    const wordLimit = parsed.wordLimit || DEFAULT_WORD_LIMIT;
    const letters = letterRangeLabel(parsed.items);

    switch (questionType) {
        case IELTSQuestionType.TRUE_FALSE_NOT_GIVEN:
            return [
                'Do the following statements agree with the information given in the passage?',
                `In boxes ${range} write:`,
                'TRUE — if the statement agrees with the information',
                'FALSE — if the statement contradicts the information',
                'NOT GIVEN — if there is no information on this',
            ];
        case IELTSQuestionType.YES_NO_NOT_GIVEN:
            return [
                'Do the following statements agree with the views of the writer?',
                `In boxes ${range} write:`,
                'YES — if the statement agrees with the views of the writer',
                'NO — if the statement contradicts the views of the writer',
                'NOT GIVEN — if it is impossible to say what the writer thinks about this',
            ];
        case IELTSQuestionType.MULTIPLE_CHOICE:
            return [`Choose the correct letter, ${letters || 'A, B, C or D'}.`];
        case IELTSQuestionType.MATCHING_INFORMATION:
            return [
                parsed.prompt || 'Which paragraph contains the following information?',
                `Write the correct letter, ${letters}, in boxes ${range} on your answer sheet.`,
            ];
        case IELTSQuestionType.MATCHING_FEATURES:
            return [
                parsed.prompt || 'Match each statement with the correct option.',
                `Write the correct letter, ${letters}, in boxes ${range} on your answer sheet.`,
            ];
        case IELTSQuestionType.MATCHING_HEADINGS:
            return [
                parsed.prompt || 'Choose the correct heading for each paragraph from the list of headings below.',
                `Write the correct letter, ${letters}, in boxes ${range} on your answer sheet.`,
            ];
        case IELTSQuestionType.SUMMARY_COMPLETION:
            return [
                parsed.prompt || 'Complete the summary below.',
                `Choose ${wordLimit} from the passage for each answer.`,
            ];
        case IELTSQuestionType.SHORT_ANSWER:
            return [
                parsed.prompt || 'Answer the questions below.',
                `Choose ${wordLimit} from the passage for each answer.`,
            ];
        case IELTSQuestionType.NOTE_COMPLETION:
            return [parsed.prompt || 'Complete the notes below.', `Write ${wordLimit} for each answer.`];
        case IELTSQuestionType.FORM_COMPLETION:
            return [parsed.prompt || 'Complete the form below.', `Write ${wordLimit} for each answer.`];
        case IELTSQuestionType.TABLE_COMPLETION:
            return [parsed.prompt || 'Complete the table below.', `Write ${wordLimit} for each answer.`];
        case IELTSQuestionType.FLOW_CHART:
            return [parsed.prompt || 'Complete the flow-chart below.', `Write ${wordLimit} for each answer.`];
        case IELTSQuestionType.DIAGRAM_LABEL:
            return [parsed.prompt || 'Label the diagram below.', `Write ${wordLimit} for each answer.`];
        case IELTSQuestionType.SENTENCE_COMPLETION:
        default:
            return [
                parsed.prompt || 'Complete the sentences below.',
                `Choose ${wordLimit} from the passage for each answer.`,
            ];
    }
};

/**
 * Ketma-ket bir xil turdagi savollarni bloklarga guruhlaydi.
 * Savollar `questionNumber` bo'yicha tartiblangan bo'lishi kutiladi.
 */
export function buildQuestionBlocks<
    Q extends { questionNumber: number; questionType: string; options?: string[] | null }
>(questions: Q[]): QuestionBlock<Q>[] {
    const sorted = [...questions].sort((a, b) => a.questionNumber - b.questionNumber);
    const blocks: QuestionBlock<Q>[] = [];

    for (const q of sorted) {
        const last = blocks[blocks.length - 1];
        if (last && last.questionType === q.questionType) {
            last.questions.push(q);
            continue;
        }
        blocks.push({
            questionType: q.questionType,
            questions: [q],
            firstNumber: q.questionNumber,
            lastNumber: q.questionNumber,
            rangeLabel: '',
            instructions: [],
            options: [],
            repeatNote: false,
        });
    }

    for (const block of blocks) {
        block.firstNumber = block.questions[0].questionNumber;
        block.lastNumber = block.questions[block.questions.length - 1].questionNumber;
        block.rangeLabel =
            block.firstNumber === block.lastNumber
                ? `Question ${block.firstNumber}`
                : `Questions ${block.firstNumber}–${block.lastNumber}`;

        // Blok darajasidagi variantlar/meta — blokdagi eng to'liq options'dan olinadi
        const richest = block.questions.reduce<string[] | null>(
            (best, q) => ((q.options?.length || 0) > (best?.length || 0) ? q.options || null : best),
            null,
        );
        const parsed = parseOptions(richest);
        const range = `${block.firstNumber}–${block.lastNumber}`;

        if (LETTER_CHOICE_TYPES.includes(block.questionType)) {
            block.options = parsed.items;
            block.repeatNote = block.questions.length > parsed.items.length;
        }
        if (COMPLETION_TYPES.includes(block.questionType)) {
            block.wordLimit = parsed.wordLimit || DEFAULT_WORD_LIMIT;
        }
        block.instructions = instructionsFor(block.questionType, parsed, range);
    }

    return blocks;
}

const UNITS: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
    seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = {
    twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const SCALES: Record<string, number> = { hundred: 100, thousand: 1000, million: 1000000 };
/** Tartib sonlar: "fourteenth" → "fourteen" + "th" belgisi */
const ORDINALS: Record<string, string> = {
    first: 'one', second: 'two', third: 'three', fifth: 'five', eighth: 'eight', ninth: 'nine',
    twelfth: 'twelve', twentieth: 'twenty', thirtieth: 'thirty', fortieth: 'forty', fiftieth: 'fifty',
};

const wordToNumber = (words: string[]): number | null => {
    let total = 0;
    let current = 0;
    let seen = false;
    for (const w of words) {
        if (w === 'and') continue;
        if (UNITS[w] !== undefined) { current += UNITS[w]; seen = true; }
        else if (TENS[w] !== undefined) { current += TENS[w]; seen = true; }
        else if (SCALES[w] !== undefined) {
            if (SCALES[w] === 100) current = (current || 1) * 100;
            else { total += (current || 1) * SCALES[w]; current = 0; }
            seen = true;
        } else return null;
    }
    return seen ? total + current : null;
};

/**
 * Son bildiruvchi so'zlarni raqamga aylantiradi: "twenty-four" → "24",
 * "nine thousand" → "9000", "fourteenth" → "14th".
 * IELTS'da talaba eshitgan sonni raqam bilan ham, so'z bilan ham yozishi mumkin —
 * ikkalasi ham to'g'ri hisoblanadi.
 */
export const numbersToDigits = (text: string): string => {
    // "a hundred and twenty" = "one hundred and twenty"
    const tokens = text.replace(/\ba (hundred|thousand|million)\b/g, 'one $1').split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let buffer: string[] = [];
    let ordinal = false;

    const flush = () => {
        if (!buffer.length) return;
        const value = wordToNumber(buffer);
        if (value === null) out.push(...buffer);
        else out.push(ordinal ? `${value}${['th', 'st', 'nd', 'rd'][value % 10 > 3 || (value % 100 >= 11 && value % 100 <= 13) ? 0 : value % 10]}` : String(value));
        buffer = [];
        ordinal = false;
    };

    for (const raw of tokens) {
        // "twenty-four" kabi defisli sonlar ham bo'linadi
        const parts = raw.split('-');
        let consumed = true;
        for (const part of parts) {
            let w = part;
            if (ORDINALS[w]) { w = ORDINALS[w]; ordinal = true; }
            else if (/^(.*?)(ieth|th)$/.test(w)) {
                const stem = w.replace(/ieth$/, 'y').replace(/th$/, '');
                if (UNITS[stem] !== undefined || TENS[stem] !== undefined) { w = stem; ordinal = true; }
            }
            if (UNITS[w] !== undefined || TENS[w] !== undefined || SCALES[w] !== undefined || (w === 'and' && buffer.length)) {
                buffer.push(w);
            } else { consumed = false; break; }
        }
        if (!consumed) { flush(); out.push(raw); }
    }
    flush();
    return out.join(' ');
};

/**
 * Javobni solishtirish uchun normallashtirish.
 * IELTS'da katta/kichik harf, ortiqcha bo'sh joy va sonning yozilish shakli
 * (raqam yoki so'z) hisobga olinmaydi.
 */
export const normalizeAnswer = (value: string): string =>
    numbersToDigits(
        String(value ?? '')
            .trim()
            .toLowerCase()
            .replace(/[.,;:!?]+$/g, '')
            .replace(/\s+/g, ' ')
    );

/**
 * Javob to'g'rimi? `correctAnswer` da `|` bilan bir nechta qabul qilinadigan
 * variant berilishi mumkin: "membranes|membrane".
 */
export const isAnswerCorrect = (userAnswer: string, correctAnswer: string): boolean => {
    const user = normalizeAnswer(userAnswer);
    if (!user) return false;
    return String(correctAnswer ?? '')
        .split('|')
        .map(normalizeAnswer)
        .filter(Boolean)
        .includes(user);
};

/** Kiritilgan javob so'z chegarasidan oshganmi? (ogohlantirish uchun) */
export const exceedsWordLimit = (value: string, wordLimit: string): boolean => {
    const words = String(value ?? '').trim().split(/\s+/).filter(Boolean);
    if (!words.length) return false;
    const allowed = maxWordsFor(wordLimit);
    const counted = allowsNumber(wordLimit) ? words.filter(w => !/^\d+([.,]\d+)?$/.test(w)) : words;
    return counted.length > allowed;
};

/**
 * Passaj matnini xatboshilarga ajratadi. Agar xatboshi oldida yakka harf
 * (A, B, C ...) qatori tursa — bu IELTS'dagi belgilangan paragraf harfi.
 */
export const splitLabelledParagraphs = (text: string): { letter?: string; body: string }[] => {
    const chunks = String(text ?? '')
        .split(/\n\s*\n/)
        .map(chunk => chunk.trim())
        .filter(Boolean);

    const out: { letter?: string; body: string }[] = [];
    let pending: string | undefined;

    for (const chunk of chunks) {
        // Harf alohida qatorda turishi mumkin ("A" \n\n matn) yoki matn bilan bitta blokda
        if (/^[A-Z]$/.test(chunk)) {
            pending = chunk;
            continue;
        }
        const inline = chunk.match(/^([A-Z])\s*\n+([\s\S]+)$/);
        if (inline) {
            out.push({ letter: inline[1], body: inline[2].trim() });
            pending = undefined;
            continue;
        }
        out.push({ letter: pending, body: chunk });
        pending = undefined;
    }

    return out;
};
