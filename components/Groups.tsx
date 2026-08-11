
import React, { useState } from 'react';
import { Group, Student, UserRole, User } from '../types';
import { Plus, Users, BookOpen, Clock, UserPlus, X, Search, Trash2, Edit2, ChevronDown, ChevronUp, User as UserIcon, CheckCircle2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from '../services/toast';
import { translations, Language } from '../services/languageContext';
import { PageHeader, Card, Button, StatusBadge, Avatar, EmptyState } from './ui';

/** Chop etish uchun HTML'ga qo'yiladigan matnni xavfsizlantirish */
const esc = (v: string) =>
  String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

interface GroupsProps {
  t: any;
  groups: Group[];
  students: Student[];
  users: User[];
  user: User;
  onAddGroup: (group: Omit<Group, 'id' | 'centerId'>) => void;
  onUpdateGroup: (id: string, data: Partial<Group>) => void;
  onAssignStudent: (groupId: string, studentId: string) => void;
  onRemoveStudent: (groupId: string, studentId: string) => void;
  onDeleteGroup: (id: string) => void;
  /** Bot @username — QR varaqdagi ulanish havolasini yasash uchun */
  botUsername?: string;
  centerName?: string;
}

const Groups: React.FC<GroupsProps> = ({ t, groups, students, users, user, onAddGroup, onUpdateGroup, onAssignStudent, onRemoveStudent, onDeleteGroup, botUsername, centerName }) => {
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [lastAssignedId, setLastAssignedId] = useState<string | null>(null);

  const [newGroup, setNewGroup] = useState({
    name: '',
    teacher: t.not_assigned,
    subject: '',
    days: [] as string[],
    time: '',
    fee: 0
  });

  const isDirector = user.role === UserRole.DIRECTOR;
  const teachers = users.filter(u => u.role === UserRole.TEACHER);

  const handleAddGroupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGroupId) {
      onUpdateGroup(editingGroupId, newGroup);
    } else {
      onAddGroup({ ...newGroup, studentIds: [] });
    }
    setShowAddGroupModal(false);
    setEditingGroupId(null);
    setNewGroup({ name: '', teacher: 'Not assigned', subject: '', days: [], time: '', fee: 0 });
  };

  const startEdit = (group: Group) => {
    setEditingGroupId(group.id);
    setNewGroup({
      name: group.name,
      teacher: group.teacher,
      subject: group.subject,
      days: group.days,
      time: group.time,
      fee: group.fee
    });
    setShowAddGroupModal(true);
  };

  const toggleDay = (day: string) => {
    setNewGroup(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day]
    }));
  };

  const getStudentById = (id: string) => students.find(s => s.id === id);

  // Guruh uchun QR varaq: har o'quvchiga bitta kartochka — ota-ona skanerlab Start bosadi
  const [printingGroupId, setPrintingGroupId] = useState<string | null>(null);

  const printQrSheet = async (group: Group) => {
    if (!botUsername) {
      toast.error(t.bot_not_connected_hint || "Avval Sozlamalarda Telegram botni ulang");
      return;
    }
    const list = group.studentIds
      .map(getStudentById)
      .filter((s): s is Student => !!s && !!s.tgConnectionCode);

    if (list.length === 0) {
      toast.error(t.search_empty || "Ma'lumot topilmadi");
      return;
    }

    setPrintingGroupId(group.id);
    try {
      const cards = await Promise.all(list.map(async s => {
        const link = `https://t.me/${botUsername}?start=${s.tgConnectionCode}`;
        const svg = await QRCode.toString(link, { type: 'svg', margin: 1, width: 150 });
        return `<div class="c">
          <div class="n">${esc(s.name)}</div>
          <div class="p">${esc(s.parentName || '')}</div>
          <div class="q">${svg}</div>
          <div class="k">${esc(s.tgConnectionCode)}</div>
        </div>`;
      }));

      const html = `<!doctype html><html><head><meta charset="utf-8">
<title>${esc(group.name)} — QR</title>
<style>
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;margin:0;padding:18mm 12mm;color:#101828}
  h1{font-size:17px;margin:0 0 2px}
  .sub{font-size:12px;color:#475467;margin-bottom:14px}
  .g{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm}
  .c{border:1px solid #E4E7EC;border-radius:8px;padding:8px;text-align:center;break-inside:avoid}
  .n{font-size:13px;font-weight:600;line-height:1.25}
  .p{font-size:11px;color:#475467;margin-bottom:4px;min-height:14px}
  .q svg{width:100%;height:auto;max-width:150px}
  .k{font-size:10px;color:#98A2B3;letter-spacing:.06em;margin-top:2px}
  @media print{@page{margin:10mm}}
</style></head><body>
<h1>${esc(group.name)} — Telegram</h1>
<div class="sub">${esc(centerName || '')} · ${esc(t.qr_sheet_hint || 'Ota-ona QR kodni skanerlaydi va Start bosadi')}</div>
<div class="g">${cards.join('')}</div>
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

      const w = window.open('', '_blank');
      if (!w) {
        toast.error('Popup bloklandi — brauzer sozlamasidan ruxsat bering');
        return;
      }
      w.document.write(html);
      w.document.close();
    } finally {
      setPrintingGroupId(null);
    }
  };

  const getGroupTeacher = (groupId: string) => {
    const assignedTeacher = users.find(u => u.groupIds?.includes(groupId));
    return assignedTeacher ? assignedTeacher.name : t.not_assigned;
  };

  const getAvailableStudents = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];

    return students.filter(s =>
      !group.studentIds.includes(s.id) &&
      (s.name.toLowerCase().includes(assignSearch.toLowerCase()) || s.phone.includes(assignSearch))
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`${t.delete_confirm} (${name})`)) {
      onDeleteGroup(id);
      alert(t.deleted);
    }
  };

  const exportToExcel = () => {
    const headers = [t.group_name, t.teacher, t.subject, t.days, t.time, t.fee, t.unit, t.students];
    const rows = groups.map(g => [
      g.name,
      getGroupTeacher(g.id),
      g.subject,
      g.days.join('/'),
      g.time,
      g.fee,
      t.unit,
      g.studentIds.length
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${t.groups}_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const handleAssign = (groupId: string, studentId: string) => {
    onAssignStudent(groupId, studentId);
    setLastAssignedId(studentId);
    setTimeout(() => setLastAssignedId(null), 2000);
  };

  const weekDays = [t.mon, t.tue, t.wed, t.thu, t.fri, t.sat, t.sun];

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.groups}
        subtitle={`${groups.length} ${t.groups_count_hint || 'guruh'}`}
        actions={isDirector && (
          <Button onClick={() => { setEditingGroupId(null); setNewGroup({ name: '', teacher: 'Not assigned', subject: '', days: [], time: '', fee: 0 }); setShowAddGroupModal(true); }}>
            <Plus size={16} /> {t.add_group}
          </Button>
        )}
      />

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users size={22} />}
            title={t.no_groups_yet || "Hali guruh ochilmagan"}
            description={t.no_groups_hint || "Birinchi guruhni oching: fan, o'qituvchi, dars kunlari va oylik narx."}
            action={isDirector ? (
              <Button onClick={() => setShowAddGroupModal(true)}><Plus size={15} /> {t.add_group}</Button>
            ) : undefined}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {groups.map(group => {
            const currentTeacherName = getGroupTeacher(group.id);
            const noTeacher = currentTeacherName === t.not_assigned;
            const expanded = expandedGroupId === group.id;
            return (
              <Card key={group.id} className="flex flex-col">
                {/* Sarlavha */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-semibold text-ink leading-6 truncate">{group.name}</h3>
                    <p className="text-[12.5px] text-primary font-medium mt-0.5 truncate">{group.subject}</p>
                  </div>
                  {isDirector && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(group)}
                        title={t.edit_staff || 'Tahrirlash'}
                        className="p-1.5 text-muted hover:text-primary hover:bg-primary-subtle rounded-md transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(t.delete_group_confirm || "Delete?")) onDeleteGroup(group.id) }}
                        title={t.delete_action || "O'chirish"}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tafsilotlar */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-ink-2">{t.teacher}</span>
                    {noTeacher
                      ? <StatusBadge label={currentTeacherName} tone="danger" />
                      : <span className="font-medium text-ink truncate">{currentTeacherName}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-ink-2">{t.time}</span>
                    <span className="font-medium text-ink inline-flex items-center gap-1.5">
                      <Clock size={13} className="text-muted" /> {group.time || '—'}
                    </span>
                  </div>
                  {group.days?.length > 0 && (
                    <div className="flex items-center justify-between gap-3 text-[13px]">
                      <span className="text-ink-2">{t.days}</span>
                      <span className="font-medium text-ink">{group.days.join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-ink-2">{t.fee}</span>
                    <span className="font-medium text-ink tabular-nums">{(group.fee || 0).toLocaleString()} UZS</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-ink-2">{t.students}</span>
                    <button
                      onClick={() => setExpandedGroupId(expanded ? null : group.id)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-subtle text-primary font-semibold hover:bg-[#DDE3FC] transition-colors"
                    >
                      <Users size={13} /> {group.studentIds.length}
                      {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>
                </div>

                {/* O'quvchilar ro'yxati */}
                {expanded && (
                  <div className="mt-3 border-t border-line pt-3 max-h-56 overflow-y-auto custom-scrollbar">
                    {group.studentIds.length === 0 ? (
                      <p className="text-[13px] text-muted py-2">{t.search_empty}</p>
                    ) : (
                      <div className="space-y-1">
                        {group.studentIds.map(sid => {
                          const s = getStudentById(sid);
                          return (
                            <div key={sid} className="flex items-center justify-between gap-2 py-1.5 group/item">
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar name={s?.name || '?'} size={26} />
                                <span className="text-[13px] text-ink truncate">{s?.name || 'Deleted'}</span>
                              </div>
                              {isDirector && (
                                <button
                                  onClick={() => onRemoveStudent(group.id, sid)}
                                  className="p-1 text-muted hover:text-danger rounded opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
                                >
                                  <X size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setShowAssignModal(group.id)}
                  >
                    <UserPlus size={15} /> {t.add_student}
                  </Button>
                  {/* Ota-onaga tarqatiladigan QR varaq (bitta skan = ulanish) */}
                  <Button
                    variant="secondary"
                    title={t.print_qr || 'QR varaq chop etish'}
                    disabled={printingGroupId === group.id || group.studentIds.length === 0}
                    onClick={() => printQrSheet(group)}
                  >
                    <QrCode size={15} />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/20">
            <div className="p-8 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><Users size={120} /></div>
              <div className="relative z-10">
                <h3 className="font-black italic tracking-tighter text-xl uppercase leading-none">{t.add_student}</h3>
                <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mt-2 opacity-80">{t.groups}: {groups.find(g => g.id === showAssignModal)?.name}</p>
              </div>
              <button onClick={() => { setShowAssignModal(null); setAssignSearch(''); setLastAssignedId(null); }} className="relative z-10 p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8">
              <div className="relative mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input autoFocus className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none font-bold text-sm" placeholder={t.search} value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} />
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {getAvailableStudents(showAssignModal).map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleAssign(showAssignModal, s.id)}
                    className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-[1.5rem] hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm group-hover:bg-white transition-colors">
                        {s.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-black text-slate-800 tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-slate-400 font-black tracking-widest mt-0.5">{s.phone}</p>
                      </div>
                    </div>
                    {lastAssignedId === s.id ? <CheckCircle2 size={24} className="text-emerald-500 animate-in zoom-in" /> : <Plus size={20} className="text-slate-300 group-hover:text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => { setShowAssignModal(null); setAssignSearch(''); }} className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg">{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {showAddGroupModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-white/20">
            <div className="bg-indigo-600 p-8 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12"><BookOpen size={140} /></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none">{editingGroupId ? t.save : t.add_group}</h3>
                <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest mt-2 opacity-80">CRM EduControl</p>
              </div>
              <button onClick={() => setShowAddGroupModal(false)} className="relative z-10 hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleAddGroupSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">{t.groups}</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-800 uppercase tracking-tighter" placeholder="IELTS Expert" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">{t.subject}</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="English" value={newGroup.subject} onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">{t.time}</label>
                  <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-indigo-600" placeholder="14:00 - 16:00" value={newGroup.time} onChange={(e) => setNewGroup({ ...newGroup, time: e.target.value })} />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">{t.teacher}</label>
                  <select
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-800"
                    value={newGroup.teacher}
                    onChange={(e) => setNewGroup({ ...newGroup, teacher: e.target.value })}
                  >
                    <option value={t.not_assigned}>{t.not_assigned}</option>
                    {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">{t.days}</label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newGroup.days.includes(day) ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2.5 ml-1 tracking-widest">{t.revenue} / {t.month}</label>
                  <div className="relative">
                    <input required type="number" className="w-full px-5 py-4 bg-amber-50 border border-amber-100 rounded-2xl outline-none font-black text-amber-700 text-xl tracking-tighter" placeholder="500000" value={newGroup.fee || ''} onChange={(e) => setNewGroup({ ...newGroup, fee: Number(e.target.value) })} />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-[10px] text-amber-500 uppercase tracking-widest">UZS / {t.month}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-8 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddGroupModal(false)} className="flex-1 py-4.5 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-[1.5rem]">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4.5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-2xl shadow-indigo-100 uppercase text-[10px] tracking-widest">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
