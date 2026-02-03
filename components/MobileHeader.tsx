import React, { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Menu } from 'lucide-react';
import { Language, translations } from '../services/languageContext';

interface MobileHeaderProps {
    title: string;
    onBack?: () => void;
    showBack?: boolean;
    onMenuClick: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ title, onBack, showBack = false, onMenuClick }) => {
    const [lang] = useState<Language>(() => (localStorage.getItem('edu_lang') as Language) || 'uz');
    const [currentTime, setCurrentTime] = useState(new Date());
    const t = translations[lang];

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        const locale = lang === 'uz' ? 'uz-UZ' : (lang === 'ru' ? 'ru-RU' : 'en-US');
        return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const handleLanguageChange = (newLang: Language) => {
        localStorage.setItem('edu_lang', newLang);
        window.location.reload();
    };

    return (
        <header className="mobile-header">
            <div className="mobile-header-left">
                {showBack && onBack ? (
                    <button onClick={onBack} className="mobile-back-btn">
                        <ArrowLeft size={24} />
                    </button>
                ) : (
                    <button onClick={onMenuClick} className="mobile-back-btn">
                        <Menu size={24} />
                    </button>
                )}
                <h1 className="mobile-header-title">{title}</h1>
            </div>

            <div className="mobile-header-right">
                <div className="mobile-time-display">
                    <Clock size={14} />
                    <span>{formatTime(currentTime)}</span>
                </div>
                <div className="mobile-lang-switcher">
                    {(['uz', 'ru', 'en'] as Language[]).map(l => (
                        <button
                            key={l}
                            onClick={() => handleLanguageChange(l)}
                            className={`mobile-lang-btn ${lang === l ? 'active' : ''}`}
                        >
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
};

export default MobileHeader;
