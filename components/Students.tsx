
import React, { useState } from 'react';
import { Search, Plus, Trash2, UserCheck, X, GraduationCap, UserMinus, Settings2, Send, MessageSquare } from 'lucide-react';
import { Student, Group, User, StudentStatus } from '../types';
import { translations, Language } from '../services/languageContext';
import { sendTelegramMessage } from '../services/telegramService';

interface StudentsProps {
  t: any;
  students: Student[];
  groups: Group[];
  user: User;
  settings: { botToken: string; centerName: string };
  onAdd: (student: Omit<Student, 'id' | 'centerId' | 'tgEnabled' | 'tgConnectionCode' | 'status'>, groupId?: string) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: StudentStatus, lastGroup?: string, lastTeacher?: string, exitNote?: string) => void;
  onUpdateStudent: (id: string, data: Partial<Student>) => void;
}

const Students: React.FC<StudentsProps> = ({ t, students, groups, user, settings, onAdd, onDelete, onUpdateStatus, onUpdateStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  // Send message modal state
  const [sendMessageStudent, setSendMessageStudent] = useState<Student | null>(null);
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Arxivlash uchun modal state
  const [showExitModal, setShowExitModal] = useState<{ student: Student, status: StudentStatus } | null>(null);
  const [exitNote, setExitNote] = useState('');

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
      alert(t.parent_not_linked || "Ota-ona hali Telegram botiga ulanmagan!");
      return;
    }
    if (!settings.botToken) {
      alert(t.bot_not_configured || "Bot token sozlanmagan!");
      return;
    }

    setSendingMessage(true);
    const fullMessage = `📢 <b>${settings.centerName}</b>\n\n👤 O'quvchi: <b>${sendMessageStudent.name}</b>\n\n${messageText}`;

    const success = await sendTelegramMessage(settings.botToken, sendMessageStudent.tgChatId, fullMessage);

    setSendingMessage(false);
    if (success) {
      alert(t.message_sent || "Xabar yuborildi!");
      setSendMessageStudent(null);
      setMessageText('');
    } else {
      alert(t.message_failed || "Xabar yuborishda xatolik!");
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
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t.search}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
          >
            <Plus size={18} /> {t.add_student}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-5">{t.students}</th>
                <th className="px-8 py-5">{t.parent}</th>
                <th className="px-8 py-5">{t.message || 'Xabar'}</th>
                <th className="px-8 py-5">{t.balance}</th>
                <th className="px-8 py-5 text-right">{t.main}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg font-black text-[12px]">
                        {student.id.slice(-3).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 flex items-center gap-2">
                          {student.name}
                          <div className="relative inline-block">
                            <button onClick={() => setStatusMenuId(statusMenuId === student.id ? null : student.id)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 transition-all">
                              <Settings2 size={14} />
                            </button>
                            {statusMenuId === student.id && (
                              <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in zoom-in duration-200">
                                <button
                                  onClick={() => handleStatusChange(student, StudentStatus.GRADUATED)}
                                  className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-3"
                                >
                                  <GraduationCap size={16} /> {t.graduated}
                                </button>
                                <button
                                  onClick={() => handleStatusChange(student, StudentStatus.DROPPED)}
                                  className="w-full text-left px-5 py-3 text-[10px] font-black uppercase text-slate-600 hover:bg-red-50 hover:text-red-600 flex items-center gap-3"
                                >
                                  <UserMinus size={16} /> {t.dropped}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">{student.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-black text-slate-700">{student.parentName}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{student.parentPhone}</div>
                  </td>
                  <td className="px-8 py-6">
                    <button
                      onClick={() => setSendMessageStudent(student)}
                      disabled={!student.tgChatId}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black transition-all ${student.tgChatId ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      <Send size={14} />
                      {student.tgChatId ? (t.send_message || 'Xabar yuborish') : (t.not_linked || 'Ulanmagan')}
                    </button>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`font-black text-[11px] px-3 py-1 rounded-xl w-fit ${student.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {student.balance.toLocaleString()} UZS
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => onDelete(student.id)} className="p-2 text-slate-200 hover:text-red-500 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default Students;
