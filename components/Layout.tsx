
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Wallet, CalendarCheck, Settings as SettingsIcon,
  BrainCircuit, LogOut, Banknote, Receipt, Archive, UserSquare, Clock, Calendar, Layers, ShieldAlert, Megaphone, UserPlus, FileQuestion, Trophy, GraduationCap, ClipboardList, Menu, X
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

  // Tor ekranda yon menyu tortma (drawer) bo'lib ochiladi.
  // Avval 240px menyu telefonda ham doim ochiq turardi va sahifani
  // ekrandan chiqarib yuborardi (375px da sahifa 529px bo'lib ketardi).
  const [navOpen, setNavOpen] = useState(false);

  // Bo'lim tanlangach tortma yopiladi (aks holda tanlangan ekran ko'rinmaydi)
  const goTo = (tab: string) => {
    setActiveTab(tab);
    setNavOpen(false);
  };

  const t = translations[lang];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setNavOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
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
  const isAdmin = user.role === UserRole.ADMIN;
  const isTeacher = user.role === UserRole.TEACHER;
  const isSuper = user.role === UserRole.SUPER_ADMIN;

  const roleLabel = isSuper ? (t.role_creator || 'Creator') : (isDirector ? (t.role_director || 'Director') : (isAdmin ? (t.role_admin || 'Admin') : (t.role_teacher || 'Teacher')));

  const perms = user.permissions || {};
  const hasPermission = (key: string): boolean => {
    if (isSuper || isDirector) return true;
    if (Object.keys(perms).length > 0) return perms[key] === true;
    if (isAdmin) return key !== 'settings';
    if (isTeacher) return ['students', 'groups', 'attendance', 'salary', 'archive', 'results', 'library'].includes(key);
    return false;
  };

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

  const standardSections: { title: string; items: { id: string; label: string; icon: any }[] }[] = [];

  // ASOSIY bo'lim - faqat ruxsat bor elementlarni ko'rsatish
  const mainItems: { id: string; label: string; icon: any }[] = [];
  if (hasPermission('dashboard')) mainItems.push({ id: 'dashboard', label: t.dashboard, icon: LayoutDashboard });
  if (hasPermission('leads')) mainItems.push({ id: 'leads', label: t.leads, icon: UserPlus });
  if (isDirector || isAdmin) {
    // "IELTS Mock" (imtihon topshirish ekrani) menyuda YO'Q — u o'quvchi uchun,
    // direktor bosganda o'z ismi bilan imtihon boshlash sahifasi ochilardi.
    // O'quvchi baribir kirish sahifasidagi PIN orqali kiradi (initialTab='ielts').
    mainItems.push({ id: 'tests_manager', label: t.ielts_tests || 'IELTS testlari', icon: ClipboardList });
  }
  if (mainItems.length > 0) standardSections.push({ title: t.main, items: mainItems });

  // TA'LIM bo'limi
  const educationItems: { id: string; label: string; icon: any }[] = [];
  if (hasPermission('students')) educationItems.push({ id: 'students', label: t.students, icon: Users });
  if (hasPermission('groups')) educationItems.push({ id: 'groups', label: t.groups, icon: BrainCircuit });
  if (hasPermission('attendance')) educationItems.push({ id: 'attendance', label: t.attendance, icon: CalendarCheck });
  if (isTeacher) educationItems.push({ id: 'tests', label: t.tests, icon: FileQuestion });
  if (hasPermission('archive')) educationItems.push({ id: 'archive', label: t.archive, icon: Archive });
  if (hasPermission('results')) educationItems.push({ id: 'results', label: t.results_section || 'Natijalar', icon: Trophy });
  if (educationItems.length > 0) standardSections.push({ title: t.education, items: educationItems });

  // MOLIYA bo'limi
  const financeItems: { id: string; label: string; icon: any }[] = [];
  if (hasPermission('payments')) financeItems.push({ id: 'payments', label: t.payments, icon: Wallet });
  if (hasPermission('salary')) financeItems.push({ id: 'salary', label: t.salary, icon: Banknote });
  if (hasPermission('expenses')) financeItems.push({ id: 'expenses', label: t.expenses, icon: Receipt });
  if (financeItems.length > 0) standardSections.push({ title: t.finance, items: financeItems });

  // JAMOA bo'limi
  if (isDirector) {
    standardSections.push({ title: t.team, items: [{ id: 'staff', label: t.staff, icon: UserSquare }] });
  }

  const sections = isSuper ? creatorSections : standardSections;

  // Yuqoridagi yo'lchi (breadcrumb) uchun: qaysi bo'limdamiz
  const activeItem = sections.flatMap(s => s.items).find(i => i.id === activeTab);
  const activeSection = sections.find(s => s.items.some(i => i.id === activeTab));
  const currentLabel = activeTab === 'settings' ? t.system_settings : (activeItem?.label || t.dashboard);
  const currentSection = activeTab === 'settings' ? t.system : (activeSection?.title || t.main);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Tortma ochiq bo'lganda orqa fon — bosilsa yopiladi (faqat tor ekranda) */}
      {navOpen && (
        <div
          onClick={() => setNavOpen(false)}
          className="fixed inset-0 bg-slate-950/50 z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* ============ Yon menyu ============ */}
      <aside
        className={`w-60 bg-sidebar text-white flex flex-col fixed h-full z-40 transition-transform duration-200
          ${navOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:z-20`}
      >
        <div className="px-4 py-4 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-primary flex items-center justify-center shrink-0">
            <BrainCircuit size={16} className="text-white" />
          </div>
          <span className="font-bold text-[14px] tracking-[-0.01em] flex-1">EduControl</span>
          <button
            onClick={() => setNavOpen(false)}
            className="p-1 rounded-md text-[#98A2B3] hover:text-white hover:bg-white/[0.06] lg:hidden"
            aria-label={t.close || 'Yopish'}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-1.5 custom-scrollbar">
          {sections.map((section, idx) => (
            <div key={idx} className="mb-4">
              <div className="px-2 pt-2 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-sidebar-label">
                {section.title}
              </div>
              {section.items.map(item => {
                const on = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => goTo(item.id)}
                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-[7px] mb-px transition-colors text-left
                      ${on ? 'bg-primary text-white' : 'text-[#98A2B3] hover:bg-white/[0.06] hover:text-white'}`}
                  >
                    <item.icon size={16} className="shrink-0" />
                    <span className="text-[13px] font-medium truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-2.5 pb-3 pt-2 border-t border-white/[0.08]">
          {hasPermission('settings') && (
            <button
              onClick={() => goTo('settings')}
              className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-[7px] mb-2 transition-colors
                ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-[#98A2B3] hover:bg-white/[0.06] hover:text-white'}`}
            >
              <SettingsIcon size={16} className="shrink-0" />
              <span className="text-[13px] font-medium truncate">{t.system_settings}</span>
            </button>
          )}

          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="w-8 h-8 rounded-full bg-primary-subtle text-primary flex items-center justify-center text-[12px] font-semibold shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold truncate">{user.name}</div>
              <div className="text-[11px] text-sidebar-label truncate">{roleLabel}</div>
            </div>
            <button
              onClick={onLogout}
              title={t.logout}
              className="p-1.5 rounded-md text-[#98A2B3] hover:text-danger hover:bg-white/[0.06] transition-colors shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ Asosiy qism ============ */}
      <div className="flex-1 lg:ml-60 min-w-0">
        {/* Yuqori panel */}
        <header className="sticky top-0 z-10 bg-surface border-b border-line px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
          <button
            onClick={() => setNavOpen(true)}
            className="p-2 -ml-2 rounded-md text-ink-2 hover:bg-canvas lg:hidden shrink-0"
            aria-label={t.menu || 'Menyu'}
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 text-[13.5px] min-w-0 flex-1">
            <span className="text-muted truncate">{currentSection}</span>
            <span className="text-muted">/</span>
            <span className="font-semibold text-ink truncate">{currentLabel}</span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-1 bg-canvas border border-line rounded-md p-0.5">
              {(['uz', 'ru', 'en'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => handleLanguageChange(l)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold uppercase transition-colors
                    ${lang === l ? 'bg-primary text-white' : 'text-ink-2 hover:text-ink'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-[13px] text-ink-2 tabular-nums">
              <Clock size={15} className="text-muted" />
              <span>{formatClock(currentTime)}</span>
              <span className="text-muted mx-1">·</span>
              <span>{dateStr}</span>
            </div>

            <span className="w-8 h-8 rounded-full bg-primary-subtle text-primary flex items-center justify-center text-[12px] font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;