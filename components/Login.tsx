
import React, { useState } from 'react';
import { Lock, User as UserIcon, BrainCircuit, Phone, Send, AlertCircle, ArrowRight } from 'lucide-react';
import { db } from '../services/supabase';
import { UserRole, Lead, User } from '../types';

interface LoginProps {
  t: any;
  onLogin: (username: string, pass: string) => void;
  onTestLogin: (pin: string) => void;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ t, onLogin, onTestLogin, error: externalError }) => {
  const [mode, setMode] = useState<'ADMIN' | 'TEST'>('ADMIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [testPin, setTestPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLocalError(null);

    if (mode === 'ADMIN') {
      onLogin(username, password);
    } else {
      onTestLogin(testPin);
    }
  };

  React.useEffect(() => {
    if (externalError) setIsLoading(false);
  }, [externalError]);

  const displayError = localError || externalError;

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-700 p-10 text-center text-white relative">
            <div className="inline-flex p-4 bg-white/10 rounded-[1.5rem] mb-4 backdrop-blur-xl border border-white/20 shadow-inner group">
              <BrainCircuit size={48} />
            </div>
            <h1 className="text-3xl font-black tracking-tighter italic mb-1">EduControl</h1>
            <p className="text-indigo-100/70 text-[10px] font-bold uppercase tracking-[0.3em]">Online CRM System</p>
          </div>

          <div className="flex p-2 bg-slate-100 mx-8 mt-6 rounded-2xl">
            <button
              onClick={() => setMode('ADMIN')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'ADMIN' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}
            >
              {t.staff || 'Staff'}
            </button>
            <button
              onClick={() => setMode('TEST')}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'TEST' ? 'bg-white text-amber-600 shadow-md' : 'text-slate-400'}`}
            >
              {t.tests || 'Take Test'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {displayError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[11px] font-black border border-red-100 flex items-center gap-3 shadow-sm animate-bounce">
                <AlertCircle size={20} className="shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <div className="space-y-4">
              {mode === 'ADMIN' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{t.username}</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <input
                        type="text"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.2rem] outline-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder={t.login}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">{t.password}</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                      <input
                        type="password"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[1.2rem] outline-none font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.enter_pin}</p>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full text-center py-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] outline-none font-black text-4xl tracking-[0.5em] text-indigo-600 focus:border-indigo-500 transition-all"
                    placeholder="000000"
                    value={testPin}
                    onChange={(e) => setTestPin(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-black py-4 bg-indigo-600 rounded-[1.2rem] shadow-xl hover:bg-indigo-700 active:scale-[0.97] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-50"
            >
              {isLoading ? t.checking : t.login_button}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="p-8 border-t border-gray-100 flex flex-col items-center gap-4 bg-gray-50/50">
            <div className="flex items-center gap-6">
              <a href="tel:+998906127171" className="flex items-center gap-2 text-indigo-600 hover:scale-105 transition-transform">
                <Phone size={14} />
                <span className="text-[11px] font-black">+998 90 612 71 71</span>
              </a>
              <a href="https://t.me/bakoev_71" target="_blank" className="flex items-center gap-2 text-blue-500 hover:scale-105 transition-transform">
                <Send size={14} />
                <span className="text-[11px] font-black">Telegram</span>
              </a>
            </div>
            <p className="text-[8px] text-gray-400 uppercase tracking-[0.4em] font-black italic">
              EduControl v2.0 • Online CRM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
