import type { VercelRequest, VercelResponse } from '@vercel/node';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { taskNumber, essayText, taskPrompt, graphImageUrl, apiKey } = req.body;

        const activeApiKey = apiKey || GEMINI_API_KEY;

        if (!activeApiKey) {
            return res.status(500).json({ error: 'Gemini API key topilmadi. Sozlamalarni tekshiring.' });
        }

        if (!essayText || !taskPrompt) {
            return res.status(400).json({ error: 'essayText va taskPrompt majburiy' });
        }

        const wordCount = essayText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

        const isTask1 = taskNumber === 1;
        const minWords = isTask1 ? 150 : 250;

        const systemPrompt = isTask1
            ? `You are an experienced IELTS Writing examiner. Grade this Task 1 response according to official IELTS band descriptors.

TASK 1 CRITERIA:
- Task Achievement: How well the candidate summarises the information, identifies key features, makes comparisons.
- Coherence and Cohesion: Logical organization, paragraphing, use of cohesive devices.
- Lexical Resource: Range and accuracy of vocabulary.
- Grammatical Range and Accuracy: Variety and correctness of sentence structures.

Word count: ${wordCount} (minimum required: ${minWords})
${wordCount < minWords ? `WARNING: The response is under the minimum word count. This should negatively affect the Task Achievement score.` : ''}

Task prompt: ${taskPrompt}

Student's response:
${essayText}

IMPORTANT: Return ONLY valid JSON (no markdown, no backticks):
{
  "taskAchievement": 7.0,
  "coherenceCohesion": 6.5,
  "lexicalResource": 7.0,
  "grammaticalRange": 6.5,
  "overallBand": 6.5,
  "feedback": "Detailed feedback in 2-3 sentences...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "wordCount": ${wordCount}
}`
            : `You are an experienced IELTS Writing examiner. Grade this Task 2 essay according to official IELTS band descriptors.

TASK 2 CRITERIA:
- Task Response: How well the candidate addresses the question, develops a position, supports ideas.
- Coherence and Cohesion: Logical organization, paragraphing, use of cohesive devices.
- Lexical Resource: Range and accuracy of vocabulary.
- Grammatical Range and Accuracy: Variety and correctness of sentence structures.

Word count: ${wordCount} (minimum required: ${minWords})
${wordCount < minWords ? `WARNING: The response is under the minimum word count. This should negatively affect the Task Response score.` : ''}

Task prompt: ${taskPrompt}

Student's essay:
${essayText}

IMPORTANT: Return ONLY valid JSON (no markdown, no backticks):
{
  "taskAchievement": 7.0,
  "coherenceCohesion": 6.5,
  "lexicalResource": 7.0,
  "grammaticalRange": 6.5,
  "overallBand": 6.5,
  "feedback": "Detailed feedback in 2-3 sentences...",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "wordCount": ${wordCount}
}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeApiKey}`;

        const geminiRes = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
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

        // Clean response
        let clean = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(clean);

        return res.status(200).json(result);
    } catch (error: any) {
        console.error('Grade writing error:', error);
        return res.status(500).json({ error: 'Baholashda xatolik: ' + (error.message || 'Unknown') });
    }
}
