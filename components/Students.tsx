
import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, UserCheck, X, GraduationCap, UserMinus, Settings2, Send, MessageSquare, BarChart3, TrendingUp, Calendar } from 'lucide-react';
import { Student, Group, User, StudentStatus, Attendance, AttendanceStatus } from '../types';
import { translations, Language } from '../services/languageContext';
import { sendTelegramMessage } from '../services/telegramService';
import { toast } from '../services/toast';
import { Avatar } from './ui';

interface StudentsProps {
  t: any;
  students: Student[];
  groups: Group[];
  user: User;
  attendance: Attendance[];
  settings: { botToken: string; centerName: string };
  onAdd: (student: Omit<Student, 'id' | 'centerId' | 'tgEnabled' | 'tgConnectionCode' | 'status'>, groupId?: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: StudentStatus, lastGroup?: string, lastTeacher?: string, exitNote?: string) => void;
  onUpdateStudent: (id: string, data: Partial<Student>) => void;
}

const Students: React.FC<StudentsProps> = ({ t, students, groups, user, attendance, settings, onAdd, onDelete, onUpdateStatus, onUpdateStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [progressStudent, setProgressStudent] = useState<Student | null>(null);

  // Send message modal state
  const [sendMessageStudent, setSendMessageStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Delete confirmation state
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);

  // Arxivlash uchun modal state
  const [showExitModal, setShowExitModal] = useState<{ student: Student, status: StudentStatus } | null>(null);
  const [exitNote, setExitNote] = useState('');

  const getStudentProgress = useMemo(() => {
    if (!progressStudent) return null;

    const studentAtt = attendance.filter(a => a.studentId === progressStudent.id);
    const monthlyData: { month: string; present: number; absent: number; late: number; total: number; percent: number }[] = [];

    const months = new Map<string, { present: number; absent: number; late: number; total: number }>();

    studentAtt.forEach(a => {
      const monthKey = a.date.substring(0, 7); // "2026-02"
      if (!months.has(monthKey)) months.set(monthKey, { present: 0, absent: 0, late: 0, total: 0 });
      const m = months.get(monthKey)!;
      m.total++;
      if (a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.DISMISSED) m.present++;
      else if (a.status === AttendanceStatus.ABSENT) m.absent++;
      else if (a.status === AttendanceStatus.LATE) { m.late++; m.present++; }
    });

    const sortedMonths = Array.from(months.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);

    const monthNames: Record<string, string> = {
      '01': t.jan || 'Yan', '02': t.feb || 'Fev', '03': t.mar || 'Mar', '04': t.apr || 'Apr',
      '05': t.may || 'May', '06': t.jun || 'Iyn', '07': t.jul || 'Iyl', '08': t.aug || 'Avg',
      '09': t.sep || 'Sen', '10': t.oct || 'Okt', '11': t.nov || 'Noy', '12': t.dec || 'Dek'
    };

    sortedMonths.forEach(([key, data]) => {
      const mm = key.split('-')[1];
      monthlyData.push({
        month: monthNames[mm] || mm,
        present: data.present,
        absent: data.absent,
        late: data.late,
        total: data.total,
        percent: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      });
    });

    const totalPresent = studentAtt.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.DISMISSED || a.status === AttendanceStatus.LATE).length;
    const totalAll = studentAtt.length;
    const overallPercent = totalAll > 0 ? Math.round((totalPresent / totalAll) * 100) : 0;

    const streak = (() => {
      const sorted = studentAtt.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE || a.status === AttendanceStatus.DISMISSED).map(a => a.date).sort().reverse();
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        if (sorted.includes(ds)) count++;
        else if (studentAtt.some(a => a.date === ds)) break;
      }
      return count;
    })();

    return { monthlyData, overallPercent, totalPresent, totalAll, streak };
  }, [progressStudent, attendance, t]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    selectedGroupId: ''
  });

  const activeStudents = students.filter(s => s.status === StudentStatus.ACTIVE);
  const filteredStudents = activeStudents.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    s.id.includes(searchTerm)
  );

  const handleStatusChange = (student: Student, newStatus: StudentStatus) => {
    setShowExitModal({ student, status: newStatus });
    setStatusMenuId(null);
  };

  const handleStatusConfirm = () => {
    if (!showExitModal) return;
    const { student, status } = showExitModal;
    const group = groups.find(g => g.studentIds.includes(student.id));

    onUpdateStatus(
      student.id,
      status,
      group ? group.name : 'Unknown',
      group ? group.teacher : 'Unknown',
      exitNote
    );

    setShowExitModal(null);
    setExitNote('');
  };

  const handleSendMessage = async () => {
    if (!sendMessageStudent || !messageText.trim()) return;
    if (!sendMessageStudent.tgChatId) {
      toast.error(t.parent_not_linked || "Ota-ona hali Telegram botiga ulanmagan!");
      return;
    }
    if (!settings.botToken) {
      toast.error(t.bot_not_configured || "Bot token sozlanmagan!");
      return;
    }

    setSendingMessage(true);
    const fullMessage = `📢 <b>${settings.centerName}</b>\n\n👤 O'quvchi: <b>${sendMessageStudent.name}</b>\n\n${messageText}`;

    const success = await sendTelegramMessage(settings.botToken, sendMessageStudent.tgChatId, fullMessage);

    setSendingMessage(false);
    if (success) {
      toast.success(t.message_sent || "Xabar yuborildi!");
      setSendMessageStudent(null);
      setMessageText('');
    } else {
      toast.error(t.message_failed || "Xabar yuborishda xatolik!");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: formData.name,
      phone: formData.phone,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      balance: 0,
      coins: 0,
      joinedDate: new Date().toISOString().split('T')[0]
    }, formData.selectedGroupId || undefined);

    setShowAddModal(false);
    setFormData({ name: '', phone: '', parentName: '', parentPhone: '', selectedGroupId: '' });
  };

  return (
    <div className="space-y-6">
      {/* Sahifa sarlavhasi */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink tracking-tight">{t.students}</h2>
          <p className="text-sm text-muted mt-0.5">{activeStudents.length} {t.active || 'faol'}</p>
        </div>
      </div>

      <div className="bg-white rounded-card shadow-card border border-line overflow-hidden">
        <div className="p-5 border-b border-line flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder={t.search}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-line rounded-field focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 text-sm font-medium text-ink placeholder:text-slate-400 transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-field font-semibold text-sm hover:bg-primary-700 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Plus size={18} /> {t.add_student}
          </button>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="px-8 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary flex items-center justify-center mx-auto mb-4">
              <GraduationCap size={28} />
            </div>
            <h3 className="text-base font-bold text-ink">
              {searchTerm ? (t.no_results || "Hech narsa topilmadi") : (t.no_students_yet || "Hali o'quvchi yo'q")}
            </h3>
            <p className="text-sm text-muted mt-1 max-w-xs mx-auto">
              {searchTerm ? (t.try_another_search || "Boshqa kalit so'z bilan qidirib ko'ring") : (t.add_first_student || "Birinchi o'quvchingizni qo'shib boshlang")}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-5 inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-field font-semibold text-sm hover:bg-primary-700 transition-colors"
              >
                <Plus size={16} /> {t.add_student}
              </button>
            )}
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/70 text-muted text-[11px] font-semibold uppercase tracking-wide border-b border-line">
                <th className="px-6 py-3.5">{t.students}</th>
                <th className="px-6 py-3.5">{t.parent}</th>
                <th className="px-6 py-3.5">{t.message || 'Xabar'}</th>
                <th className="px-6 py-3.5">{t.balance}</th>
                <th className="px-6 py-3.5 text-right">{t.actions || 'Amallar'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={student.name} size={36} />
                      <div>
                        <div className="font-semibold text-ink text-sm flex items-center gap-1.5">
                          {student.name}
                          <div className="relative inline-block">
                            <button onClick={() => setStatusMenuId(statusMenuId === student.id ? null : student.id)} className="p-1 hover:bg-slate-200 rounded-md text-slate-400 transition-all opacity-0 group-hover:opacity-100">
                              <Settings2 size={14} />
                            </button>
                            {statusMenuId === student.id && (
                              <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-pop border border-line z-50 py-1.5">
                                <button
                                  onClick={() => handleStatusChange(student, StudentStatus.GRADUATED)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-emerald-50 hover:text-success flex items-center gap-3"
                                >
                                  <GraduationCap size={16} /> {t.graduated}
                                </button>
                                <button
                                  onClick={() => handleStatusChange(student, StudentStatus.DROPPED)}
                                  className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-red-50 hover:text-danger flex items-center gap-3"
                                >
                                  <UserMinus size={16} /> {t.dropped}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-muted mt-0.5">{student.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-ink">{student.parentName}</div>
                    <div className="text-xs text-muted mt-0.5">{student.parentPhone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSendMessageStudent(student)}
                      disabled={!student.tgChatId}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-field text-xs font-semibold transition-all ${student.tgChatId ? 'bg-primary-50 text-primary hover:bg-primary-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      <Send size={14} />
                      {student.tgChatId ? (t.send_message || 'Xabar yuborish') : (t.not_linked || 'Ulanmagan')}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`font-semibold text-xs px-2.5 py-1 rounded-lg w-fit ${student.balance >= 0 ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger'}`}>
                      {student.balance.toLocaleString()} UZS
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setProgressStudent(student)} className="p-2 text-slate-300 hover:text-primary hover:bg-primary-50 rounded-lg transition-all" title={t.progress || "Progress"}>
                        <BarChart3 size={18} />
                      </button>
                      <button onClick={() => setDeleteConfirmStudent(student)} className="p-2 text-slate-300 hover:text-danger hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <h3 className="text-3xl font-black italic tracking-tighter uppercase text-slate-800">{t.add_student}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.students}</p>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t.student_name} />
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder={t.phone} />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{t.parent}</p>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.parentName} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} placeholder={t.full_name} />
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.parentPhone} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} placeholder={t.phone} />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExitModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 ${showExitModal.status === StudentStatus.GRADUATED ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                {showExitModal.status === StudentStatus.GRADUATED ? <GraduationCap size={32} /> : <UserMinus size={32} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{t.exit_note}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t.exit_date}: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="space-y-4">
              <textarea
                autoFocus
                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold text-sm min-h-[120px] resize-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder={t.note_placeholder}
                value={exitNote}
                onChange={e => setExitNote(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => setShowExitModal(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">{t.cancel}</button>
                <button onClick={handleStatusConfirm} className={`flex-1 py-4 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl ${showExitModal.status === StudentStatus.GRADUATED ? 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600' : 'bg-red-500 shadow-red-100 hover:bg-red-600'}`}>
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {sendMessageStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-indigo-100 text-indigo-600">
                <Send size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{t.send_message || 'Xabar yuborish'}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">👤 {sendMessageStudent.name}</p>
            </div>
            <div className="space-y-4">
              <textarea
                autoFocus
                className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold text-sm min-h-[120px] resize-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
                placeholder={t.message_placeholder || "Xabaringizni yozing... (masalan: Bugun darsga kelmadi)"}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
              />
              <div className="flex gap-3">
                <button onClick={() => { setSendMessageStudent(null); setMessageText(''); }} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">{t.cancel}</button>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageText.trim()}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {sendingMessage ? <MessageSquare className="animate-pulse" size={14} /> : <Send size={14} />}
                  {sendingMessage ? (t.sending || 'Yuborilmoqda...') : (t.send || 'Yuborish')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Progress Modal */}
      {progressStudent && getStudentProgress && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter italic">{progressStudent.name}</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{t.progress || "O'quvchi progressi"}</p>
              </div>
              <button onClick={() => setProgressStudent(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            {/* Stats kartochkalar */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl text-white text-center">
                <p className="text-3xl font-black">{getStudentProgress.overallPercent}%</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">{t.attendance || "Davomat"}</p>
              </div>
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 rounded-2xl text-white text-center">
                <p className="text-3xl font-black">{getStudentProgress.totalPresent}/{getStudentProgress.totalAll}</p>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">{t.total || "Jami"}</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-4 rounded-2xl text-white text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp size={18} />
                  <p className="text-3xl font-black">{getStudentProgress.streak}</p>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Streak</p>
              </div>
            </div>

            {/* Oylik grafik */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-slate-400" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.monthly_attendance || "Oylik davomat"}</p>
              </div>

              {getStudentProgress.monthlyData.length > 0 ? (
                <div className="space-y-3">
                  {getStudentProgress.monthlyData.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-500 w-10">{m.month}</span>
                      <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${m.percent >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : m.percent >= 50 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-red-400 to-red-500'}`}
                          style={{ width: `${m.percent}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-700">
                          {m.present}/{m.total} ({m.percent}%)
                        </span>
                      </div>
                      <div className="flex gap-1 w-16 justify-end">
                        {m.late > 0 && <span className="text-[8px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">{m.late} {t.status_late || 'kech'}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-400 text-sm py-8 italic">{t.no_data || "Ma'lumot yo'q"}</p>
              )}

              {/* Rang izohi */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-[9px] font-bold text-slate-500">80%+ A'lo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-[9px] font-bold text-slate-500">50-79% O'rta</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-[9px] font-bold text-slate-500">&lt;50% Past</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 animate-in zoom-in duration-300">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 bg-red-100 text-red-600">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter italic">{t.confirm_delete || "O'chirishni tasdiqlang"}</h3>
              <p className="text-sm text-slate-500 mt-2">
                <span className="font-bold text-slate-700">{deleteConfirmStudent.name}</span> {t.will_be_deleted || "o'chiriladi"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] hover:bg-slate-100 rounded-2xl transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => { onDelete(deleteConfirmStudent.id); setDeleteConfirmStudent(null); }}
                className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl uppercase text-[10px] shadow-xl hover:bg-red-600 flex items-center justify-center gap-2"
              >
                <Trash2 size={14} />
                {t.delete || "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
