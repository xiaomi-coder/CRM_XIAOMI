import { Student, Attendance, StudentStatus } from '../types';

/**
 * "Ketib qolish" xavfi tahlili — qoidaviy bashorat (v1).
 *
 * Uch belgi kuzatiladi (barchasi bazada allaqachon yig'iladigan ma'lumotdan):
 *   1. Ketma-ket kelmaslik — oxirgi belgilangan darslardan boshlab 3+ ABSENT;
 *   2. Davomat pasayishi — so'nggi 14 kunda (kamida 3 dars belgilangan) 50% dan past;
 *   3. To'lov kechikishi — nextPaymentDate 7+ kun o'tib ketgan.
 *
 * Ball: streak=3, davomat=2, to'lov=2. 4+ = YUQORI, 2-3 = O'RTA.
 * Xuddi shu qoidalar serverda ham bor (db/11-churn-risk.sql) — haftalik
 * hisobot direktorning botiga shu asosda boradi. O'zgartirsangiz ikkala
 * joyni birga o'zgartiring.
 */

export interface RiskStudent {
  student: Student;
  level: 'HIGH' | 'MEDIUM';
  score: number;
  factors: string[];
}

const PRESENT_STATUSES = ['PRESENT', 'LATE', 'DISMISSED'];

export function computeChurnRisk(students: Student[], attendance: Attendance[]): RiskStudent[] {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const cutoff14 = new Date(today.getTime() - 14 * 86400000).toISOString().split('T')[0];

  // O'quvchi bo'yicha davomat, yangi darsi birinchi
  const byStudent = new Map<string, Attendance[]>();
  for (const a of attendance) {
    if (!a.date || !a.studentId) continue;
    const list = byStudent.get(a.studentId) || [];
    list.push(a);
    byStudent.set(a.studentId, list);
  }
  byStudent.forEach(list => list.sort((a, b) => b.date.localeCompare(a.date)));

  const result: RiskStudent[] = [];

  for (const s of students) {
    if (s.status && s.status !== StudentStatus.ACTIVE) continue;

    let score = 0;
    const factors: string[] = [];
    const lessons = byStudent.get(s.id) || [];

    // 1) Ketma-ket kelmaslik (eng yangi darslardan boshlab)
    let streak = 0;
    for (const lesson of lessons) {
      if (lesson.status === 'ABSENT') streak++;
      else break;
    }
    if (streak >= 3) {
      score += 3;
      factors.push(`${streak} dars ketma-ket kelmagan`);
    }

    // 2) So'nggi 14 kunda davomat pasaygan
    const recent = lessons.filter(l => l.date >= cutoff14 && l.date <= todayKey);
    if (recent.length >= 3) {
      const present = recent.filter(l => PRESENT_STATUSES.includes(l.status)).length;
      const percent = Math.round((present / recent.length) * 100);
      if (percent < 50) {
        score += 2;
        factors.push(`2 haftalik davomat ${percent}%`);
      }
    }

    // 3) To'lov 7+ kun kechikkan
    if (s.nextPaymentDate && /^\d{4}-\d{2}-\d{2}/.test(s.nextPaymentDate)) {
      const overdueDays = Math.floor(
        (today.getTime() - new Date(s.nextPaymentDate).getTime()) / 86400000
      );
      if (overdueDays >= 7) {
        score += 2;
        factors.push(`To'lov ${overdueDays} kun kechikkan`);
      }
    }

    if (score >= 2) {
      result.push({ student: s, score, factors, level: score >= 4 ? 'HIGH' : 'MEDIUM' });
    }
  }

  return result.sort((a, b) => b.score - a.score);
}
