
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Wallet, CalendarCheck, Settings as SettingsIcon,
  BrainCircuit, LogOut, Banknote, Receipt, Archive, UserSquare, Clock, Calendar, Layers, ShieldAlert, Megaphone, UserPlus, FileQuestion, Trophy
} from 'lucide-react';
import { User, UserRole } from '../types';
import { translations, Language } from '../services/languageContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, onLogout }) => {
  const [lang] = useState<Language>(() => (localStorage.getItem('edu_lang') as Language) || 'uz');
  const [currentTime, setCurrentTime] = useState(new Date());

  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatClock = (date: Date) => {
    const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    return date.toLocaleTimeString(locale, { hour12: false });
  };
  const handleLanguageChange = (newLang: Language) => {
    localStorage.setItem('edu_lang', newLang);
    window.location.reload();
  };

  const formatDate = (date: Date) => {
    const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase();
    return { dateStr: `${day}.${month}.${year}`, weekday };
  };

  const { dateStr, weekday } = formatDate(currentTime);

  const isDirector = user.role === UserRole.DIRECTOR;
  const isTeacher = user.role === UserRole.TEACHER;
  const isSuper = user.role === UserRole.SUPER_ADMIN;

  const roleLabel = isSuper ? (t.role_creator || 'Creator') : (isDirector ? (t.role_director || 'Director') : (t.role_teacher || 'Teacher'));

  const creatorSections = [
    {
      title: t.global_control,
      items: [
        { id: 'creator_dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'super_centers', label: t.centers, icon: Layers },
        { id: 'broadcast', label: t.broadcast, icon: Megaphone },
        { id: 'system_logs', label: t.logs, icon: ShieldAlert },
      ]
    }
  ];

  const standardSections = [];

  if (isDirector) {
    standardSections.push({
      title: t.main,
      items: [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'leads', label: t.leads, icon: UserPlus }
      ]
    });
  }

  const educationItems = [
    { id: 'students', label: t.students, icon: Users },
    { id: 'groups', label: t.groups, icon: BrainCircuit },
    { id: 'attendance', label: t.attendance, icon: CalendarCheck },
  ];

  if (isTeacher) {
    educationItems.push({ id: 'tests', label: t.tests, icon: FileQuestion });
  }

  educationItems.push({ id: 'archive', label: t.archive, icon: Archive });
  educationItems.push({ id: 'results', label: t.results_section || 'Natijalar', icon: Trophy });

  standardSections.push({ title: t.education, items: educationItems });

  const financeItems = [];
  if (isDirector) {
    financeItems.push({ id: 'payments', label: t.payments, icon: Wallet });
    financeItems.push({ id: 'salary', label: t.salary, icon: Banknote });
    financeItems.push({ id: 'expenses', label: t.expenses, icon: Receipt });
  } else if (isTeacher) {
    financeItems.push({ id: 'salary', label: t.salary, icon: Banknote });
  }

  if (financeItems.length > 0) {
    standardSections.push({ title: t.finance, items: financeItems });
  }

  if (isDirector) {
    standardSections.push({ title: t.team, items: [{ id: 'staff', label: t.staff, icon: UserSquare }] });
  }

  const sections = isSuper ? creatorSections : standardSections;

  return (
    <div className="flex min-h-screen bg-[#f8f9fc]">
      <aside className="w-72 bg-[#0a0d14] text-white flex flex-col fixed h-full z-20 shadow-2xl">
        <div className="p-8 flex items-center space-x-4 border-b border-white/5">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
            <BrainCircuit size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter italic uppercase leading-none">EDUCONTROL</h1>
            <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1.5">Professional CRM</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-8 space-y-8 overflow-y-auto custom-scrollbar">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="px-4 text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">{section.title}</h3>
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-5 py-4 rounded-2xl transition-all duration-300 group ${activeTab === item.id ? 'bg-[#ffc107] text-black shadow-xl scale-[1.02]' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  <item.icon size={18} className={activeTab === item.id ? 'stroke-[2.5px]' : 'opacity-40'} />
                  <span className={`text-[12px] ${activeTab === item.id ? 'font-black' : 'font-bold uppercase tracking-tight'}`}>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-white/[0.02]">
          {isDirector && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl mb-4 transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
            >
              <SettingsIcon size={18} className={activeTab === 'settings' ? 'text-white' : 'text-indigo-400'} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.system_settings}</span>
            </button>
          )}

          <div className="flex items-center gap-4 px-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center font-black text-indigo-400 border border-indigo-500/20">
              {user.name.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-black text-white truncate">{user.name}</span>
              <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest truncate">{roleLabel}</span>
            </div>
          </div>

          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase text-red-500/60 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all">
            <LogOut size={14} /> <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-10">
        <header className="mb-10 flex items-center justify-between bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
          <div className="flex flex-col">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.5em] mb-1.5 ml-1">{t.online_system}</p>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">
              {activeTab === 'settings' ? t.system_settings : (sections.flatMap(s => s.items).find(i => i.id === activeTab)?.label || t.dashboard)}
            </h2>
          </div>
          <div className="bg-[#0a0d14] px-10 py-5 rounded-[2rem] shadow-2xl flex items-center gap-10 border border-white/5">
            <div className="flex items-center gap-8 border-r border-white/10 pr-10">
              <div className="flex items-center gap-4">
                <Clock className="text-indigo-500" size={24} />
                <span className="text-3xl font-black text-white font-mono tracking-widest">{formatClock(currentTime)}</span>
              </div>
              <div className="flex bg-white/5 p-1 rounded-xl">
                {(['uz', 'ru', 'en'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => handleLanguageChange(l)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${lang === l ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Calendar className="text-amber-400" size={20} />
              <div className="flex flex-col text-white">
                <span className="text-[13px] font-black leading-none">{dateStr}</span>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1.5 italic transition-all">{weekday}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
