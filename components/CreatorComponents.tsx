
import React, { useState, useMemo } from 'react';
import { Building, ShieldAlert, Megaphone, Activity, Users, Wallet, Lock, Unlock, Clock, Trash2, Send, Plus, X, User as UserIcon, Phone, Key, Loader2, CalendarClock, CheckCircle2 } from 'lucide-react';
import { SystemSettings, User, Student, Payment, UserRole } from '../types';
import { db } from '../services/supabase';

/**
 * Muddati tugayotgan markazlar — creator uchun "bugun kimga qo'ng'iroq qilish
 * kerak" ro'yxati. Sinov davri ham, pullik obuna ham bir xil `licenseExpiry`
 * maydonida saqlanadi, shuning uchun ikkalasi ham shu yerda ko'rinadi.
 *
 * Muddat tugagach ma'lumot O'CHMAYDI — markaz shunchaki kira olmaydi.
 * To'lov kelgach shu yerdan bir bosishda uzaytiriladi.
 */
const DAYS_MS = 86400000;

const daysLeftOf = (expiry?: string): number | null => {
  if (!expiry || !expiry.trim()) return null;   // bo'sh = cheksiz
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / DAYS_MS);
};

const ExpiringCenters: React.FC<{
  t: any;
  settings: SystemSettings[];
  users: User[];
  onUpdate?: (s: SystemSettings) => void;
}> = ({ t, settings, users, onUpdate }) => {
  const [savingId, setSavingId] = useState<string | null>(null);

  // Yaqin 7 kun ichida tugaydigan yoki allaqachon tugagan (bloklanmagan) markazlar
  const rows = useMemo(() => {
    return settings
      .map(s => ({ s, days: daysLeftOf(s.licenseExpiry) }))
      .filter(r => r.days !== null && r.days <= 7 && !r.s.isBlocked)
      .sort((a, b) => (a.days as number) - (b.days as number));
  }, [settings]);

  const directorOf = (centerId: string) =>
    users.find(u => u.centerId === centerId && u.role === UserRole.DIRECTOR);

  // Muddat tugagan bo'lsa bugundan, tugamagan bo'lsa mavjud sanadan davom
  // ettiriladi — to'langan kunlar yo'qolmasin
  const extend = (s: SystemSettings, months: number) => {
    if (!onUpdate) return;
    const cur = s.licenseExpiry ? new Date(s.licenseExpiry) : null;
    const base = cur && cur.getTime() > Date.now() ? cur : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + months);
    const iso = next.toISOString().split('T')[0];

    const label = months === 12 ? '1 yil' : `${months} oy`;
    if (!window.confirm(`"${s.centerName}" muddati ${label}ga uzaytirilsinmi?\n\nYangi sana: ${iso}`)) return;

    setSavingId(s.centerId);
    Promise.resolve(onUpdate({ ...s, licenseExpiry: iso })).finally(() => setSavingId(null));
  };

  const styleOf = (days: number) =>
    days < 0 ? 'bg-red-50 border-red-200 text-red-700'
      : days <= 3 ? 'bg-amber-50 border-amber-200 text-amber-700'
        : 'bg-yellow-50 border-yellow-200 text-yellow-700';

  const labelOf = (days: number) =>
    days < 0 ? `${-days} ${t.expired_days_ago || "kun oldin tugagan"}`
      : days === 0 ? (t.expires_today || "Bugun tugaydi")
        : `${days} ${t.days_left_label || "kun qoldi"}`;

  return (
    <div className="bg-white p-8 rounded-lg border border-line shadow-sm">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-md bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
          <CalendarClock size={22} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-ink uppercase tracking-tight leading-none">
            {t.expiring_centers || "Muddati tugayotgan markazlar"}
          </h4>
          <p className="text-[10px] text-muted font-bold mt-1">
            {t.expiring_centers_note || "Yaqin 7 kun ichida tugaydiganlar va tugab bo'lganlar"}
          </p>
        </div>
        {rows.length > 0 && (
          <span className="bg-amber-50 text-amber-700 px-4 py-1.5 rounded-xl text-[10px] font-semibold uppercase border border-amber-100">
            {rows.length}
          </span>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex items-center gap-3 p-6 bg-emerald-50 rounded-lg border border-emerald-100">
          <CheckCircle2 className="text-emerald-500 shrink-0" size={22} />
          <p className="text-emerald-700 font-bold text-sm">
            {t.expiring_none || "Yaqin kunlarda muddati tugaydigan markaz yo'q."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map(({ s, days }) => {
            const director = directorOf(s.centerId);
            const busy = savingId === s.centerId;
            return (
              <div key={s.centerId} className={`p-5 rounded-lg border ${styleOf(days as number)}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[200px]">
                    <p className="font-semibold text-ink uppercase tracking-tight">{s.centerName}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      {director && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <UserIcon size={12} /> {director.name}
                        </span>
                      )}
                      {s.phone && (
                        <a href={`tel:${s.phone.replace(/\s/g, '')}`}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-indigo-700">
                          <Phone size={12} /> {s.phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
                        <Clock size={12} /> {s.licenseExpiry}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold whitespace-nowrap">{labelOf(days as number)}</span>
                    {onUpdate && (
                      <div className="flex gap-1.5">
                        {[1, 3, 12].map(m => (
                          <button
                            key={m}
                            onClick={() => extend(s, m)}
                            disabled={busy}
                            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all disabled:opacity-40"
                          >
                            {busy ? '...' : `+${m === 12 ? '1 ' + (t.year_short || 'yil') : m + ' ' + (t.month_short || 'oy')}`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Global Dashboard
export const CreatorDashboard: React.FC<{
  t: any, settings: SystemSettings[], allStudents: Student[], allPayments: Payment[],
  users?: User[], onUpdateCenter?: (s: SystemSettings) => void
}> = ({ t, settings = [], allStudents = [], allPayments = [], users = [], onUpdateCenter }) => {
  const totalRevenue = Array.isArray(allPayments) ? allPayments.reduce((sum, p) => sum + p.amount, 0) : 0;

  if (!settings) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-md border border-white/5 text-white shadow-e1 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Building size={100} /></div>
          <Activity className="text-amber-500 mb-4" size={32} />
          <p className="text-muted text-xs font-semibold uppercase tracking-widest">{t.centers || 'Centers'}</p>
          <h3 className="text-3xl font-semibold">{settings.length}</h3>
        </div>
        <div className="bg-slate-900 p-8 rounded-md border border-white/5 text-white shadow-e1 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={100} /></div>
          <Users className="text-blue-500 mb-4" size={32} />
          <p className="text-muted text-xs font-semibold uppercase tracking-widest">{t.students}</p>
          <h3 className="text-3xl font-semibold">{allStudents.length}</h3>
        </div>
        <div className="bg-slate-900 p-8 rounded-md border border-white/5 text-white shadow-e1 relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={100} /></div>
          <Wallet className="text-emerald-500 mb-4" size={32} />
          <p className="text-muted text-xs font-semibold uppercase tracking-widest">{t.revenue || 'Revenue'}</p>
          <h3 className="text-3xl font-semibold text-emerald-400">{totalRevenue.toLocaleString()} UZS</h3>
        </div>
      </div>

      <ExpiringCenters t={t} settings={settings} users={users} onUpdate={onUpdateCenter} />

      <div className="bg-white p-8 rounded-lg border border-line shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-semibold text-ink uppercase tracking-tight">{t.centers_list || 'Centers List'}</h4>
          <div className="text-[10px] font-semibold text-muted uppercase tracking-widest">{t.recent || 'Recent'}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.length > 0 ? settings.map(s => (
            <div key={s.centerId} className="flex items-center justify-between p-5 bg-slate-50 rounded-lg border border-line hover:border-indigo-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center shadow-sm border border-slate-200 group-hover:bg-primary group-hover:text-white transition-all">
                  <Building size={20} />
                </div>
                <div>
                  <p className="font-semibold text-ink uppercase tracking-tight">{s.centerName}</p>
                  <p className="text-[9px] text-muted font-bold uppercase tracking-widest">{s.centerId}</p>
                </div>
              </div>
              <span className={`text-[9px] font-semibold ${s.isBlocked ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'} px-4 py-1.5 rounded-xl uppercase border ${s.isBlocked ? 'border-red-100' : 'border-emerald-100'}`}>
                {s.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
          )) : <div className="col-span-2 py-20 text-center text-muted font-bold uppercase text-[10px] tracking-widest opacity-50">{t.search_empty || 'No centers found'}</div>}
        </div>
      </div>
    </div>
  );
};

// Markazlar Nazorati
interface CenterControlProps {
  t: any;
  settings: SystemSettings[];
  users: User[];
  onAddCenter: (center: SystemSettings, admin: User) => void;
  onUpdate: (s: SystemSettings) => void;
  onDelete: (centerId: string) => void;
}

export const CenterControl: React.FC<CenterControlProps> = ({ t, settings, users, onAddCenter, onUpdate, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    centerName: '',
    adminName: '',
    phone: '',
    username: '',
    password: '',
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // UUID generatsiya qilish (DB talabi UUID)
    const centerId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    const newSettings: SystemSettings = {
      centerId,
      centerName: formData.centerName,
      address: '',
      phone: formData.phone,
      botToken: '',
      notifyAttendance: true,
      notifyPayment: true,
      standardTeacherPercentage: 40,
      licenseExpiry: formData.expiryDate,
      isBlocked: false
    };

    const newAdmin: User = {
      id: adminId,
      centerId,
      name: formData.adminName,
      username: formData.username,
      password: formData.password,
      role: UserRole.DIRECTOR,
      groupIds: [],
      salaryPercentage: 100
    };

    try {
      await onAddCenter(newSettings, newAdmin);
      // Parolni darrov hash qilib qo'yamiz. Aks holda u birinchi kirishgacha
      // ochiq matnda turadi (avval shunday edi).
      await db.setInitialPassword(adminId, formData.password);
      setShowModal(false);
      setFormData({ centerName: '', adminName: '', phone: '', username: '', password: '', expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] });
      alert(t.save);
    } catch (error: any) {
      console.error("Markaz yaratishda xatolik:", error);
      alert(`XATO: ${error.message || error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-10 py-4 rounded-md font-semibold flex items-center gap-3 hover:bg-black transition-all shadow-e1 active:scale-95 uppercase text-[10px] tracking-widest"
        >
          <Plus size={20} /> {t.add_center || 'New Center'}
        </button>
      </div>

      <div className="bg-white rounded-lg border border-line shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-[10px] font-semibold uppercase tracking-[0.2em]">
            <tr>
              <th className="px-10 py-6">{t.center_name || 'Center'}</th>
              <th className="px-10 py-6">{t.login_data || 'Login Info'}</th>
              <th className="px-10 py-6">{t.expiry_date || 'Expiry'}</th>
              <th className="px-10 py-6">{t.status}</th>
              <th className="px-10 py-6 text-right">{t.actions || 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {settings.map(s => {
              const admin = users.find(u => u.centerId === s.centerId && u.role === UserRole.DIRECTOR);
              return (
                <tr key={s.centerId} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="font-semibold text-ink uppercase tracking-tight text-base">{s.centerName}</div>
                    <div className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                      <UserIcon size={12} /> {admin?.name || 'No Director'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-semibold text-muted uppercase tracking-widest">Login: <span className="text-ink">{admin?.username}</span></div>
                      {/* Parol endi bcrypt hash — ko'rsatishning ma'nosi yo'q va
                          ilgari uni ochiq chiqarish o'zi xavf edi. */}
                      <div className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest">Parol: <span className="text-muted">••••••••</span></div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {(() => {
                      // Muddat endi login'da HAQIQATAN tekshiriladi, shuning uchun
                      // necha kun qolgani ko'rinib turishi kerak.
                      if (!s.licenseExpiry) {
                        return (
                          <div className="flex items-center gap-2 text-xs font-semibold text-muted bg-slate-50 px-4 py-2 rounded-xl border border-line w-fit">
                            <Clock size={14} /> Cheksiz
                          </div>
                        );
                      }
                      const days = Math.ceil(
                        (new Date(s.licenseExpiry).getTime() - Date.now()) / 86400000
                      );
                      const style = days < 0
                        ? 'text-red-600 bg-red-50 border-red-100'
                        : days <= 14
                          ? 'text-amber-700 bg-amber-50 border-amber-100'
                          : 'text-emerald-700 bg-emerald-50 border-emerald-100';
                      return (
                        <div className={`flex flex-col gap-0.5 px-4 py-2 rounded-xl border w-fit ${style}`}>
                          <span className="text-xs font-semibold">{s.licenseExpiry}</span>
                          <span className="text-[9px] font-semibold uppercase tracking-widest">
                            {days < 0 ? `${-days} kun oldin tugagan` : `${days} kun qoldi`}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-10 py-6">
                    {s.isBlocked ? (
                      <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-[9px] font-semibold uppercase border border-red-100">Blocked</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl text-[9px] font-semibold uppercase border border-emerald-100">Active</span>
                    )}
                  </td>
                  <td className="px-10 py-6 text-right space-x-2">
                    <button
                      onClick={() => onUpdate({ ...s, isBlocked: !s.isBlocked })}
                      className={`p-3 rounded-md transition-all ${s.isBlocked ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-red-50 text-red-600 shadow-red-100'} shadow-e1 hover:scale-110`}
                    >
                      {s.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                    <button
                      onClick={async () => {
                        const firstConfirm = window.confirm(`"${s.centerName}" markazini o'chirmoqchimisiz?`);
                        if (!firstConfirm) return;

                        const secondConfirm = window.confirm(`DIQQAT! Bu amalni qaytarib bo'lmaydi!\n\nMarkaz: ${s.centerName}\n\nBarcha ma'lumotlar (foydalanuvchilar, login/parol) o'chib ketadi.\n\nRostdan ham o'chirmoqchimisiz?`);
                        if (!secondConfirm) return;

                        onDelete(s.centerId);
                      }}
                      className="p-3 bg-red-100 text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-all hover:scale-110 shadow-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-e1 overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><ShieldAlert size={140} /></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-semibold tracking-tight uppercase">{t.add_center || 'New Center'}</h3>
                <p className="text-muted text-[10px] font-semibold uppercase tracking-[0.3em] mt-2 opacity-80">Global License Manager</p>
              </div>
              <button onClick={() => setShowModal(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[9px] font-semibold text-indigo-500 uppercase tracking-widest border-b border-indigo-50 pb-2">Business Info</p>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted uppercase mb-2 ml-1">Center Name</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-line rounded-md outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" value={formData.centerName} onChange={e => setFormData({ ...formData, centerName: e.target.value })} placeholder="Elite Academy" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted uppercase mb-2 ml-1">Phone</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-line rounded-md outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+998" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted uppercase mb-2 ml-1">Expiry</label>
                    <input type="date" required className="w-full px-5 py-4 bg-amber-50 border border-amber-100 rounded-md outline-none font-semibold text-amber-700" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-semibold text-indigo-500 uppercase tracking-widest border-b border-indigo-50 pb-2">Director (Super User)</p>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted uppercase mb-2 ml-1">Full Name</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-line rounded-md outline-none font-bold" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} placeholder="..." />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted uppercase mb-2 ml-1">Login</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-line rounded-md outline-none font-semibold text-primary" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="admin" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold text-muted uppercase mb-2 ml-1">Parol</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-line rounded-md outline-none font-semibold" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 font-semibold text-muted hover:bg-slate-50 rounded-md transition-all uppercase text-[10px] tracking-widest">{t.cancel}</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-5 bg-primary text-white rounded-md font-semibold shadow-e1 shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all uppercase text-[10px] tracking-widest"
                >
                  {isSubmitting ? "..." : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Global Xabarnoma qismi
export const BroadcastSystem: React.FC<{ t: any }> = ({ t }) => {
  const [msg, setMsg] = useState('');
  return (
    <div className="bg-white p-12 rounded-[3.5rem] border border-line shadow-e1 max-w-2xl mx-auto animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-primary w-20 h-20 rounded-md flex items-center justify-center text-white mb-8 shadow-e1 shadow-indigo-200">
        <Megaphone size={32} />
      </div>
      <h3 className="text-3xl font-semibold text-slate-900 mb-3 tracking-tight uppercase leading-none">{t.broadcast || 'Global Broadcast'}</h3>
      <p className="text-muted text-sm mb-10 font-medium">{t.uz === "Boshqaruv" ? "Ushbu xabar barcha o'quv markazlari tizimida e'lon qilinadi." : "This message will be broadcast to all training centers."}</p>

      <textarea
        className="w-full h-48 bg-slate-50 border border-line rounded-md p-8 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
        placeholder={t.note || "Message..."}
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      ></textarea>

      <button className="w-full mt-8 bg-slate-900 text-white font-semibold py-5 rounded-md flex items-center justify-center gap-4 hover:bg-black transition-all shadow-e1 uppercase text-xs tracking-[0.2em] active:scale-[0.98]">
        {t.send_message || 'Broadcast Message'} <Send size={20} />
      </button>
    </div>
  );
};

// Tizim Loglari qismi — HAQIQIY audit jurnali (avval bu yerda o'ylab
// topilgan yozuvlar turardi: mavjud bo'lmagan markazlar, soxta "heartbeat").
type AuditRow = { at: string; centerId: string | null; username: string | null; action: string; detail: string | null };

const ACTION_STYLE: Record<string, string> = {
  LOGIN_OK: 'text-emerald-400',
  LOGIN_FAIL: 'text-red-400',
  LOGIN_BLOCKED: 'text-amber-400',
  LOGIN_EXPIRED: 'text-amber-400',
  PASSWORD_CHANGED: 'text-indigo-300',
  PASSWORD_RESET: 'text-indigo-300',
};

export const SystemLogs: React.FC<{ t: any; settings?: SystemSettings[] }> = ({ t, settings = [] }) => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await db.getAuditLog(200);
    setRows(data);
    setLoading(false);
  };

  React.useEffect(() => { load(); }, []);

  const centerName = (id: string | null) =>
    id ? (settings.find(s => s.centerId === id)?.centerName || id.slice(0, 8)) : '—';

  return (
    <div className="bg-slate-950 rounded-lg p-10 text-indigo-300 font-mono text-[11px] overflow-hidden border border-white/5 shadow-e1 animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-amber-500" />
          <span className="uppercase font-semibold tracking-[0.3em] text-white">{t.logs || 'System Audit & Access Log'}</span>
        </div>
        <button onClick={load} disabled={loading}
          className="bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-semibold uppercase tracking-widest text-indigo-400 transition-colors disabled:opacity-40">
          {loading ? '...' : (t.refresh || 'Yangilash')}
        </button>
      </div>

      <div className="space-y-2 h-[500px] overflow-y-auto custom-scrollbar pr-4">
        {!loading && rows.length === 0 && (
          <p className="text-slate-500 ">Hozircha yozuv yo'q.</p>
        )}
        {rows.map((r, i) => (
          <p key={i} className={`flex gap-4 ${ACTION_STYLE[r.action] || 'text-muted'}`}>
            <span className="text-slate-600 shrink-0">
              [{new Date(r.at).toLocaleString('uz-UZ', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}]
            </span>
            <span className="font-bold shrink-0">{r.action}</span>
            <span className="text-slate-300 shrink-0">{r.username || '—'}</span>
            <span className="text-slate-500 truncate">
              {centerName(r.centerId)}{r.detail ? ` · ${r.detail}` : ''}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
};
