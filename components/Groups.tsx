
import React, { useState } from 'react';
import { Group, Student, UserRole, User } from '../types';
import { Plus, Users, BookOpen, Clock, UserPlus, X, Search, Trash2, Edit2, ChevronDown, ChevronUp, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { translations, Language } from '../services/languageContext';

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
}

const Groups: React.FC<GroupsProps> = ({ t, groups, students, users, user, onAddGroup, onUpdateGroup, onAssignStudent, onRemoveStudent, onDeleteGroup }) => {
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{t.groups}</h3>
        {isDirector && (
          <button
            onClick={() => { setEditingGroupId(null); setNewGroup({ name: '', teacher: 'Not assigned', subject: '', days: [], time: '', fee: 0 }); setShowAddGroupModal(true); }}
            className="flex items-center space-x-3 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-95 text-[11px] uppercase tracking-widest"
          >
            <Plus size={20} />
            <span>{t.add_group}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {groups.map(group => {
          const currentTeacherName = getGroupTeacher(group.id);
          return (
            <div key={group.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all relative overflow-hidden flex flex-col group/card border-b-4 border-b-transparent hover:border-b-indigo-500">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic leading-none mb-1.5">{group.name}</h4>
                  <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.2em]">{group.subject}</p>
                </div>
                <div className="flex gap-2">
                  {isDirector && (
                    <>
                      <button onClick={() => startEdit(group)} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all hover:bg-indigo-50">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => { if (window.confirm(t.delete_group_confirm || "Delete?")) onDeleteGroup(group.id) }} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 rounded-2xl transition-all hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-5 mb-8 flex-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">{t.teacher}</span>
                  <span className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${currentTeacherName === t.not_assigned ? 'bg-red-50 text-red-400 italic' : 'bg-slate-50 text-slate-800'}`}>
                    <UserIcon size={14} className="text-indigo-400" />
                    {currentTeacherName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">{t.time}</span>
                  <span className="flex items-center gap-2 text-slate-800 bg-amber-50 px-4 py-1.5 rounded-xl border border-amber-100">
                    <Clock size={14} className="text-amber-500" />
                    {group.time}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400 uppercase tracking-widest">{t.students}</span>
                  <button
                    onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <Users size={14} />
                    <span className="font-black">{group.studentIds.length}</span>
                    {expandedGroupId === group.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {expandedGroupId === group.id && (
                <div className="mb-6 bg-slate-50 rounded-[2rem] p-5 max-h-[250px] overflow-y-auto animate-in slide-in-from-top-4 duration-300 border border-slate-100 custom-scrollbar shadow-inner">
                  <div className="space-y-2">
                    {group.studentIds.map(sid => {
                      const s = getStudentById(sid);
                      return (
                        <div key={sid} className="flex justify-between items-center p-3.5 bg-white rounded-2xl text-[11px] border border-slate-100 group/item hover:border-indigo-300 hover:shadow-sm transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-[10px] shadow-sm">
                              {s?.name.charAt(0)}
                            </div>
                            <span className="font-black text-slate-700 tracking-tight">{s?.name || 'Deleted'}</span>
                          </div>
                          {isDirector && (
                            <button onClick={() => onRemoveStudent(group.id, sid)} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowAssignModal(group.id)}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 text-[10px] uppercase tracking-widest active:scale-[0.98]"
              >
                <UserPlus size={18} />
                {t.add_student}
              </button>
            </div>
          );
        })}
      </div>

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
