
// @google/genai ~254 KB — bosh sahifada kerak emas. Faqat AI tahlil
// bosilganda yuklanadi (dinamik import).
import { Student, Payment, Attendance, Group } from '../types';

export const analyzeDataWithAI = async (
  students: Student[],
  payments: Payment[],
  groups: Group[],
  attendance: Attendance[],
  apiKey?: string
): Promise<string> => {
  // 1. Parametrda kelgan kalit
  // 2. Vercel env
  // 3. Process env
  const activeKey = apiKey || (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!activeKey) {
    return "AI tahlili uchun API kalit topilmadi. Sozlamalar bo'limidan kalit kiriting yoki Vercel sozlamalarini tekshiring.";
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey: activeKey });

  const prompt = `
    Quyidagi o'quv markazi ma'lumotlarini tahlil qiling va o'zbek tilida qisqacha hisobot bering:
    1. O'quvchilar soni: ${students.length}
    2. Guruhlar soni: ${groups.length}
    3. Umumiy to'lovlar summasi: ${payments.reduce((sum, p) => sum + p.amount, 0)} so'm
    4. Oxirgi 10 ta davomat holati: ${attendance.slice(-10).map(a => a.status).join(', ')}

    Iltimos, o'sish dinamikasi, muammoli jihatlar va takliflar bering.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text || "Tahlil yakunlandi, lekin javob bo'sh qaytdi.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI xizmati hozirda band yoki kalitda xatolik bor.";
  }
};
