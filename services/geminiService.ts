
import { GoogleGenAI } from "@google/genai";
import { Student, Payment, Attendance, Group } from '../types';

export const analyzeDataWithAI = async (
  students: Student[],
  payments: Payment[],
  groups: Group[],
  attendance: Attendance[]
): Promise<string> => {
  // Vercel uchun VITE_API_KEY yoki oddiy API_KEY ni tekshiramiz
  const apiKey = (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.API_KEY || process.env.API_KEY;

  if (!apiKey) {
    return "AI tahlili uchun API kalit topilmadi. Vercel sozlamalarida VITE_API_KEY ni tekshiring.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
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
