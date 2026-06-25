
import React, { useState } from 'react';
import { User, UserRole, Group } from '../types';
import { Shield, Trash2, Check, X, Plus, AlertTriangle, Crown, UserCog, GraduationCap, ToggleLeft, ToggleRight } from 'lucide-react';

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
      return <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-100 text-red-700">Creator</span>;
    }
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${config.badge}`}>
        <Icon size={12} />
        {config.label}
      </span>
    );
  };

  const availableRoles = [UserRole.DIRECTOR, UserRole.ADMIN, UserRole.TEACHER];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditingUser(null); resetForm(); setShowModal(true); }}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
        >
          <Plus size={20} />
          <span>{t.add_staff}</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">{t.student_name}</th>
              <th className="px-6 py-4">{t.role}</th>
              <th className="px-6 py-4 text-center">{t.share}</th>
              <th className="px-6 py-4">{t.groups}</th>
              <th className="px-6 py-4 text-right">{t.main}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition-all group">
                <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                <td className="px-6 py-4">{getRoleBadge(u.role)}</td>
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-indigo-600">
                    {u.role === UserRole.SUPER_ADMIN || u.role === UserRole.DIRECTOR ? '—' : (u.salaryPercentage || 40) + '%'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {u.groupIds?.map(gid => {
                      const gr = groups.find(g => g.id === gid);
                      return gr ? (
                        <span key={gid} className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-100">
                          {gr.name}
                        </span>
                      ) : null;
                    })}
                    {(!u.groupIds || u.groupIds.length === 0) && <span className="text-gray-300 text-xs italic">{t.not_assigned}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => handleEditUser(u)} className="text-indigo-600 hover:bg-indigo-100 p-2 rounded-lg transition-all">
                    <Shield size={18} />
                  </button>
                  {u.role !== UserRole.DIRECTOR && u.role !== UserRole.SUPER_ADMIN && (
                    <button onClick={() => setDeleteConfirmId(u.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-card shadow-pop p-8">
            <div className="text-center">
              <div className="bg-red-100 w-16 h-16 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-tighter italic">{t.delete_staff || 'Delete?'}</h3>
              <p className="text-slate-500 text-sm mb-8">{t.confirm_delete_staff}</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">{t.cancel}</button>
                <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all">{t.delete_staff || 'Yes, delete'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-pop p-8 max-h-[90vh] overflow-y-auto">
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
                        <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
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
