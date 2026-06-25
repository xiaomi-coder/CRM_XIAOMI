
import React, { useState } from 'react';
import { Building, ShieldAlert, Megaphone, Activity, Users, Wallet, Lock, Unlock, Clock, Trash2, Send, Plus, X, User as UserIcon, Phone, Key, Loader2 } from 'lucide-react';
import { SystemSettings, User, Student, Payment, UserRole } from '../types';

// Global Dashboard
export const CreatorDashboard: React.FC<{ t: any, settings: SystemSettings[], allStudents: Student[], allPayments: Payment[] }> = ({ t, settings = [], allStudents = [], allPayments = [] }) => {
  const totalRevenue = Array.isArray(allPayments) ? allPayments.reduce((sum, p) => sum + p.amount, 0) : 0;

  if (!settings) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-card border border-white/5 text-white shadow-pop relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Building size={100} /></div>
          <Activity className="text-amber-500 mb-4" size={32} />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.centers || 'Centers'}</p>
          <h3 className="text-3xl font-bold">{settings.length}</h3>
        </div>
        <div className="bg-slate-900 p-8 rounded-card border border-white/5 text-white shadow-pop relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Users size={100} /></div>
          <Users className="text-blue-500 mb-4" size={32} />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.students}</p>
          <h3 className="text-3xl font-bold">{allStudents.length}</h3>
        </div>
        <div className="bg-slate-900 p-8 rounded-card border border-white/5 text-white shadow-pop relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={100} /></div>
          <Wallet className="text-emerald-500 mb-4" size={32} />
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.revenue || 'Revenue'}</p>
          <h3 className="text-3xl font-bold text-emerald-400">{totalRevenue.toLocaleString()} UZS</h3>
        </div>
      </div>

      <div className="bg-white p-8 rounded-card border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-lg font-bold text-slate-800 uppercase tracking-tighter">{t.centers_list || 'Centers List'}</h4>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.recent || 'Recent'}</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.length > 0 ? settings.map(s => (
            <div key={s.centerId} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Building size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 uppercase tracking-tight">{s.centerName}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{s.centerId}</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold ${s.isBlocked ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'} px-4 py-1.5 rounded-xl uppercase border ${s.isBlocked ? 'border-red-100' : 'border-emerald-100'}`}>
                {s.isBlocked ? 'Blocked' : 'Active'}
              </span>
            </div>
          )) : <div className="col-span-2 py-20 text-center text-slate-400 font-bold italic uppercase text-[10px] tracking-widest opacity-50">{t.search_empty || 'No centers found'}</div>}
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
          className="bg-slate-900 text-white px-10 py-4 rounded-[1.5rem] font-bold flex items-center gap-3 hover:bg-black transition-all shadow-pop active:scale-95 uppercase text-[10px] tracking-widest"
        >
          <Plus size={20} /> {t.add_center || 'New Center'}
        </button>
      </div>

      <div className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.2em]">
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
                    <div className="font-bold text-slate-800 uppercase tracking-tighter text-base">{s.centerName}</div>
                    <div className="text-[10px] font-bold text-indigo-500 mt-1 uppercase tracking-widest flex items-center gap-1.5">
                      <UserIcon size={12} /> {admin?.name || 'No Director'}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col gap-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Login: <span className="text-slate-800">{admin?.username}</span></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parol: <span className="text-slate-800">{admin?.password}</span></div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 w-fit">
                      <Clock size={14} className="text-amber-500" />
                      {s.licenseExpiry}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    {s.isBlocked ? (
                      <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase border border-red-100">Blocked</span>
                    ) : (
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase border border-emerald-100">Active</span>
                    )}
                  </td>
                  <td className="px-10 py-6 text-right space-x-2">
                    <button
                      onClick={() => onUpdate({ ...s, isBlocked: !s.isBlocked })}
                      className={`p-3 rounded-2xl transition-all ${s.isBlocked ? 'bg-emerald-50 text-emerald-600 shadow-emerald-100' : 'bg-red-50 text-red-600 shadow-red-100'} shadow-card hover:scale-110`}
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
                      className="p-3 bg-red-100 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all hover:scale-110 shadow-lg"
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
          <div className="bg-white w-full max-w-2xl rounded-card shadow-pop overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12"><ShieldAlert size={140} /></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold italic tracking-tighter uppercase">{t.add_center || 'New Center'}</h3>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 opacity-80">Global License Manager</p>
              </div>
              <button onClick={() => setShowModal(false)} className="relative z-10 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest border-b border-indigo-50 pb-2">Business Info</p>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Center Name</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/5 font-bold" value={formData.centerName} onChange={e => setFormData({ ...formData, centerName: e.target.value })} placeholder="Elite Academy" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Phone</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+998" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Expiry</label>
                    <input type="date" required className="w-full px-5 py-4 bg-amber-50 border border-amber-100 rounded-2xl outline-none font-bold text-amber-700" value={formData.expiryDate} onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest border-b border-indigo-50 pb-2">Director (Super User)</p>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Full Name</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.adminName} onChange={e => setFormData({ ...formData, adminName: e.target.value })} placeholder="..." />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Login</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-indigo-600" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="admin" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-2 ml-1">Parol</label>
                    <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 font-bold text-slate-400 hover:bg-slate-50 rounded-2xl transition-all uppercase text-[10px] tracking-widest">{t.cancel}</button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-bold shadow-pop shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all uppercase text-[10px] tracking-widest"
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
    <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-pop max-w-2xl mx-auto animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-indigo-600 w-20 h-20 rounded-card flex items-center justify-center text-white mb-8 shadow-pop shadow-indigo-200">
        <Megaphone size={32} />
      </div>
      <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tighter italic uppercase leading-none">{t.broadcast || 'Global Broadcast'}</h3>
      <p className="text-slate-400 text-sm mb-10 font-medium">{t.uz === "Boshqaruv" ? "Ushbu xabar barcha o'quv markazlari tizimida e'lon qilinadi." : "This message will be broadcast to all training centers."}</p>

      <textarea
        className="w-full h-48 bg-slate-50 border border-slate-100 rounded-card p-8 outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all font-bold text-slate-700 shadow-inner"
        placeholder={t.note || "Message..."}
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
      ></textarea>

      <button className="w-full mt-8 bg-slate-900 text-white font-bold py-5 rounded-card flex items-center justify-center gap-4 hover:bg-black transition-all shadow-pop uppercase text-xs tracking-[0.2em] active:scale-[0.98]">
        {t.send_message || 'Broadcast Message'} <Send size={20} />
      </button>
    </div>
  );
};

