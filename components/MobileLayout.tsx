import React, { useState } from 'react';
import { User } from '../types';
import { translations, Language } from '../services/languageContext';
import MobileHeader from './MobileHeader';
import MobileSidebar from './MobileSidebar';

interface MobileLayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    user: User;
    onLogout: () => void;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({
    children,
    activeTab,
    setActiveTab,
    user,
    onLogout
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [lang] = useState<Language>(() => (localStorage.getItem('edu_lang') as Language) || 'uz');
    const t = translations[lang];

    const getTabTitle = () => {
        const titles: Record<string, string> = {
            dashboard: t.dashboard,
            students: t.students,
            groups: t.groups,
            attendance: t.attendance,
            payments: t.payments,
            salary: t.salary,
            expenses: t.expenses,
            staff: t.staff,
            leads: t.leads,
            archive: t.archive,
            settings: t.system_settings,
            tests: t.tests,
            ielts: 'IELTS Mock',
            ielts_admin: 'IELTS Admin',
            creator_dashboard: t.dashboard,
            super_centers: t.centers,
            broadcast: t.broadcast,
            system_logs: t.logs,
        };
        return titles[activeTab] || t.dashboard;
    };

    return (
        <div className="mobile-app relative overflow-hidden">
            <MobileSidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                user={user}
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                onLogout={onLogout}
            />

            <div className={`flex flex-col h-full transition-transform duration-300 ${isSidebarOpen ? 'scale-95 opacity-80' : 'scale-100'}`}>
                <MobileHeader
                    title={getTabTitle()}
                    onMenuClick={() => setIsSidebarOpen(true)}
                    showBack={false} // Top level nav doesn't show back for now
                />
                <main className="mobile-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MobileLayout;
