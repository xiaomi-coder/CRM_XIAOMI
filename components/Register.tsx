import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, User as UserIcon, Phone, Lock, AtSign, BrainCircuit,
  AlertCircle, ArrowRight, Loader2, CheckCircle2
} from 'lucide-react';
import { db } from '../services/supabase';
import { User } from '../types';

interface RegisterProps {
  onRegistered: (user: User) => void;
}

// Bazadan keladigan xato kodlari — foydalanuvchi tushunadigan tilda
const ERROR_TEXT: Record<string, string> = {
  username_exists: "Bu login band. Boshqasini tanlang.",
  phone_exists: "Bu telefon raqami bilan markaz allaqachon ro'yxatdan o'tgan.",
  invalid_center_name: "Markaz nomi kamida 3 harf bo'lsin.",
  invalid_admin_name: "Ism-familiya kamida 3 harf bo'lsin.",
  invalid_username: "Login 4-30 belgi: faqat kichik lotin harflari, raqam, _ yoki nuqta.",
  weak_password: "Parol kamida 6 belgi bo'lsin.",
  invalid_phone: "Telefon raqami noto'g'ri. Masalan: +998 90 123 45 67",
  rate_limited: "Juda ko'p urinish bo'ldi. Birozdan keyin qayta urinib ko'ring.",
  network: "Tarmoq xatosi. Internetni tekshirib, qayta urinib ko'ring.",
};

const Register: React.FC<RegisterProps> = ({ onRegistered }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    centerName: '', phone: '', adminName: '', username: '', password: '', password2: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: k === 'username' ? e.target.value.toLowerCase().trim() : e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.password2) {
      setError("Parollar bir xil emas.");
      return;
    }
    setIsLoading(true);
    const res = await db.registerCenter(form);
    setIsLoading(false);
    if (!res.ok) {
      setError(ERROR_TEXT[res.error || ''] || "Xatolik yuz berdi. Qayta urinib ko'ring.");
      return;
    }
    localStorage.setItem('edu_user_role', res.user.role);
    localStorage.setItem('edu_user', JSON.stringify(res.user));
    onRegistered(res.user);
    navigate('/app');
  };

  const inputCls = "login-input w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none font-semibold text-white placeholder-white/30 focus:border-emerald-400/50 focus:bg-white/[0.08] transition-all";
  const labelCls = "block text-[9px] font-black text-white/40 uppercase tracking-widest ml-1";
  const iconCls = "absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-emerald-400 transition-colors";

  return (
    <div className="min-h-screen bg-[#070B09] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="login-blob absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-emerald-500/20 rounded-full blur-[130px]"></div>
      <div className="login-blob-2 absolute bottom-[-20%] right-[-12%] w-[55%] h-[55%] bg-teal-500/15 rounded-full blur-[130px]"></div>
      <div className="login-grid absolute inset-0 opacity-70 pointer-events-none"></div>

      <div className="w-full max-w-lg z-10">
        <div className="login-glass relative rounded-[2rem] p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="login-logo inline-flex p-4 rounded-2xl mb-4 bg-emerald-500/15 border border-emerald-400/25 text-emerald-300">
              <BrainCircuit size={40} />
            </div>
            <h1 className="text-2xl font-black tracking-tighter italic text-white mb-1">Markazni ro'yxatdan o'tkazish</h1>
            <p className="text-emerald-300/70 text-[10px] font-bold uppercase tracking-[0.25em]">14 kun bepul · karta shart emas</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/15 text-red-300 p-4 rounded-2xl text-[11px] font-black border border-red-400/25 flex items-center gap-3">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className={labelCls}>O'quv markaz nomi</label>
              <div className="relative group">
                <Building2 className={iconCls} size={18} />
                <input type="text" className={inputCls} placeholder="Elite Academy" value={form.centerName} onChange={set('centerName')} required minLength={3} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Telefon</label>
                <div className="relative group">
                  <Phone className={iconCls} size={18} />
                  <input type="tel" className={inputCls} placeholder="+998 90 123 45 67" value={form.phone} onChange={set('phone')} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Rahbar ism-familiyasi</label>
                <div className="relative group">
                  <UserIcon className={iconCls} size={18} />
                  <input type="text" className={inputCls} placeholder="Aziz Karimov" value={form.adminName} onChange={set('adminName')} required minLength={3} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelCls}>Login (tizimga kirish uchun)</label>
              <div className="relative group">
                <AtSign className={iconCls} size={18} />
                <input type="text" className={inputCls} placeholder="elite_admin" value={form.username} onChange={set('username')} required minLength={4} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Parol</label>
                <div className="relative group">
                  <Lock className={iconCls} size={18} />
                  <input type="password" className={inputCls} placeholder="••••••" value={form.password} onChange={set('password')} required minLength={6} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Parolni tasdiqlang</label>
                <div className="relative group">
                  <Lock className={iconCls} size={18} />
                  <input type="password" className={inputCls} placeholder="••••••" value={form.password2} onChange={set('password2')} required minLength={6} />
                </div>
              </div>
            </div>

            <ul className="text-[10px] text-white/40 font-bold space-y-1 pt-1 pl-1">
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> 14 kunlik bepul sinov avtomatik yoqiladi</li>
              <li className="flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-400" /> Ma'lumotlaringiz faqat sizga ko'rinadi</li>
            </ul>

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full text-white font-black py-4 rounded-2xl relative overflow-hidden bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-xl shadow-emerald-600/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Tekshirilmoqda...</>
              ) : (
                <>Bepul boshlash <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/10 text-center space-y-2">
            <p className="text-[11px] text-white/40 font-bold">
              Akkauntingiz bormi?{' '}
              <Link to="/login" className="text-emerald-300 hover:text-emerald-200 font-black">Kirish</Link>
            </p>
            <p className="text-[11px] text-white/40 font-bold">
              Savol bormi?{' '}
              <a href="https://t.me/bakoev_me" target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 font-black">Telegram orqali yozing</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
