import React, { useState } from 'react';
import { X, Compass, ChevronRight, BookOpen } from 'lucide-react';

/**
 * Demo rejimidagi qisqa yo'l ko'rsatkich — 4 qadam.
 * Batafsil qo'llanma alohida /guide sahifasida (shu yerdan havola).
 */
const STEPS: { tab: string; title: string; desc: string }[] = [
  { tab: 'groups',     title: "Guruhlar",    desc: "Guruh oching: fan, o'qituvchi, dars kunlari va oylik narx." },
  { tab: 'students',   title: "O'quvchilar", desc: "O'quvchi qo'shing va uni guruhga biriktiring." },
  { tab: 'attendance', title: "Davomat",     desc: "Bugungi darsni belgilang — keldi / kelmadi / kechikdi." },
  { tab: 'payments',   title: "To'lovlar",   desc: "To'lov qabul qiling — qarzdorlar avtomatik ko'rinadi." },
];

interface DemoTourProps {
  activeTab: string;
  onGoTo: (tab: string) => void;
}

const DemoTour: React.FC<DemoTourProps> = ({ activeTab, onGoTo }) => {
  const [closed, setClosed] = useState(false);
  const [minimized, setMinimized] = useState(false);

  if (closed) return null;

  const doneCount = STEPS.findIndex(s => s.tab === activeTab);
  const visited = doneCount === -1 ? 0 : doneCount;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-[90] bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl shadow-emerald-600/30 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform"
      >
        <Compass size={16} /> Demo yo'lboshchi
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[90] w-[320px] bg-slate-900 text-white rounded-[1.75rem] shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
      <div className="p-5 pb-4 flex items-start justify-between bg-gradient-to-r from-emerald-600 to-teal-600">
        <div>
          <p className="font-black text-sm uppercase tracking-wide flex items-center gap-2">
            <Compass size={16} /> Demo rejim
          </p>
          <p className="text-[10px] text-white/80 font-bold mt-1">
            4 qadamda sinab ko'ring. Ma'lumotlar har kuni tozalanadi.
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setMinimized(true)} className="p-1.5 hover:bg-white/15 rounded-lg transition-colors" title="Yig'ish">—</button>
          <button onClick={() => setClosed(true)} className="p-1.5 hover:bg-white/15 rounded-lg transition-colors" title="Yopish"><X size={14} /></button>
        </div>
      </div>

      <div className="p-4 space-y-1.5">
        {STEPS.map((s, i) => {
          const active = s.tab === activeTab;
          return (
            <button
              key={s.tab}
              onClick={() => onGoTo(s.tab)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 group ${active ? 'bg-emerald-500/15 border border-emerald-400/30' : 'hover:bg-white/5 border border-transparent'}`}
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${active ? 'bg-emerald-500 text-white' : i < visited ? 'bg-emerald-500/25 text-emerald-300' : 'bg-white/10 text-white/50'}`}>
                {i + 1}
              </span>
              <span>
                <span className={`block text-xs font-black ${active ? 'text-emerald-300' : 'text-white/90'}`}>{s.title}</span>
                <span className="block text-[10px] text-white/50 font-semibold leading-snug mt-0.5">{s.desc}</span>
              </span>
              <ChevronRight size={14} className="ml-auto mt-1 text-white/30 group-hover:text-white/60 shrink-0" />
            </button>
          );
        })}
      </div>

      <a
        href="/guide"
        target="_blank"
        rel="noreferrer"
        className="block m-4 mt-0 p-3 bg-white/5 hover:bg-white/10 rounded-xl text-center text-[10px] font-black uppercase tracking-widest text-emerald-300 transition-colors"
      >
        <BookOpen size={13} className="inline mr-1.5 -mt-0.5" /> Batafsil qo'llanma
      </a>
    </div>
  );
};

export default DemoTour;
