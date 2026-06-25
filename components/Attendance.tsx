
import React, { useState, useMemo } from 'react';
import { Group, Student, Attendance, AttendanceStatus, SystemSettings } from '../types';
import { Check, X, Clock, Send, Search, Download, AlertCircle, MessageSquare, Users, LogOut, CheckCheck, Loader2 } from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';

interface AttendanceProps {
  t: any;
  groups: Group[];
  students: Student[];
  attendance: Attendance[];
  onSave: (att: Omit<Attendance, 'id' | 'centerId'>) => void;
  settings: SystemSettings;
}

const AttendanceManager: React.FC<AttendanceProps> = ({ t, groups, students, attendance, onSave, settings }) => {
  const [selectedGroupId, setSelectedGroupId] = useState('ALL_STUDENTS');
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [sendingSms, setSendingSms] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [testNotification, setTestNotification] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);

  const getStudentGroup = (studentId: string) => {
    return groups.find(g => g.studentIds.includes(studentId));
  };

  const filteredStudents = useMemo(() => {
    let list = students;
    if (selectedGroupId !== 'ALL_STUDENTS' && selectedGroupId !== '') {
      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      list = list.filter(s => selectedGroup?.studentIds.includes(s.id));
    }

    if (searchTerm) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm) ||
        s.id.includes(searchTerm)
      );
    }
    return list;
  }, [selectedGroupId, students, searchTerm, groups]);

  const getStudentStatus = (studentId: string, groupId?: string) => {
    const targetGroupId = groupId || getStudentGroup(studentId)?.id;
    if (!targetGroupId) return null;

    const record = attendance.find(a =>
      a.studentId === studentId &&
      a.groupId === targetGroupId &&
      a.date === currentDate
    );
    return record ? record.status : null;
  };

  const handleStatusChange = async (studentId: string, status: AttendanceStatus) => {
    let targetGroupId = selectedGroupId;

    if (selectedGroupId === 'ALL_STUDENTS') {
      const g = getStudentGroup(studentId);
      if (!g) return alert(t.student_not_assigned || "Student not assigned to any group!");
      targetGroupId = g.id;
    }

    if (!targetGroupId || targetGroupId === '') return alert(t.select_group_alert || "Please select a group first!");

    onSave({ date: currentDate, studentId, groupId: targetGroupId, status });

    // DISMISSED holatida avtomatik Telegram xabar yuborish
    if (status === AttendanceStatus.DISMISSED) {
      const student = students.find(s => s.id === studentId);
      if (student && settings.botToken && student.tgChatId) {
        const displayDate = currentDate.split('-').reverse().join('.');
        const msg = `🏠 <b>${t.dismissed_title || "Dars tugadi"}</b>\n\n👤 ${t.student || "O'quvchi"}: <b>${student.name}</b>\n📅 ${t.date || "Sana"}: ${displayDate}\n\n✅ ${t.dismissed_message || "Farzandingiz darsi tugadi va u uyiga jo'nadi."}\n\n<i>${settings.centerName || 'EduControl CRM'}</i>`;
        setSendingSms(studentId);
        await sendTelegramMessage(settings.botToken, student.tgChatId, msg);
        setSendingSms(null);
      }
    }
  };

  const handleSendSms = async (student: Student) => {
    const studentGroup = getStudentGroup(student.id);
    const status = getStudentStatus(student.id, studentGroup?.id);

    if (!status) return alert(t.mark_attendance_alert || "Please mark attendance first!");

    const statusText = status === AttendanceStatus.PRESENT ? `✅ ${t.status_present}` : status === AttendanceStatus.ABSENT ? `❌ ${t.status_absent}` : status === AttendanceStatus.LATE ? `⏳ ${t.status_late}` : `🏠 ${t.status_dismissed || "Dars tugadi"}`;
    const displayDate = currentDate.split('-').reverse().join('.');
    const msg = `🔔 <b>${t.notification_title}</b>\n\n👤 ${t.student}: <b>${student.name}</b>\n📅 ${t.date}: ${displayDate}\n📊 ${t.status}: ${statusText}\n🏢 ${t.settings}: ${settings.centerName || 'EduControl CRM'}`;

    if (settings.botToken && student.tgChatId) {
      setSendingSms(student.id);
      const success = await sendTelegramMessage(settings.botToken, student.tgChatId, msg);
      setSendingSms(null);
      if (success) alert(t.message_sent_alert || "Message sent to Telegram!");
    } else {
      setTestNotification({ show: true, msg });
      setTimeout(() => setTestNotification({ show: false, msg: '' }), 5000);
    }
  };

  const handleMarkAll = async (status: AttendanceStatus) => {
    if (filteredStudents.length === 0) return;
    setBulkLoading(true);

    for (const student of filteredStudents) {
      let targetGroupId = selectedGroupId;
      if (selectedGroupId === 'ALL_STUDENTS') {
        const g = getStudentGroup(student.id);
        if (!g) continue;
        targetGroupId = g.id;
      }
      if (!targetGroupId || targetGroupId === '') continue;
      onSave({ date: currentDate, studentId: student.id, groupId: targetGroupId, status });
    }

    setBulkLoading(false);
  };

  const handleMarkAllDismissed = async () => {
    if (filteredStudents.length === 0) return;
    setBulkLoading(true);

    const displayDate = currentDate.split('-').reverse().join('.');
    const studentsToNotify: Student[] = [];

    for (const student of filteredStudents) {
      let targetGroupId = selectedGroupId;
      if (selectedGroupId === 'ALL_STUDENTS') {
        const g = getStudentGroup(student.id);
        if (!g) continue;
        targetGroupId = g.id;
      }
      if (!targetGroupId || targetGroupId === '') continue;

      const currentStatus = getStudentStatus(student.id, targetGroupId);
      if (currentStatus === AttendanceStatus.PRESENT || currentStatus === AttendanceStatus.LATE) {
        studentsToNotify.push(student);
      }

      onSave({ date: currentDate, studentId: student.id, groupId: targetGroupId, status: AttendanceStatus.DISMISSED });
    }

    if (studentsToNotify.length === 0) {
      setBulkLoading(false);
      alert(t.no_students_to_notify || "No present/late students to notify");
      return;
    }

    setBulkProgress({ current: 0, total: studentsToNotify.length });
    let sentCount = 0;

    for (const student of studentsToNotify) {
      if (settings.botToken && student.tgChatId) {
        const msg = `🏠 <b>${t.dismissed_all_title || "Dars tugadi"}</b>\n\n👤 ${t.student || "O'quvchi"}: <b>${student.name}</b>\n📅 ${t.date || "Sana"}: ${displayDate}\n\n✅ ${t.dismissed_all_message || "Farzandingiz darsi tugadi va u uyiga jo'nadi."}\n\n<i>${settings.centerName || 'EduControl CRM'}</i>`;
        await sendTelegramMessage(settings.botToken, student.tgChatId, msg);
        sentCount++;
        setBulkProgress({ current: sentCount, total: studentsToNotify.length });
      }
    }

    setBulkLoading(false);
    setBulkProgress(null);
    if (sentCount > 0) {
      alert(`✅ ${sentCount} ${t.notifications_sent || "notifications sent"}`);
    }
  };

  return (
    <div className="space-y-6">
      {testNotification.show && (
        <div className="fixed top-10 right-10 z-[200] animate-in slide-in-from-right-10 duration-500">
          <div className="bg-slate-900 text-white p-6 rounded-card shadow-pop border border-white/10 max-w-sm">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertCircle size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.telegram_simulation}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-[12px] font-medium leading-relaxed whitespace-pre-wrap border border-white/5" dangerouslySetInnerHTML={{ __html: testNotification.msg }}></div>
            <p className="mt-4 text-[9px] text-slate-400 font-bold italic">{t.simulation_note}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-card shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">{t.select_group}</label>
          <select
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
            className={`w-full px-4 py-3 border rounded-2xl outline-none font-bold text-sm transition-all ${selectedGroupId === 'ALL_STUDENTS' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100'}`}
          >
            <option value="ALL_STUDENTS" className="font-bold text-indigo-600">✨ {t.all_students}</option>
            <option disabled>──────────────────</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="w-full md:w-48 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">{t.attendance_date}</label>
          <input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
        </div>
        <div className="flex-1 min-w-[200px] space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-2">{t.search}</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input placeholder={t.search_placeholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm" />
          </div>
        </div>
      </div>

      {/* Hammasini belgilash paneli */}
      <div className="bg-white p-5 rounded-card shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-2">
            <CheckCheck size={18} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.mark_all || "Hammasini belgilash"}</span>
          </div>
          <button
            onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}
            disabled={bulkLoading || filteredStudents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-2xl font-bold text-sm hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-40 border border-emerald-100 hover:border-emerald-500"
          >
            <Check size={16} />
            {t.mark_all_present || "Hammasini KELDI"}
          </button>
          <button
            onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}
            disabled={bulkLoading || filteredStudents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all disabled:opacity-40 border border-red-100 hover:border-red-500"
          >
            <X size={16} />
            {t.mark_all_absent || "Hammasini KELMADI"}
          </button>
          <button
            onClick={() => handleMarkAll(AttendanceStatus.LATE)}
            disabled={bulkLoading || filteredStudents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 text-amber-600 rounded-2xl font-bold text-sm hover:bg-amber-500 hover:text-white transition-all disabled:opacity-40 border border-amber-100 hover:border-amber-500"
          >
            <Clock size={16} />
            {t.mark_all_late || "Hammasini KECHIKDI"}
          </button>
          <div className="w-px h-8 bg-slate-200 mx-1 hidden md:block"></div>
          <button
            onClick={handleMarkAllDismissed}
            disabled={bulkLoading || filteredStudents.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-50 text-blue-600 rounded-2xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all disabled:opacity-40 border border-blue-100 hover:border-blue-500"
          >
            {bulkLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {bulkProgress
              ? `${bulkProgress.current}/${bulkProgress.total}...`
              : (t.mark_all_dismissed || "Hammasini KETDI (xabar yuborish)")}
          </button>
        </div>
        {bulkLoading && bulkProgress && (
          <div className="mt-3">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-400 font-bold mt-1.5">
              {t.sending_notifications || "Xabarlar yuborilmoqda..."} ({bulkProgress.current}/{bulkProgress.total})
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-card border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            <tr>
              <th className="px-8 py-4">{t.students} (ID)</th>
              <th className="px-8 py-4 text-center">{t.attendance}</th>
              <th className="px-8 py-4 text-right">{t.send_message}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStudents.length > 0 ? filteredStudents.map(student => {
              const studentGroup = getStudentGroup(student.id);
              const currentStatus = getStudentStatus(student.id, studentGroup?.id);

              return (
                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[10px] shadow-lg shadow-indigo-100 uppercase tracking-tighter">
                        {student.id.slice(-4)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 tracking-tight flex items-center gap-2">
                          {student.name}
                          {selectedGroupId === 'ALL_STUDENTS' && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded text-[8px] font-bold uppercase border border-indigo-100">
                              {studentGroup?.name || t.not_assigned}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{student.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => handleStatusChange(student.id, AttendanceStatus.PRESENT)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${currentStatus === AttendanceStatus.PRESENT ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-300 hover:text-emerald-500'}`}><Check size={24} /></button>
                      <button onClick={() => handleStatusChange(student.id, AttendanceStatus.ABSENT)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${currentStatus === AttendanceStatus.ABSENT ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-300 hover:text-red-500'}`}><X size={24} /></button>
                      <button onClick={() => handleStatusChange(student.id, AttendanceStatus.LATE)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${currentStatus === AttendanceStatus.LATE ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-300 hover:text-amber-500'}`}><Clock size={24} /></button>
                      <button onClick={() => handleStatusChange(student.id, AttendanceStatus.DISMISSED)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2 ${currentStatus === AttendanceStatus.DISMISSED ? 'bg-blue-500 border-blue-500 text-white shadow-lg' : 'bg-slate-50 border-transparent text-slate-300 hover:text-blue-500'}`} title={t.dismissed_title || "Dars tugadi"}><LogOut size={24} /></button>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button onClick={() => handleSendSms(student)} disabled={!currentStatus || sendingSms === student.id} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30">
                      {sendingSms === student.id ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest italic opacity-50">{t.search_empty}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceManager;
