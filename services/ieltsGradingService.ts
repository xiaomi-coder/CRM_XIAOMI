// IELTS Grading Service
// Writing va Speaking ni Vercel API Routes orqali baholash

import { IELTSWritingScore, IELTSSpeakingScore } from '../types';

// ========================
// WRITING GRADING (via API Route)
// ========================

export const gradeWritingTask1 = async (
    essayText: string,
    taskPrompt: string,
    graphImageUrl?: string,
    apiKey?: string
): Promise<IELTSWritingScore> => {
    try {
        const response = await fetch('/api/grade-writing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskNumber: 1,
                essayText,
                taskPrompt,
                graphImageUrl,
                apiKey
            })
        });

        if (!response.ok) {
            throw new Error(`Server xatosi: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Writing Task 1 grading error:', error);
        throw new Error('Baholashda xatolik yuz berdi. Iltimos qayta urining.');
    }
};

export const gradeWritingTask2 = async (
    essayText: string,
    taskPrompt: string,
    apiKey?: string
): Promise<IELTSWritingScore> => {
    try {
        const response = await fetch('/api/grade-writing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskNumber: 2,
                essayText,
                taskPrompt,
                apiKey
            })
        });

        if (!response.ok) {
            throw new Error(`Server xatosi: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Writing Task 2 grading error:', error);
        throw new Error('Baholashda xatolik yuz berdi. Iltimos qayta urining.');
    }
};

// ========================
// SPEAKING GRADING (via API Route)
// ========================

export const gradeSpeaking = async (
    audioBlob: Blob,
    part: 1 | 2 | 3,
    question: string,
    apiKey?: string
): Promise<IELTSSpeakingScore> => {
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'speaking.webm');
        formData.append('part', String(part));
        formData.append('question', question);
        if (apiKey) {
            formData.append('apiKey', apiKey);
        }

        const response = await fetch('/api/grade-speaking', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server xatosi: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Speaking grading error:', error);
        throw new Error('Baholashda xatolik yuz berdi. Audio formatini tekshiring.');
    }
};

// ========================
// BAND SCORE CALCULATIONS
// ========================

// Academic Reading Band Conversion
const ACADEMIC_READING_BANDS: Record<number, number> = {
    40: 9.0, 39: 9.0, 38: 8.5, 37: 8.5, 36: 8.0, 35: 8.0,
    34: 7.5, 33: 7.5, 32: 7.0, 31: 7.0, 30: 7.0,
    29: 6.5, 28: 6.5, 27: 6.5, 26: 6.0, 25: 6.0,
    24: 6.0, 23: 6.0, 22: 5.5, 21: 5.5, 20: 5.5,
    19: 5.5, 18: 5.0, 17: 5.0, 16: 5.0, 15: 5.0,
    14: 4.5, 13: 4.5, 12: 4.0, 11: 4.0, 10: 4.0,
    9: 3.5, 8: 3.5, 7: 3.0, 6: 3.0, 5: 2.5, 4: 2.5,
    3: 2.0, 2: 2.0, 1: 1.0, 0: 0
};

// General Training Reading Band Conversion
const GENERAL_READING_BANDS: Record<number, number> = {
    40: 9.0, 39: 8.5, 38: 8.0, 37: 7.5, 36: 7.5,
    35: 7.0, 34: 7.0, 33: 6.5, 32: 6.5, 31: 6.0,
    30: 6.0, 29: 5.5, 28: 5.5, 27: 5.5, 26: 5.0,
    25: 5.0, 24: 5.0, 23: 4.5, 22: 4.5, 21: 4.0,
    20: 4.0, 19: 4.0, 18: 3.5, 17: 3.5, 16: 3.5,
    15: 3.0, 14: 3.0, 13: 2.5, 12: 2.5, 11: 2.0,
    10: 2.0, 9: 1.5, 8: 1.5, 7: 1.0, 6: 1.0,
    5: 1.0, 4: 0.5, 3: 0.5, 2: 0, 1: 0, 0: 0
};

// Listening Band Conversion (same for Academic and General)
const LISTENING_BANDS: Record<number, number> = {
    40: 9.0, 39: 9.0, 38: 8.5, 37: 8.5, 36: 8.0, 35: 8.0,
    34: 7.5, 33: 7.5, 32: 7.5, 31: 7.0, 30: 7.0,
    29: 6.5, 28: 6.5, 27: 6.5, 26: 6.5, 25: 6.0,
    24: 6.0, 23: 6.0, 22: 5.5, 21: 5.5, 20: 5.5,
    19: 5.5, 18: 5.5, 17: 5.0, 16: 5.0, 15: 4.5,
    14: 4.5, 13: 4.5, 12: 4.0, 11: 4.0, 10: 4.0,
    9: 3.5, 8: 3.5, 7: 3.0, 6: 3.0, 5: 2.5, 4: 2.5,
    3: 2.0, 2: 2.0, 1: 1.0, 0: 0
};

export const getReadingBandScore = (correct: number, examType: 'academic' | 'general'): number => {
    const table = examType === 'academic' ? ACADEMIC_READING_BANDS : GENERAL_READING_BANDS;
    return table[Math.min(40, Math.max(0, correct))] ?? 0;
};

export const getListeningBandScore = (correct: number): number => {
    return LISTENING_BANDS[Math.min(40, Math.max(0, correct))] ?? 0;
};

export const calculateWritingOverall = (task1Score: number, task2Score: number): number => {
    const weighted = (task1Score + task2Score * 2) / 3;
    return Math.round(weighted * 2) / 2;
};

export const calculateSpeakingOverall = (
    fluency: number, lexical: number, grammar: number, pronunciation: number
): number => {
    const average = (fluency + lexical + grammar + pronunciation) / 4;
    return Math.round(average * 2) / 2;
};

export const calculateIELTSOverall = (
    reading: number, listening: number, writing: number, speaking: number
): number => {
    const average = (reading + listening + writing + speaking) / 4;
    return Math.round(average * 2) / 2;
};

export const bandToCEFR = (band: number): string => {
    if (band >= 8.5) return 'C2';
    if (band >= 7.0) return 'C1';
    if (band >= 5.5) return 'B2';
    if (band >= 4.0) return 'B1';
    if (band >= 3.0) return 'A2';
    return 'A1';
};

export const getBandDescription = (band: number): string => {
    if (band >= 8.5) return 'Expert User';
    if (band >= 8.0) return 'Very Good User';
    if (band >= 7.0) return 'Good User';
    if (band >= 6.0) return 'Competent User';
    if (band >= 5.0) return 'Modest User';
    if (band >= 4.0) return 'Limited User';
    if (band >= 3.0) return 'Extremely Limited User';
    return 'Non User';
};
