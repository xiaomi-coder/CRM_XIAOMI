
import React, { useState, useRef } from 'react';
import { Lock, User as UserIcon, BrainCircuit, Phone, Send, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { db } from '../services/supabase';
import { UserRole, Lead, User } from '../types';

interface LoginProps {
  t: any;
  onLogin: (username: string, pass: string) => void;
  onTestLogin: (pin: string, studentName: string) => void;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ t, onLogin, onTestLogin, error: externalError }) => {
  const [mode, setMode] = useState<'ADMIN' | 'TEST'>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [testPin, setTestPin] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);

    if (mode === 'ADMIN') {
      onLogin(username, password);
    } else {
      if (!studentName.trim()) {
        setLocalError(t.enter_name_alert || "Iltimos, ism va familiyangizni kiriting!");
        setIsLoading(false);
        return;
      }
      onTestLogin(testPin, studentName.trim());
    }
  };

  React.useEffect(() => {
    if (externalError) setIsLoading(false);
  }, [externalError]);

  const displayError = localError || externalError;

  // Sichqoncha harakatiga qarab kartani biroz egish (3D parallax)
  const handleMouseMove = (e: React.MouseEvent) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--ry', `${(px * 6).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${(-py * 6).toFixed(2)}deg`);
  };
  const handleMouseLeave = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <div className="min-h-screen bg-[#070B09] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Animatsion aurora fon */}
      <div className="login-blob absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-emerald-500/20 rounded-full blur-[130px]"></div>
      <div className="login-blob-2 absolute bottom-[-20%] right-[-12%] w-[55%] h-[55%] bg-teal-500/15 rounded-full blur-[130px]"></div>
      <div className="login-blob absolute top-[28%] right-[22%] w-[30%] h-[30%] bg-emerald-400/10 rounded-full blur-[100px]" style={{ animationDelay: '-6s' }}></div>
      {/* Harakatlanuvchi grid */}
      <div className="login-grid absolute inset-0 opacity-70 pointer-events-none"></div>

      <div
        className="w-full max-w-md z-10"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="login-card">
          <div
            ref={cardRef}
            className="login-glass relative rounded-[2rem] p-8 sm:p-10"
            style={{
              transform: 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.2s ease-out',
            }}
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="login-logo inline-flex p-4 rounded-2xl mb-4 bg-emerald-500/15 border border-emerald-400/25 text-emerald-300">
                <BrainCircuit size={44} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter italic text-white mb-1">EduControl</h1>
              <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-[0.3em]">Online CRM System</p>
            </div>

            {/* Rejim tanlash */}
            <div className="flex p-1.5 bg-white/5 border border-white/10 rounded-2xl mb-6">
              <button
                onClick={() => setMode('ADMIN')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'ADMIN' ? 'bg-emerald-500/90 text-white shadow-lg shadow-emerald-500/25' : 'text-white/50 hover:text-white/80'}`}
              >
                {t.staff || 'Staff'}
              </button>
              <button
                onClick={() => setMode('TEST')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'TEST' ? 'bg-amber-500/90 text-white shadow-lg shadow-amber-500/25' : 'text-white/50 hover:text-white/80'}`}
              >
                {t.tests || 'Take Test'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-stagger space-y-5">
              {displayError && (
                <div className="bg-red-500/15 text-red-300 p-4 rounded-2xl text-[11px] font-black border border-red-400/25 flex items-center gap-3 animate-bounce">
                  <AlertCircle size={20} className="shrink-0" />
                  <span>{displayError}</span>
                </div>
              )}

              {mode === 'ADMIN' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{t.username}</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" size={18} />
                      <input
                        type="text"
                        className="login-input w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-semibold text-white placeholder-white/30 focus:border-emerald-400/50 focus:bg-white/[0.08] transition-all"
                        placeholder={t.login}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{t.password}</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors" size={18} />
                      <input
                        type="password"
                        className="login-input w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-semibold text-white placeholder-white/30 focus:border-emerald-400/50 focus:bg-white/[0.08] transition-all"
                        placeholder="••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1">{t.full_name}</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-amber-400 transition-colors" size={18} />
                      <input
                        type="text"
                        className="login-input w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-semibold text-white placeholder-white/30 focus:border-amber-400/50 focus:bg-white/[0.08] transition-all"
                        placeholder={t.enter_your_name || "Ism Familiya"}
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2">{t.enter_pin}</p>
                    <input
                      type="text"
                      maxLength={6}
                      className="login-input w-full text-center py-5 bg-white/5 border-2 border-white/10 rounded-2xl outline-none font-black text-4xl tracking-[0.5em] text-amber-300 placeholder-white/20 focus:border-amber-400/50 transition-all"
                      placeholder="000000"
                      value={testPin}
                      onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ''))}
                      required
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group w-full text-white font-black py-4 rounded-2xl relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-xl shadow-emerald-600/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {t.checking}
                  </>
                ) : (
                  <>
                    {t.login_button}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center gap-4">
              <div className="flex items-center gap-6">
                <a href="tel:+998906127171" className="flex items-center gap-2 text-emerald-300 hover:scale-105 transition-transform">
                  <Phone size={14} />
                  <span className="text-[11px] font-black">+998 90 612 71 71</span>
                </a>
                <a href="https://t.me/bakoev_71" target="_blank" className="flex items-center gap-2 text-sky-400 hover:scale-105 transition-transform">
                  <Send size={14} />
                  <span className="text-[11px] font-black">Telegram</span>
                </a>
              </div>
              <p className="text-[8px] text-white/30 uppercase tracking-[0.4em] font-black italic">
                EduControl v2.0 • Online CRM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