// Tizim Loglari qismi
export const SystemLogs: React.FC<{ t: any }> = ({ t }) => {
  return (
    <div className="bg-slate-950 rounded-card p-10 text-indigo-300 font-mono text-[11px] overflow-hidden border border-white/5 shadow-pop animate-in fade-in duration-700">
      <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <ShieldAlert size={20} className="text-amber-500" />
          <span className="uppercase font-bold tracking-[0.3em] text-white">{t.logs || 'System Audit & Access Log'}</span>
        </div>
        <div className="bg-white/5 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest text-indigo-400">Live Stream</div>
      </div>
      <div className="space-y-3 h-[500px] overflow-y-auto custom-scrollbar pr-4">
        <p className="opacity-60 flex gap-4"><span className="text-slate-500 shrink-0">[20:45:12]</span> <span className="text-indigo-400">CREATOR_LOGGED_IN:</span> Super Admin entry success from 127.0.0.1</p>
        <p className="text-emerald-400 flex gap-4"><span className="text-slate-500 shrink-0">[20:46:00]</span> <span className="font-bold">DB_SYNC_SUCCESS:</span> Multi-tenant storage optimized</p>
        <p className="text-amber-400 flex gap-4"><span className="text-slate-500 shrink-0">[20:47:22]</span> <span>LICENSE_CHECK:</span> EDU_XYZ subscription verified (exp: 2025-01-10)</p>
        <p className="text-indigo-400 flex gap-4"><span className="text-slate-500 shrink-0">[20:48:05]</span> <span>NEW_OBJECT_CREATED:</span> Center EDU_PREM added to global registry</p>
        <p className="text-red-400 flex gap-4 font-bold italic"><span className="text-slate-500 shrink-0">[20:49:15]</span> SECURITY_ALERT: Multiple failed logins for user 'admin' at Elite Center</p>
        {[...Array(15)].map((_, i) => (
          <p key={i} className="opacity-30 flex gap-4 text-[9px]">
            <span className="text-slate-600 shrink-0">[{20 + Math.floor(i / 5)}:{10 + i}:00]</span>
            HEARTBEAT_PULSE_OK: Monitoring all microservices...
          </p>
        ))}
      </div>
    </div>
  );
};
