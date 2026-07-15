import React, { useState } from 'react';
import {
    LayoutDashboard, Users, CalendarCheck, Wallet, BrainCircuit,
    Trophy, Layers, Megaphone, Menu
} from 'lucide-react';
import { User, UserRole } from '../types';
import { translations, Language } from '../services/languageContext';

interface MobileBottomNavProps {
    user: User;
    activeTab: string;
    onSelectTab: (tab: string) => void;
    onMoreClick: () => void;
}

/**
 * Pastki tab-bar — mobil standart navigatsiya.
 * Eng ko'p ishlatiladigan 4 bo'lim rolga qarab tanlanadi; qolgani "Ko'proq" (sidebar) da.
 */
const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ user, activeTab, onSelectTab, onMoreClick }) => {
    const [lang] = useState<Language>(() => (localStorage.getItem('edu_lang') as Language) || 'uz');
    const t = translations[lang];

    const isDirector = user.role === UserRole.DIRECTOR;
    const isAdmin = user.role === UserRole.ADMIN;
    const isTeacher = user.role === UserRole.TEACHER;
    const isSuper = user.role === UserRole.SUPER_ADMIN;

    const perms = user.permissions || {};
    const hasPermission = (key: string): boolean => {
        if (isSuper || isDirector) return true;
        if (Object.keys(perms).length > 0) return perms[key] === true;
        if (isAdmin) return key !== 'settings';
        if (isTeacher) return ['students', 'groups', 'attendance', 'salary', 'archive', 'results', 'library'].includes(key);
        return false;
    };

    const getTabs = (): { id: string; label: string; icon: any }[] => {
        if (isSuper) {
            return [
                { id: 'creator_dashboard', label: t.dashboard, icon: LayoutDashboard },
                { id: 'super_centers', label: t.centers, icon: Layers },
                { id: 'broadcast', label: t.broadcast, icon: Megaphone },
            ];
        }

        // O'qituvchi: dashboard yo'q — kundalik ishi davomat va guruhlar
        if (isTeacher) {
            return [
                { id: 'attendance', label: t.attendance, icon: CalendarCheck },
                { id: 'students', label: t.students, icon: Users },
                { id: 'groups', label: t.groups, icon: BrainCircuit },
                { id: 'results', label: t.results_section || 'Natijalar', icon: Trophy },
            ].filter(tab => hasPermission(tab.id));
        }

        // Direktor / Admin: pul va umumiy holat birinchi o'rinda
        return [
            { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
            { id: 'students', label: t.students, icon: Users },
            { id: 'attendance', label: t.attendance, icon: CalendarCheck },
            { id: 'payments', label: t.payments, icon: Wallet },
        ].filter(tab => hasPermission(tab.id));
    };

    const tabs = getTabs();

    return (
        <nav className="mobile-bottom-nav">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className={`mobile-bottom-tab ${activeTab === tab.id ? 'active' : ''}`}
                >
                    <tab.icon size={20} className={activeTab === tab.id ? 'stroke-[2.5px]' : 'opacity-80'} />
                    <span>{tab.label}</span>
                </button>
            ))}
            <button onClick={onMoreClick} className="mobile-bottom-tab">
                <Menu size={20} className="opacity-80" />
                <span>{t.more || "Ko'proq"}</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
