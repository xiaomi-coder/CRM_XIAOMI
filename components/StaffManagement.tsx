
import React, { useState } from 'react';
import { User, UserRole, Group } from '../types';
import { Shield, Trash2, Check, X, Plus, AlertTriangle, Crown, UserCog, GraduationCap, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';
import { PageHeader, Card, Button, Table, Th, Td, StatusBadge, Avatar } from './ui';
import { db } from '../services/supabase';

interface StaffManagementProps {
  t: any;
  users: User[];
  groups: Group[];
  onAddUser: (user: Omit<User, 'id' | 'centerId'>) => void;
  onDeleteUser: (id: string) => void;
  onUpdateUser: (userId: string, data: Partial<User>) => void;
}

// Default permissions per role
const DEFAULT_PERMISSIONS: Record<string, Record<string, boolean>> = {
  [UserRole.DIRECTOR]: {
    dashboard: true, students: true, groups: true, attendance: true,
    payments: true, expenses: true, salary: true, leads: true,
    archive: true, results: true, library: true, settings: true
  },
  [UserRole.ADMIN]: {
    dashboard: true, students: true, groups: true, attendance: true,
    payments: true, expenses: true, salary: true, leads: true,
    archive: true, results: true, library: true, settings: false
  },
  [UserRole.TEACHER]: {
    dashboard: false, students: true, groups: true, attendance: true,
    payments: false, expenses: false, salary: true, leads: false,
    archive: true, results: true, library: true, settings: false
  }
};

const PERMISSION_LABELS: Record<string, { icon: string; label: string }> = {
  dashboard: { icon: '📊', label: 'Dashboard' },
  students: { icon: '👨‍🎓', label: "O'quvchilar" },
  groups: { icon: '👥', label: 'Guruhlar' },
  attendance: { icon: '📋', label: 'Davomat' },
  payments: { icon: '💰', label: "To'lovlar" },
  expenses: { icon: '🧾', label: 'Xarajatlar' },
  salary: { icon: '💵', label: 'Maosh' },
  leads: { icon: '📞', label: 'Lidlar' },
  archive: { icon: '📦', label: 'Arxiv' },
  results: { icon: '🏆', label: 'Natijalar' },
  library: { icon: '📚', label: 'Kutubxona' },
  settings: { icon: '⚙️', label: 'Sozlamalar' }
};

const ROLE_CONFIG: Record<string, { label: string; icon: any; activeBg: string; activeText: string; bg: string; text: string; border: string; badge: string; description: string }> = {
  [UserRole.DIRECTOR]: {
    label: 'Direktor',
    icon: Crown,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    activeBg: 'bg-purple-600',
    activeText: 'text-white',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    description: "To'liq boshqaruv"
  },
  [UserRole.ADMIN]: {
    label: 'Admin',
    icon: UserCog,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    activeBg: 'bg-emerald-600',
    activeText: 'text-white',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    description: "Yordamchi boshqaruv"
  },
  [UserRole.TEACHER]: {
    label: "O'qituvchi",
    icon: GraduationCap,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    activeBg: 'bg-blue-600',
    activeText: 'text-white',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700',
    description: "Dars yuritish"
  }
};

const StaffManagement: React.FC<StaffManagementProps> = ({
  t,
  users,
  groups,
  onAddUser,
  onDeleteUser,
  onUpdateUser
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  /** Parol tiklash oynasi */
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [resetValue, setResetValue] = useState('');
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [resetBusy, setResetBusy] = useState(false);

  const handleResetPassword = async () => {
    if (!resetUser) return;
    setResetBusy(true);
    const res = await db.resetPassword(resetUser.id, resetValue);
    setResetBusy(false);
    if (res.ok) {
      setResetMsg('ok');
      setTimeout(() => setResetUser(null), 1500);
    } else {
      setResetMsg(
        res.error === 'too_short' ? "Parol kamida 6 ta belgi bo'lishi kerak"
          : res.error === 'forbidden' ? "Bunga ruxsatingiz yo'q"
            : "Xatolik yuz berdi"
      );
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: UserRole.TEACHER as UserRole,
    groupIds: [] as string[],
    salaryPercentage: 40,
    permissions: { ...DEFAULT_PERMISSIONS[UserRole.TEACHER] } as Record<string, boolean>
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role,
      groupIds: Array.isArray(user.groupIds) ? [...user.groupIds] : [],
      salaryPercentage: user.salaryPercentage || 40,
      permissions: user.permissions ? { ...user.permissions } as Record<string, boolean> : { ...DEFAULT_PERMISSIONS[user.role] || {} }
    });
    setShowModal(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissions: { ...DEFAULT_PERMISSIONS[role] || {} }
    });
  };

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key]
      }
    }));
  };

  const toggleGroupSelection = (groupId: string) => {
    setFormData(prev => {
      const currentIds = [...prev.groupIds];
      const index = currentIds.indexOf(groupId);
      if (index > -1) {
        currentIds.splice(index, 1);
      } else {
        currentIds.push(groupId);
      }
      return { ...prev, groupIds: currentIds };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      username: formData.username,
      password: formData.password,
      role: formData.role,
      groupIds: formData.groupIds,
      salaryPercentage: formData.salaryPercentage,
      permissions: formData.permissions
    };

    if (editingUser) {
      onUpdateUser(editingUser.id, payload);
    } else {
      onAddUser(payload);
    }

    setShowModal(false);
    setEditingUser(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '', username: '', password: '',
      role: UserRole.TEACHER, groupIds: [], salaryPercentage: 40,
      permissions: { ...DEFAULT_PERMISSIONS[UserRole.TEACHER] }
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteUser(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    const config = ROLE_CONFIG[role];
    if (!config) {
      return <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">Creator</span>;
    }
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${config.badge}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const availableRoles = [UserRole.DIRECTOR, UserRole.ADMIN, UserRole.TEACHER];

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.staff}
        subtitle={`${users.length} ${t.staff_count_hint || 'xodim'}`}
        actions={
          <Button onClick={() => { setEditingUser(null); resetForm(); setShowModal(true); }}>
            <Plus size={16} /> {t.add_staff}
          </Button>
        }
      />

      <Card padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t.full_name}</Th>
              <Th>{t.role}</Th>
              <Th align="center">{t.share}</Th>
              <Th>{t.groups}</Th>
              <Th align="right">{t.actions || 'Amallar'}</Th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[#FAFAFB] transition-colors">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={u.name} size={32} />
                    <div className="min-w-0">
                      <div className="font-semibold text-ink truncate">{u.name}</div>
                      <div className="text-[12px] text-muted truncate">{u.username}</div>
                    </div>
                  </div>
                </Td>
                <Td>{getRoleBadge(u.role)}</Td>
                <Td align="center" className="tabular-nums text-ink-2">
                  {u.role === UserRole.SUPER_ADMIN || u.role === UserRole.DIRECTOR ? '—' : (u.salaryPercentage || 40) + '%'}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.groupIds?.map(gid => {
                      const gr = groups.find(g => g.id === gid);
                      return gr ? <StatusBadge key={gid} label={gr.name} tone="brand" dot={false} /> : null;
                    })}
                    {(!u.groupIds || u.groupIds.length === 0) && <span className="text-muted text-[13px]">{t.not_assigned}</span>}
                  </div>
                </Td>
                <Td align="right">
                  <div className="inline-flex items-center gap-1">
                    <button onClick={() => handleEditUser(u)} title={t.edit_staff}
                      className="p-1.5 text-muted hover:text-primary hover:bg-primary-subtle rounded-md transition-colors">
                      <Shield size={16} />
                    </button>
                    {/* Parolni tiklash — parol bazada hash, uni "ko'rish" mumkin emas */}
                    <button onClick={() => { setResetUser(u); setResetValue(''); setResetMsg(null); }}
                      title={t.reset_password || 'Parolni tiklash'}
                      className="p-1.5 text-muted hover:text-warning hover:bg-warning-bg rounded-md transition-colors">
                      <KeyRound size={16} />
                    </button>
                    {u.role !== UserRole.DIRECTOR && u.role !== UserRole.SUPER_ADMIN && (
                      <button onClick={() => setDeleteConfirmId(u.id)} title={t.delete_action || "O'chirish"}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>


      {/* Delete Confirmation Modal */}
      {/* Parolni tiklash */}
      {resetUser && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <KeyRound size={26} />
            </div>
            <h3 className="text-lg font-black text-slate-800 text-center">{resetUser.name}</h3>
            <p className="text-[11px] font-bold text-slate-400 text-center mb-6">
              {t.reset_password_hint || "Yangi parol o'ylab toping va xodimga ayting"}
            </p>

            {resetMsg === 'ok' ? (
              <p className="text-center text-emerald-600 font-black text-sm py-4">✓ {t.saved || 'Saqlandi'}</p>
            ) : (
              <>
                <input
                  autoFocus
                  type="text"
                  value={resetValue}
                  onChange={e => { setResetValue(e.target.value); setResetMsg(null); }}
                  placeholder={t.new_password || 'Yangi parol'}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-amber-400/40 mb-2"
                />
                {resetMsg && <p className="text-[11px] font-bold text-red-500 mb-2 px-1">{resetMsg}</p>}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setResetUser(null)}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors">
                    {t.cancel}
                  </button>
                  <button onClick={handleResetPassword} disabled={resetBusy || resetValue.length < 6}
                    className="flex-1 py-3 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-700 transition-colors disabled:opacity-40">
                    {resetBusy ? '...' : (t.save || 'Saqlash')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter italic">{t.delete_staff || 'Delete?'}</h3>
              <p className="text-slate-500 text-sm mb-8">{t.confirm_delete_staff}</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">{t.cancel}</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all">{t.delete_staff || 'Yes, delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">{editingUser ? t.save : t.add_staff}</h3>
              <button onClick={() => { setShowModal(false); setEditingUser(null); }}><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ism */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.student_name}</label>
                <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>

              {/* Login & Parol */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.login || 'Login'}</label>
                  <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.password || 'Parol'}</label>
                  <input required className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
              </div>

              {/* ========== ROL TANLASH ========== */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.role || 'Rol'} *</label>
                <div className="grid grid-cols-3 gap-2">
                  {availableRoles.map(role => {
                    const config = ROLE_CONFIG[role];
                    const Icon = config.icon;
                    const isSelected = formData.role === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleChange(role)}
                        className={`relative flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all duration-200 ${isSelected
                            ? `${config.activeBg} ${config.activeText} border-transparent shadow-lg scale-[1.03]`
                            : `${config.bg} ${config.text} ${config.border} hover:shadow-md hover:scale-[1.01]`
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-md">
                            <Check size={12} className="text-green-600" />
                          </div>
                        )}
                        <Icon size={22} />
                        <span className="text-[10px] font-black uppercase tracking-wider">{config.label}</span>
                        <span className={`text-[8px] font-medium text-center leading-tight ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>{config.description}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ========== RUXSATLAR (PERMISSIONS) ========== */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  🔐 {t.permissions || 'Ruxsatlar'}
                </label>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3">
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(PERMISSION_LABELS).map(([key, { icon, label }]) => {
                      const isEnabled = formData.permissions[key] ?? false;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => togglePermission(key)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${isEnabled
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-200'
                            }`}
                        >
                          <span className="text-sm">{icon}</span>
                          <span className="flex-1 text-left">{label}</span>
                          {isEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Maosh foizi — TEACHER va ADMIN uchun */}
              {(formData.role === UserRole.TEACHER || formData.role === UserRole.ADMIN) && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.share || 'Maosh foizi'}</label>
                  <input type="number" max="100" min="0" className="w-full px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl outline-none font-bold text-indigo-700" value={formData.salaryPercentage} onChange={(e) => setFormData({ ...formData, salaryPercentage: Number(e.target.value) })} />
                </div>
              )}

              {/* Guruhlar — faqat TEACHER uchun */}
              {formData.role === UserRole.TEACHER && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t.assign_groups}</label>
                  <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-xl bg-gray-50">
                    {groups.length > 0 ? groups.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => toggleGroupSelection(g.id)}
                        className={`flex justify-between items-center p-3 rounded-xl text-xs font-bold border transition-all ${formData.groupIds.includes(g.id) ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-100'}`}
                      >
                        <span>{g.name} ({g.subject})</span>
                        {formData.groupIds.includes(g.id) && <Check size={14} />}
                      </button>
                    )) : (
                      <p className="text-center text-gray-400 text-[10px] py-4">{t.search_empty}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-4 flex space-x-3">
                <button type="button" onClick={() => { setShowModal(false); setEditingUser(null); }} className="flex-1 py-3 text-gray-400 font-bold hover:bg-gray-50 rounded-xl">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all">
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
