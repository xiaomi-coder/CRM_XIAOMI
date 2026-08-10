
import React, { useState, useMemo } from 'react';
import { Group, Student, Attendance, AttendanceStatus, SystemSettings } from '../types';
import { Check, X, Clock, Send, Search, Download, AlertCircle, MessageSquare, Users, LogOut, CheckCheck, Loader2 } from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';
import { PageHeader, Card, Button, Field, Input, Select, Table, Th, Td, Avatar, EmptyState } from './ui';

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
  // "Hammasini KETDI" bilan alohida — ikkalasi bir vaqtda ishlamasa ham,
  // bitta progress holatini bo'lishsa noto'g'ri tugmada foiz ko'rinib qoladi
  const [sendAllLoading, setSendAllLoading] = useState(false);
  const [sendAllProgress, setSendAllProgress] = useState<{ current: number; total: number } | null>(null);

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

  // Bitta o'quvchi uchun davomat xabari matni — yagona va ommaviy yuborish
  // ikkalasi ham shundan foydalanadi (matn ikki joyda farqli bo'lib qolmasin)
  const buildStatusMessage = (student: Student, status: AttendanceStatus) => {
    const statusText = status === AttendanceStatus.PRESENT ? `✅ ${t.status_present}` : status === AttendanceStatus.ABSENT ? `❌ ${t.status_absent}` : status === AttendanceStatus.LATE ? `⏳ ${t.status_late}` : `🏠 ${t.status_dismissed || "Dars tugadi"}`;
    const displayDate = currentDate.split('-').reverse().join('.');
    return `🔔 <b>${t.notification_title}</b>\n\n👤 ${t.student}: <b>${student.name}</b>\n📅 ${t.date}: ${displayDate}\n📊 ${t.status}: ${statusText}\n🏢 ${t.settings}: ${settings.centerName || 'EduControl CRM'}`;
  };

  const handleSendSms = async (student: Student) => {
    const studentGroup = getStudentGroup(student.id);
    const status = getStudentStatus(student.id, studentGroup?.id);

    if (!status) return alert(t.mark_attendance_alert || "Please mark attendance first!");

    const msg = buildStatusMessage(student, status);

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

  // Har bir o'quvchining O'Z hozirgi holati (keldi/kelmadi/kechikdi/ketdi)
  // bo'yicha alohida xabar — "Hammasini KETDI" dan farqli, holatlarni
  // o'zgartirmaydi, faqat allaqachon belgilanganlarga xabar yuboradi.
  const handleSendAllSms = async () => {
    const eligible = filteredStudents
      .map(student => {
        const studentGroup = getStudentGroup(student.id);
        const status = getStudentStatus(student.id, studentGroup?.id);
        return status ? { student, status } : null;
      })
      .filter((x): x is { student: Student; status: AttendanceStatus } => x !== null);

    if (eligible.length === 0) {
      alert(t.no_marked_students || "Avval hech bo'lmaganda bitta o'quvchi uchun davomatni belgilang!");
      return;
    }

    setSendAllLoading(true);
    setSendAllProgress({ current: 0, total: eligible.length });

    let sentCount = 0;
    let skippedCount = 0;
    for (const { student, status } of eligible) {
      if (settings.botToken && student.tgChatId) {
        const success = await sendTelegramMessage(settings.botToken, student.tgChatId, buildStatusMessage(student, status));
        if (success) sentCount++;
      } else {
        skippedCount++;
      }
      setSendAllProgress(prev => prev ? { current: prev.current + 1, total: prev.total } : null);
    }

    setSendAllLoading(false);
    setSendAllProgress(null);
    alert(
      `✅ ${sentCount} ${t.notifications_sent || "xabar yuborildi"}` +
      (skippedCount > 0 ? `\n⚠️ ${skippedCount} ${t.no_telegram_skipped || "o'quvchida Telegram ulanmagani uchun o'tkazib yuborildi"}` : '')
    );
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
          <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 max-w-sm">
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <AlertCircle size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.telegram_simulation}</span>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-[12px] font-medium leading-relaxed whitespace-pre-wrap border border-white/5" dangerouslySetInnerHTML={{ __html: testNotification.msg }}></div>
            <p className="mt-4 text-[9px] text-slate-400 font-bold italic">{t.simulation_note}</p>
          </div>
        </div>
      )}

      {/* Filtrlar */}
      <div className="mb-4">
        <PageHeader title={t.attendance} subtitle={t.attendance_hint || "Dars kunini belgilang va ota-onalarga xabar yuboring."} />
      </div>

      <Card className="mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label={t.select_group}>
            <Select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}>
              <option value="ALL_STUDENTS">{t.all_students}</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </Select>
          </Field>
          <Field label={t.attendance_date}>
            <Input type="date" value={currentDate} onChange={e => setCurrentDate(e.target.value)} />
          </Field>
          <Field label={t.search_label || 'Qidirish'}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
              <Input className="pl-9" placeholder={t.search_placeholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </Field>
        </div>
      </Card>

      {/* Ommaviy amallar */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3 text-ink-2">
          <CheckCheck size={16} />
          <span className="text-[13px] font-semibold">{t.mark_all || "Hammasini belgilash"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" disabled={bulkLoading || sendAllLoading || filteredStudents.length === 0}
            onClick={() => handleMarkAll(AttendanceStatus.PRESENT)}>
            <Check size={14} /> {t.mark_all_present || "Hammasi KELDI"}
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkLoading || sendAllLoading || filteredStudents.length === 0}
            onClick={() => handleMarkAll(AttendanceStatus.ABSENT)}>
            <X size={14} /> {t.mark_all_absent || "Hammasi KELMADI"}
          </Button>
          <Button size="sm" variant="secondary" disabled={bulkLoading || sendAllLoading || filteredStudents.length === 0}
            onClick={() => handleMarkAll(AttendanceStatus.LATE)}>
            <Clock size={14} /> {t.mark_all_late || "Hammasi KECHIKDI"}
          </Button>

          <span className="w-px h-6 bg-line mx-1 hidden sm:block" />

          <Button size="sm" variant="secondary" disabled={bulkLoading || sendAllLoading || filteredStudents.length === 0}
            onClick={handleMarkAllDismissed}>
            {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
            {bulkProgress ? `${bulkProgress.current}/${bulkProgress.total}...` : (t.mark_all_dismissed || "Hammasi KETDI")}
          </Button>
          <Button size="sm" disabled={bulkLoading || sendAllLoading || filteredStudents.length === 0}
            onClick={handleSendAllSms}>
            {sendAllLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {sendAllProgress ? `${sendAllProgress.current}/${sendAllProgress.total}...` : (t.send_all_messages || "Barchasiga xabar")}
          </Button>
        </div>

        {(bulkProgress || sendAllProgress) && (
          <div className="mt-3">
            <div className="w-full bg-[#F0F1F3] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${(((bulkProgress || sendAllProgress)!.current) / ((bulkProgress || sendAllProgress)!.total)) * 100}%` }}
              />
            </div>
            <p className="text-[12px] text-muted mt-1.5">{t.sending_notifications || "Xabarlar yuborilmoqda..."}</p>
          </div>
        )}
      </Card>

      <Card padded={false}>
        <Table>
          <thead>
            <tr>
              <Th>{t.students}</Th>
              <Th align="center">{t.attendance}</Th>
              <Th align="right">{t.send_message}</Th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length > 0 ? filteredStudents.map(student => {
              const studentGroup = getStudentGroup(student.id);
              const currentStatus = getStudentStatus(student.id, studentGroup?.id);
              const btn = (status: AttendanceStatus, Icon: any, tone: string, title: string) => {
                const on = currentStatus === status;
                return (
                  <button
                    onClick={() => handleStatusChange(student.id, status)}
                    title={title}
                    className={`w-9 h-9 rounded-md flex items-center justify-center border transition-colors
                      ${on ? 'text-white border-transparent' : 'bg-canvas text-muted border-line hover:text-ink'}`}
                    style={on ? { background: tone } : undefined}
                  >
                    <Icon size={17} />
                  </button>
                );
              };
              return (
                <tr key={student.id} className="hover:bg-[#FAFAFB] transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={student.name} size={32} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate flex items-center gap-2">
                          {student.name}
                          {selectedGroupId === 'ALL_STUDENTS' && (
                            <span className="text-[11px] font-medium text-primary bg-primary-subtle px-1.5 py-0.5 rounded">
                              {studentGroup?.name || t.not_assigned}
                            </span>
                          )}
                        </div>
                        <div className="text-[12px] text-muted truncate">{student.phone}</div>
                      </div>
                    </div>
                  </Td>
                  <Td align="center">
                    <div className="flex justify-center gap-2">
                      {btn(AttendanceStatus.PRESENT, Check, '#157A4F', t.status_present)}
                      {btn(AttendanceStatus.ABSENT, X, '#C13B30', t.status_absent)}
                      {btn(AttendanceStatus.LATE, Clock, '#A8650A', t.status_late)}
                      {btn(AttendanceStatus.DISMISSED, LogOut, '#2563C7', t.status_dismissed || 'Dars tugadi')}
                    </div>
                  </Td>
                  <Td align="right">
                    <button
                      onClick={() => handleSendSms(student)}
                      disabled={!currentStatus || sendingSms === student.id}
                      title={t.send_message}
                      className="p-2 text-muted hover:text-primary hover:bg-primary-subtle rounded-md transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      {sendingSms === student.id
                        ? <Loader2 size={17} className="animate-spin" />
                        : <Send size={17} />}
                    </button>
                  </Td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={3}>
                  <EmptyState icon={<Users size={22} />} title={t.search_empty} />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  );
};

export default AttendanceManager;
