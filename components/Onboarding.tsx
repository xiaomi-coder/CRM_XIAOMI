import React, { useState } from 'react';
import { Check, ChevronRight, X, Rocket } from 'lucide-react';
import { Student, Group, Attendance, Payment } from '../types';

/**
 * Yangi markaz uchun boshlang'ich ro'yxat (Boshqaruv panelining tepasida).
 *
 * Nega kerak: ro'yxatdan o'tgan direktor BO'SH Boshqaruv panelini ko'radi va
 * nimadan boshlashni bilmaydi. Bazadagi holat shuni ko'rsatdi — markazlar
 * o'quvchi kiritib, guruh yaratmasdan yoki davomat belgilamasdan to'xtab
 * qolgan, birorta ham to'lov kiritilmagan.
 *
 * `DemoTour` dan farqi: u shunchaki "qaysi bo'limga kirdingiz" ni sanaydi.
 * Bu yerda esa har qadam HAQIQIY ma'lumotdan tekshiriladi — bo'limga kirib
 * chiqish yetarli emas, ish bajarilishi kerak.
 *
 * Hammasi bajarilgach blok o'zi yo'qoladi.
 */

interface OnboardingProps {
  t: any;
  students: Student[];
  groups: Group[];
  attendance: Attendance[];
  payments: Payment[];
  /** Sozlamalarda Telegram bot ulanganmi */
  botUsername?: string;
  centerId: string;
  onGoTo: (tab: string) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({
  t, students, groups, attendance, payments, botUsername, centerId, onGoTo,
}) => {
  const storageKey = `onboarding_hidden_${centerId}`;
  const [hidden, setHidden] = useState(() => localStorage.getItem(storageKey) === '1');

  // Qadamlar tartibi ishning tabiiy oqimi bo'yicha
  const steps = [
    {
      tab: 'groups',
      done: groups.length > 0,
      title: t.ob_group_title || 'Guruh yarating',
      desc: t.ob_group_desc || "Fan, o'qituvchi, dars kunlari va oylik narx.",
    },
    {
      tab: 'students',
      done: students.length > 0,
      title: t.ob_student_title || "O'quvchi qo'shing",
      desc: t.ob_student_desc || "Ism, telefon va ota-onaning telefoni.",
    },
    {
      tab: 'groups',
      done: groups.some(g => (g.studentIds?.length || 0) > 0),
      title: t.ob_assign_title || "O'quvchini guruhga biriktiring",
      desc: t.ob_assign_desc || "Guruh kartasidagi \"Yangi o'quvchi\" tugmasi orqali.",
    },
    {
      tab: 'attendance',
      done: attendance.length > 0,
      title: t.ob_attendance_title || 'Davomat belgilang',
      desc: t.ob_attendance_desc || "Keldi / kelmadi / kechikdi — bir bosishda.",
    },
    {
      tab: 'settings',
      done: !!botUsername,
      title: t.ob_bot_title || 'Telegram botni ulang',
      desc: t.ob_bot_desc || "Ota-onalar davomat va to'lov xabarlarini shu bot orqali oladi.",
    },
    {
      tab: 'payments',
      done: payments.length > 0,
      title: t.ob_payment_title || 'Birinchi to\'lovni kiriting',
      desc: t.ob_payment_desc || "Shundan keyin qarzdorlar avtomatik ko'rinadi.",
    },
  ];

  const doneCount = steps.filter(s => s.done).length;

  // Hammasi bajarilgan bo'lsa blok umuman kerak emas
  if (hidden || doneCount === steps.length) return null;

  const dismiss = () => {
    localStorage.setItem(storageKey, '1');
    setHidden(true);
  };

  // Keyingi bajarilmagan qadam — u ajratib ko'rsatiladi
  const nextIdx = steps.findIndex(s => !s.done);

  return (
    <div className="bg-surface border border-line rounded-card shadow-e1 p-5 mb-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 min-w-0">
          <span className="w-9 h-9 rounded-md bg-primary-subtle text-primary flex items-center justify-center shrink-0">
            <Rocket size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-ink">
              {t.ob_title || 'Boshlash uchun 6 qadam'}
            </h3>
            <p className="text-[12.5px] text-ink-2 mt-0.5">
              {t.ob_subtitle || 'Shu qadamlar bajarilgach markaz to\'liq ishlay boshlaydi.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[12.5px] font-semibold text-ink-2 tabular-nums">
            {doneCount}/{steps.length}
          </span>
          <button
            onClick={dismiss}
            title={t.close || 'Yopish'}
            className="p-1.5 rounded-md text-muted hover:text-ink-2 hover:bg-canvas transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Bajarilish chizig'i */}
      <div className="h-1.5 bg-canvas rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {steps.map((s, i) => (
          <button
            key={i}
            onClick={() => onGoTo(s.tab)}
            className={`flex items-start gap-2.5 p-3 rounded-md border text-left transition-colors
              ${s.done
                ? 'border-line bg-canvas'
                : i === nextIdx
                  ? 'border-primary bg-primary-subtle hover:bg-[#DDE3FC]'
                  : 'border-line hover:bg-canvas'}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-px text-[11px] font-semibold
                ${s.done ? 'bg-success text-white' : 'bg-white border border-line-strong text-muted'}`}
            >
              {s.done ? <Check size={12} /> : i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-semibold ${s.done ? 'text-muted line-through' : 'text-ink'}`}>
                {s.title}
              </span>
              {!s.done && (
                <span className="block text-[12px] text-ink-2 mt-0.5 leading-snug">{s.desc}</span>
              )}
            </span>
            {!s.done && <ChevronRight size={15} className="text-muted shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Onboarding;
