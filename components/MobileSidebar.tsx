
import React, { useState } from 'react';
import {
    LayoutDashboard, Users, Wallet, CalendarCheck, Settings as SettingsIcon,
    BrainCircuit, LogOut, Banknote, Receipt, Archive, UserSquare, Layers,
    ShieldAlert, Megaphone, UserPlus, FileQuestion, X, Trophy, GraduationCap, ClipboardList
} from 'lucide-react';
import { User, UserRole } from '../types';
import { translations, Language } from '../services/languageContext';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    activeTab: string;
    onSelectTab: (tab: string) => void;
    onLogout: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({
    isOpen,
    onClose,
    user,
    activeTab,
    onSelectTab,
    onLogout
}) => {
    const [lang] = useState<Language>(() => (localStorage.getItem('edu_lang') as Language) || 'uz');
    const t = translations[lang];

    const isDirector = user.role === UserRole.DIRECTOR;
    const isTeacher = user.role === UserRole.TEACHER;
    const isSuper = user.role === UserRole.SUPER_ADMIN;

    const roleLabel = isSuper ? (t.role_creator || 'Creator') : (isDirector ? (t.role_director || 'Director') : (t.role_teacher || 'Teacher'));

    // Menu items based on role (similar to Layout.tsx)
    const getMenuItems = () => {
        if (isSuper) {
            return [
                { id: 'creator_dashboard', label: t.dashboard, icon: LayoutDashboard },
                { id: 'super_centers', label: t.centers, icon: Layers },
                { id: 'broadcast', label: t.broadcast, icon: Megaphone },
                { id: 'system_logs', label: t.logs, icon: ShieldAlert },
            ];
        }

        const items = [];

        if (isDirector) {
            items.push({ id: 'dashboard', label: t.dashboard, icon: LayoutDashboard });
            items.push({ id: 'leads', label: t.leads, icon: UserPlus });
            items.push({ id: 'ielts', label: 'IELTS Mock', icon: GraduationCap });
            items.push({ id: 'tests_manager', label: 'Testlar', icon: ClipboardList });
        }

        items.push({ id: 'students', label: t.students, icon: Users });
        items.push({ id: 'groups', label: t.groups, icon: BrainCircuit });
        items.push({ id: 'attendance', label: t.attendance, icon: CalendarCheck });

        if (isTeacher) {
            items.push({ id: 'tests', label: t.tests, icon: FileQuestion });
        }

        items.push({ id: 'archive', label: t.archive, icon: Archive });
        items.push({ id: 'results', label: t.results_section || 'Natijalar', icon: Trophy });

        if (isDirector) {
            items.push({ id: 'payments', label: t.payments, icon: Wallet });
            items.push({ id: 'salary', label: t.salary, icon: Banknote });
            items.push({ id: 'expenses', label: t.expenses, icon: Receipt });
            items.push({ id: 'staff', label: t.staff, icon: UserSquare });
            items.push({ id: 'settings', label: t.system_settings, icon: SettingsIcon });
        } else if (isTeacher) {
            items.push({ id: 'salary', label: t.salary, icon: Banknote });
        }

        return items;
    };

    const menuItems = getMenuItems();

    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Sidebar Drawer */}
            <div className={`fixed inset-y-0 left-0 w-[85%] max-w-[320px] bg-[#0f172a] text-white z-50 flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Header */}
                <div className="p-6 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                            <BrainCircuit size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter italic uppercase leading-none">EDUCONTROL</h1>
                            <p className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em] mt-1">{t.professional_crm || 'Professional CRM'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {/* User Info */}
                <div className="px-6 py-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center font-black text-indigo-400 border border-indigo-500/20 text-lg">
                            {user.name.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-white truncate">{user.name}</span>
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest truncate mt-1">{roleLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onSelectTab(item.id);
                                onClose();
                            }}
                            className={`w-full flex items-center space-x-4 px-5 py-4 rounded-xl transition-all duration-300 ${activeTab === item.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} className={activeTab === item.id ? 'stroke-[2.5px]' : 'opacity-70'} />
                            <span className={`text-[11px] ${activeTab === item.id ? 'font-black' : 'font-bold uppercase tracking-wide'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </nav>

                {/* Footer / Logout */}
                <div className="p-6 border-t border-white/5">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-3 py-3.5 bg-red-500/10 text-red-500 rounded-xl font-bold uppercase text-[10px] hover:bg-red-500/20 transition-all border border-red-500/20"
                    >
                        <LogOut size={16} />
                        <span>{t.logout}</span>
                    </button>
                </div>
            </div>
        </>
    );
};

export default MobileSidebar;
