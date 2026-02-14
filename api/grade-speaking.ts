import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm, File } from 'formidable';
import fs from 'fs';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const config = {
    api: { bodyParser: false }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    //     if (!GEMINI_API_KEY) {
    //         return res.status(500).json({ error: 'Gemini API key topilmadi.' });
    //     }

    try {
        // Parse multipart form data
        const form = new IncomingForm();
        const { fields, files } = await new Promise<{ fields: any; files: any }>((resolve, reject) => {
            form.parse(req as any, (err, fields, files) => {
                if (err) reject(err);
                else resolve({ fields, files });
            });
        });

        const part = fields.part?.[0] || fields.part || '1';
        const question = fields.question?.[0] || fields.question || 'General speaking assessment';
        const apiKey = fields.apiKey?.[0] || fields.apiKey;
        const audioFile = (files.audio?.[0] || files.audio) as File | undefined;

        const activeApiKey = apiKey || GEMINI_API_KEY;

        if (!activeApiKey) {
            return res.status(500).json({ error: 'Gemini API key topilmadi.' });
        }

        let audioBase64 = '';
        let mimeType = 'audio/webm';

        if (audioFile && audioFile.filepath) {
            const buffer = fs.readFileSync(audioFile.filepath);
            audioBase64 = buffer.toString('base64');
            mimeType = audioFile.mimetype || 'audio/webm';
        }

        const systemPrompt = `You are an experienced IELTS Speaking examiner. Analyze this speaking audio and grade it according to official IELTS band descriptors.

SPEAKING CRITERIA:
- Fluency and Coherence: How smoothly and logically the candidate speaks, use of discourse markers, hesitation, repetition.
- Lexical Resource: Range, accuracy and appropriacy of vocabulary.
- Grammatical Range and Accuracy: Variety and correctness of grammatical structures.
- Pronunciation: Individual sounds, word stress, intonation, intelligibility.

This is Part ${part} of the speaking test.
Question: ${question}

First, transcribe what the candidate said, then evaluate using IELTS criteria.

IMPORTANT: Return ONLY valid JSON (no markdown, no backticks):
{
  "fluencyCoherence": 6.5,
  "lexicalResource": 6.0,
  "grammaticalRange": 6.0,
  "pronunciation": 6.5,
  "overallBand": 6.0,
  "transcription": "What the candidate said...",
  "feedback": "Detailed feedback in 2-3 sentences...",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeApiKey}`;

        const parts: any[] = [{ text: systemPrompt }];

        if (audioBase64) {
            parts.push({
                inlineData: {
                    mimeType,
                    data: audioBase64
                }
            });
        }

        const geminiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
            })
        });

        if (!geminiRes.ok) {
            const err = await geminiRes.text();
            console.error('Gemini API error:', err);
            return res.status(502).json({ error: 'Gemini API xatosi' });
        }

        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        let clean = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(clean);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Grade speaking error:', error);
        return res.status(500).json({ error: 'Baholashda xatolik: ' + (error.message || 'Unknown') });
    }
}
