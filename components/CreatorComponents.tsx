
import React, { useState, useMemo } from 'react';
import { Building, ShieldAlert, Megaphone, Activity, Users, Wallet, Lock, Unlock, Clock, Trash2, Send, Plus, X, User as UserIcon, Phone, Key, Loader2, CalendarClock, CheckCircle2 } from 'lucide-react';
import { SystemSettings, User, Student, Payment, UserRole } from '../types';
import { db } from '../services/supabase';
import { PageHeader, Card, CardHeader, Button, KpiCard, StatusBadge, Table, Th, Td, Avatar, EmptyState, Field, Input } from './ui';

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
    <Card>
      <CardHeader
        title={t.expiring_centers || "Muddati tugayotgan markazlar"}
        subtitle={t.expiring_centers_note || "Yaqin 7 kun ichida tugaydiganlar va tugab bo'lganlar"}
        actions={rows.length > 0 ? <StatusBadge label={String(rows.length)} tone="warning" dot={false} /> : undefined}
      />

      {rows.length === 0 ? (
        <p className="text-[13px] text-success bg-success-bg rounded-md px-3 py-2.5">
          {t.expiring_none || "Yaqin kunlarda muddati tugaydigan markaz yo'q."}
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map(({ s, days }) => {
            const director = directorOf(s.centerId);
            const busy = savingId === s.centerId;
            return (
              <div key={s.centerId} className={`p-3.5 rounded-md border ${styleOf(days as number)}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-[200px]">
                    <p className="text-[14px] font-semibold text-ink">{s.centerName}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      {director && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                          <UserIcon size={12} /> {director.name}
                        </span>
                      )}
                      {s.phone && (
                        <a href={`tel:${s.phone.replace(/\s/g, '')}`}
                          className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary-hover">
                          <Phone size={12} /> {s.phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1.5 text-[12px] text-muted">
                        <Clock size={12} /> {s.licenseExpiry}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[12.5px] font-semibold whitespace-nowrap">{labelOf(days as number)}</span>
                    {onUpdate && (
                      <div className="flex gap-1.5">
                        {[1, 3, 12].map(m => (
                          <button
                            key={m}
                            onClick={() => extend(s, m)}
                            disabled={busy}
                            className="px-2.5 py-1.5 bg-white border border-line rounded-md text-[12px] font-semibold text-ink-2 hover:bg-primary hover:text-white hover:border-primary transition-colors disabled:opacity-40"
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
    </Card>
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
    <div className="animate-in fade-in duration-300">
      <PageHeader title={t.dashboard} subtitle={t.global_control} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <KpiCard label={t.centers || 'Markazlar'} value={settings.length} />
        <KpiCard label={t.students} value={allStudents.length} />
        <KpiCard label={t.revenue || 'Daromad'} value={totalRevenue.toLocaleString()} hint="UZS" />
      </div>

      <div className="mb-5">
        <ExpiringCenters t={t} settings={settings} users={users} onUpdate={onUpdateCenter} />
      </div>

      <Card padded={false}>
        <div className="p-5">
          <CardHeader title={t.centers_list || 'Markazlar ro\'yxati'} subtitle={`${settings.length}`} />
          {settings.length === 0 ? (
            <EmptyState icon={<Building size={22} />} title={t.search_empty} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {settings.map(s => (
                <div key={s.centerId} className="flex items-center justify-between gap-3 border border-line rounded-md p-3.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-md bg-primary-subtle text-primary flex items-center justify-center shrink-0">
                      <Building size={17} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-ink truncate">{s.centerName}</p>
                      <p className="text-[12px] text-muted truncate">{s.phone || s.centerId.slice(0, 8)}</p>
                    </div>
                  </div>
                  <StatusBadge
                    label={s.isBlocked ? (t.blocked || 'Bloklangan') : (t.active || 'Faol')}
                    tone={s.isBlocked ? 'danger' : 'success'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
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
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.centers || 'Markazlar'}
        subtitle={`${settings.length}`}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> {t.add_center || 'Yangi markaz'}
          </Button>
        }
      />

      <Card padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t.center_name || 'Markaz'}</Th>
              <Th>{t.login_data || 'Login'}</Th>
              <Th>{t.expiry_date || 'Muddat'}</Th>
              <Th>{t.status}</Th>
              <Th align="right">{t.actions || 'Amallar'}</Th>
            </tr>
          </thead>
          <tbody>
            {settings.map(s => {
              const admin = users.find(u => u.centerId === s.centerId && u.role === UserRole.DIRECTOR);
              const days = s.licenseExpiry
                ? Math.ceil((new Date(s.licenseExpiry).getTime() - Date.now()) / 86400000)
                : null;
              return (
                <tr key={s.centerId} className="hover:bg-[#FAFAFB] transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={s.centerName} size={32} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{s.centerName}</div>
                        <div className="text-[12px] text-muted truncate">{admin?.name || '—'}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="text-ink">{admin?.username || '—'}</div>
                    {/* Parol bcrypt hash — ko'rsatishning ma'nosi yo'q va xavfli edi */}
                    <div className="text-[12px] text-muted">••••••••</div>
                  </Td>
                  <Td>
                    {days === null ? (
                      <span className="text-[13px] text-muted">{t.unlimited || 'Cheksiz'}</span>
                    ) : (
                      <div>
                        <div className="text-ink tabular-nums">{s.licenseExpiry}</div>
                        <div className={`text-[12px] font-medium ${days < 0 ? 'text-danger' : days <= 14 ? 'text-warning' : 'text-success'}`}>
                          {days < 0
                            ? `${-days} ${t.expired_days_ago || 'kun oldin tugagan'}`
                            : `${days} ${t.days_left_label || 'kun qoldi'}`}
                        </div>
                      </div>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge
                      label={s.isBlocked ? (t.blocked || 'Bloklangan') : (t.active || 'Faol')}
                      tone={s.isBlocked ? 'danger' : 'success'}
                    />
                  </Td>
                  <Td align="right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => onUpdate({ ...s, isBlocked: !s.isBlocked })}
                        title={s.isBlocked ? (t.unblock || 'Blokdan chiqarish') : (t.block || 'Bloklash')}
                        className={`p-1.5 rounded-md transition-colors ${s.isBlocked
                          ? 'text-success hover:bg-success-bg'
                          : 'text-muted hover:text-danger hover:bg-danger-bg'}`}
                      >
                        {s.isBlocked ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`"${s.centerName}" markazini o'chirmoqchimisiz?`)) return;
                          if (!window.confirm(`DIQQAT! Bu amalni qaytarib bo'lmaydi!\n\nMarkaz: ${s.centerName}\n\nBarcha ma'lumotlar (foydalanuvchilar, login/parol) o'chib ketadi.\n\nRostdan ham o'chirmoqchimisiz?`)) return;
                          onDelete(s.centerId);
                        }}
                        title={t.delete_action || "O'chirish"}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>


      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-e1 overflow-hidden animate-in zoom-in-95 duration-300">
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
    <div className="animate-in fade-in duration-300 max-w-2xl">
      <PageHeader
        title={t.broadcast || 'Xabarnomalar'}
        subtitle={t.broadcast_hint || "Ushbu xabar barcha o'quv markazlariga e'lon qilinadi."}
      />
      <Card>
        <Field label={t.note || 'Xabar matni'}>
          <textarea
            className="w-full h-40 text-[13.5px] px-3 py-2.5 border border-line rounded-field bg-surface text-ink outline-none resize-none transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
            placeholder={t.note_placeholder}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
          />
        </Field>
        <Button className="w-full mt-4" disabled={!msg.trim()}>
          <Send size={15} /> {t.send_message || 'Yuborish'}
        </Button>
      </Card>
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
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.logs || 'Loglar'}
        subtitle={t.logs_hint || "Kirish urinishlari va parol o'zgarishlari"}
        actions={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            {loading ? '...' : (t.refresh || 'Yangilash')}
          </Button>
        }
      />

      <Card padded={false}>
        {!loading && rows.length === 0 ? (
          <EmptyState icon={<ShieldAlert size={22} />} title={t.search_empty} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{t.attendance_date}</Th>
                <Th>{t.status}</Th>
                <Th>{t.username}</Th>
                <Th>{t.centers}</Th>
                <Th>{t.note}</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-[#FAFAFB] transition-colors">
                  <Td className="text-muted tabular-nums whitespace-nowrap">
                    {new Date(r.at).toLocaleString('uz-UZ', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </Td>
                  <Td>
                    <StatusBadge
                      label={r.action}
                      tone={r.action === 'LOGIN_OK' ? 'success'
                        : r.action === 'LOGIN_FAIL' ? 'danger'
                          : r.action.startsWith('PASSWORD') ? 'info' : 'warning'}
                    />
                  </Td>
                  <Td className="text-ink">{r.username || '—'}</Td>
                  <Td className="text-ink-2">{centerName(r.centerId)}</Td>
                  <Td className="text-muted">{r.detail || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
};
