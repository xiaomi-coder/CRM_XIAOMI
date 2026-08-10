import React, { useMemo, useState } from 'react';
import {
  ChevronLeft, Phone, Pencil, Plus, Send, CheckCircle2, XCircle, Clock,
  LogOut, Wallet, CalendarCheck, Trophy, Activity, User as UserIcon,
} from 'lucide-react';
import {
  Student, Group, Payment, Attendance, AttendanceStatus, Result, StudentStatus,
} from '../types';
import {
  Card, CardHeader, Button, StatusBadge, Tabs, Table, Th, Td,
  Avatar, EmptyState, Tone,
} from './ui';

/**
 * O'quvchi profili — bitta o'quvchi haqidagi HAMMA narsa bir joyda.
 *
 * Dizayndagi tuzilma: sarlavha (ism, holat, aloqa) + bo'limlar
 * Umumiy / To'lovlar / Davomat / Natijalar / Telegram / Faoliyat.
 * Barcha raqamlar mavjud ma'lumotdan hisoblanadi — qo'shimcha so'rov yo'q.
 */

interface Props {
  t: any;
  student: Student;
  groups: Group[];
  payments: Payment[];
  attendance: Attendance[];
  results: Result[];
  onBack: () => void;
  onEdit?: () => void;
  onSendMessage?: () => void;
}

const STATUS_TONE: Record<string, Tone> = {
  [StudentStatus.ACTIVE]: 'success',
  [StudentStatus.GRADUATED]: 'info',
  [StudentStatus.DROPPED]: 'danger',
};

const ATT_TONE: Record<string, Tone> = {
  [AttendanceStatus.PRESENT]: 'success',
  [AttendanceStatus.ABSENT]: 'danger',
  [AttendanceStatus.LATE]: 'warning',
  [AttendanceStatus.DISMISSED]: 'info',
};

const StudentProfile: React.FC<Props> = ({
  t, student, groups, payments, attendance, results, onBack, onEdit, onSendMessage,
}) => {
  const [tab, setTab] = useState('overview');

  const myGroups = useMemo(
    () => groups.filter(g => g.studentIds.includes(student.id)),
    [groups, student.id]
  );

  const myPayments = useMemo(
    () => payments.filter(p => p.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)),
    [payments, student.id]
  );

  const myAttendance = useMemo(
    () => attendance.filter(a => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date)),
    [attendance, student.id]
  );

  const myResults = useMemo(
    () => results.filter(r => r.studentId === student.id).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [results, student.id]
  );

  // Davomat foizi — kelgan (kechikkan/ketgan ham kelgan hisoblanadi)
  const attendanceRate = useMemo(() => {
    if (myAttendance.length === 0) return null;
    const present = myAttendance.filter(a => a.status !== AttendanceStatus.ABSENT).length;
    return Math.round((present / myAttendance.length) * 100);
  }, [myAttendance]);

  const totalPaid = useMemo(() => myPayments.reduce((s, p) => s + p.amount, 0), [myPayments]);

  const statusLabel = student.status === StudentStatus.ACTIVE ? (t.active || 'Faol')
    : student.status === StudentStatus.GRADUATED ? (t.graduated || 'Bitirgan')
      : (t.dropped || 'Ketgan');

  const groupName = myGroups.map(g => g.name).join(', ') || (student.lastGroup || '—');
  const teacherName = myGroups.map(g => g.teacher).filter(Boolean).join(', ') || (student.lastTeacher || '');

  // Faoliyat tasmasi — to'lov va davomat hodisalari birga, yangi birinchi
  const activity = useMemo(() => {
    const items: { date: string; kind: string; text: string; tone: Tone }[] = [];
    myPayments.forEach(p => items.push({
      date: p.date, kind: 'payment', tone: 'success',
      text: `${t.payment_word || "To'lov"} — ${p.amount.toLocaleString()} UZS (${p.forMonth})`,
    }));
    myAttendance.slice(0, 30).forEach(a => items.push({
      date: a.date, kind: 'attendance', tone: ATT_TONE[a.status] || 'muted',
      text: a.status === AttendanceStatus.PRESENT ? (t.status_present || 'Keldi')
        : a.status === AttendanceStatus.ABSENT ? (t.status_absent || 'Kelmadi')
          : a.status === AttendanceStatus.LATE ? (t.status_late || 'Kechikdi')
            : (t.status_dismissed || 'Dars tugadi'),
    }));
    return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25);
  }, [myPayments, myAttendance, t]);

  const tabs = [
    { id: 'overview', label: t.overview_tab || 'Umumiy' },
    { id: 'payments', label: t.payments, badge: myPayments.length },
    { id: 'attendance', label: t.attendance, badge: myAttendance.length },
    { id: 'results', label: t.results_section || 'Natijalar', badge: myResults.length },
    { id: 'telegram', label: 'Telegram' },
    { id: 'activity', label: t.activity_tab || 'Faoliyat' },
  ];

  const Stat: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted mb-1">{label}</div>
      <div className="text-[15px] font-semibold text-ink">{children}</div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-300">
      {/* Orqaga */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary hover:text-primary-hover mb-4"
      >
        <ChevronLeft size={16} /> {t.back_to_students || "O'quvchilar ro'yxatiga qaytish"}
      </button>

      {/* Sarlavha */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3.5 min-w-0">
          <Avatar name={student.name} size={52} />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[24px] leading-8 font-bold text-ink tracking-[-0.01em]">{student.name}</h1>
              <StatusBadge label={statusLabel} tone={STATUS_TONE[student.status] || 'muted'} />
            </div>
            <div className="text-[13.5px] text-ink-2 mt-1 flex items-center gap-2 flex-wrap">
              {student.phone && (
                <a href={`tel:${student.phone.replace(/\s/g, '')}`} className="text-primary font-medium hover:underline">
                  {student.phone}
                </a>
              )}
              {groupName !== '—' && <><span className="text-muted">·</span><span>{groupName}</span></>}
              {teacherName && <><span className="text-muted">·</span><span>{teacherName}</span></>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onEdit && (
            <Button variant="secondary" onClick={onEdit}>
              <Pencil size={15} /> {t.edit_staff || 'Tahrirlash'}
            </Button>
          )}
          {onSendMessage && (
            <Button onClick={onSendMessage}>
              <Send size={15} /> {t.send_message}
            </Button>
          )}
        </div>
      </div>

      <div className="mb-5">
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
      </div>

      {/* ============ Umumiy ============ */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <Stat label={t.groups}>{groupName}</Stat>
              <Stat label={t.balance}>
                <span className={student.balance > 0 ? 'text-success' : student.balance < 0 ? 'text-danger' : ''}>
                  {(student.balance || 0).toLocaleString()} UZS
                </span>
              </Stat>
              <Stat label={t.attendance}>
                {attendanceRate === null ? <span className="text-muted">—</span> : `${attendanceRate}%`}
              </Stat>
              <Stat label={t.next_payment_due || "Keyingi to'lov"}>
                {student.nextPaymentDate || <span className="text-muted">—</span>}
              </Stat>
            </div>

            {attendanceRate !== null && (
              <div className="mt-5">
                <div className="text-[11px] font-bold uppercase tracking-[0.05em] text-muted mb-2">
                  {t.attendance_progress || "Kurs davomida o'zlashtirish"}
                </div>
                <div className="h-2 bg-[#F0F1F3] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${attendanceRate}%`,
                      background: attendanceRate >= 75 ? '#157A4F' : attendanceRate >= 50 ? '#A8650A' : '#C13B30',
                    }}
                  />
                </div>
              </div>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title={t.parent || 'Ota-onasi'} />
              <div className="space-y-3">
                <Stat label={t.full_name}>{student.parentName || <span className="text-muted">—</span>}</Stat>
                <Stat label={t.phone}>
                  {student.parentPhone ? (
                    <a href={`tel:${student.parentPhone.replace(/\s/g, '')}`} className="text-primary hover:underline inline-flex items-center gap-1.5">
                      <Phone size={13} /> {student.parentPhone}
                    </a>
                  ) : <span className="text-muted">—</span>}
                </Stat>
              </div>
            </Card>

            <Card>
              <CardHeader title={t.details || 'Tafsilotlar'} />
              <div className="grid grid-cols-2 gap-4">
                <Stat label={t.joined_date || "Qo'shilgan"}>{student.joinedDate || '—'}</Stat>
                <Stat label={t.total || 'Jami'}>{totalPaid.toLocaleString()} UZS</Stat>
                {student.exitDate && <Stat label={t.exit_date || 'Ketgan sana'}>{student.exitDate}</Stat>}
                {student.exitNote && <Stat label={t.exit_note || 'Izoh'}>{student.exitNote}</Stat>}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============ To'lovlar ============ */}
      {tab === 'payments' && (
        <Card padded={false}>
          <div className="px-5 pt-5">
            <CardHeader
              title={t.payments}
              subtitle={`${t.total || 'Jami'}: ${totalPaid.toLocaleString()} UZS`}
            />
          </div>
          {myPayments.length === 0 ? (
            <EmptyState icon={<Wallet size={22} />} title={t.no_payment || "To'lov qilinmagan"} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t.attendance_date}</Th>
                  <Th>{t.month}</Th>
                  <Th>{t.payment_type || "To'lov turi"}</Th>
                  <Th align="right">{t.amount}</Th>
                </tr>
              </thead>
              <tbody>
                {myPayments.map(p => (
                  <tr key={p.id} className="hover:bg-[#FAFAFB]">
                    <Td className="tabular-nums text-ink-2">{p.date}</Td>
                    <Td>{p.forMonth}</Td>
                    <Td><StatusBadge label={p.type === 'CASH' ? t.cash : t.card} tone={p.type === 'CASH' ? 'warning' : 'info'} dot={false} /></Td>
                    <Td align="right" className="font-semibold text-success tabular-nums">
                      +{p.amount.toLocaleString()}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ============ Davomat ============ */}
      {tab === 'attendance' && (
        <Card padded={false}>
          <div className="px-5 pt-5">
            <CardHeader
              title={t.attendance}
              subtitle={attendanceRate !== null ? `${attendanceRate}% · ${myAttendance.length} ${t.days || 'dars'}` : undefined}
            />
          </div>
          {myAttendance.length === 0 ? (
            <EmptyState icon={<CalendarCheck size={22} />} title={t.search_empty} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t.attendance_date}</Th>
                  <Th>{t.groups}</Th>
                  <Th align="right">{t.status}</Th>
                </tr>
              </thead>
              <tbody>
                {myAttendance.slice(0, 40).map(a => {
                  const g = groups.find(x => x.id === a.groupId);
                  const label = a.status === AttendanceStatus.PRESENT ? (t.status_present || 'Keldi')
                    : a.status === AttendanceStatus.ABSENT ? (t.status_absent || 'Kelmadi')
                      : a.status === AttendanceStatus.LATE ? (t.status_late || 'Kechikdi')
                        : (t.status_dismissed || 'Dars tugadi');
                  return (
                    <tr key={a.id} className="hover:bg-[#FAFAFB]">
                      <Td className="tabular-nums text-ink-2">{a.date}</Td>
                      <Td>{g?.name || '—'}</Td>
                      <Td align="right"><StatusBadge label={label} tone={ATT_TONE[a.status] || 'muted'} /></Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ============ Natijalar ============ */}
      {tab === 'results' && (
        <Card padded={false}>
          <div className="px-5 pt-5">
            <CardHeader title={t.results_section || 'Natijalar'} />
          </div>
          {myResults.length === 0 ? (
            <EmptyState icon={<Trophy size={22} />} title={t.search_empty} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>{t.title}</Th>
                  <Th>{t.status}</Th>
                  <Th>{t.attendance_date}</Th>
                  <Th align="right">{t.score || 'Ball'}</Th>
                </tr>
              </thead>
              <tbody>
                {myResults.map(r => (
                  <tr key={r.id} className="hover:bg-[#FAFAFB]">
                    <Td className="font-semibold">{r.title}</Td>
                    <Td><StatusBadge label={r.type} tone="brand" dot={false} /></Td>
                    <Td className="tabular-nums text-ink-2">{r.date}</Td>
                    <Td align="right" className="font-semibold">{r.score}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* ============ Telegram ============ */}
      {tab === 'telegram' && (
        <Card>
          <CardHeader title="Telegram" subtitle={t.tg_hint || "Ota-onaga davomat va to'lov xabarlari shu orqali boradi."} />
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {student.tgChatId ? (
                <>
                  <CheckCircle2 size={18} className="text-success" />
                  <span className="text-[13.5px] font-semibold text-success">{t.tg_connected || 'Ulangan'}</span>
                </>
              ) : (
                <>
                  <XCircle size={18} className="text-muted" />
                  <span className="text-[13.5px] font-semibold text-ink-2">{t.tg_not_connected || 'Ulanmagan'}</span>
                </>
              )}
            </div>

            {!student.tgChatId && (
              <div className="bg-canvas border border-line rounded-md p-4">
                <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-muted mb-1.5">
                  {t.student_code || "O'quvchi kodi"}
                </div>
                <div className="text-[20px] font-bold tracking-[0.2em] text-ink font-mono">
                  {(student.tgConnectionCode || student.id.slice(-4)).toUpperCase()}
                </div>
                <p className="text-[12.5px] text-ink-2 mt-2 leading-5">
                  {t.tg_connect_hint || "Ota-ona markazning Telegram botiga shu kodni yozsa, farzandiga ulanadi."}
                </p>
              </div>
            )}

            {onSendMessage && student.tgChatId && (
              <Button variant="secondary" onClick={onSendMessage}>
                <Send size={15} /> {t.send_message}
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* ============ Faoliyat ============ */}
      {tab === 'activity' && (
        <Card>
          <CardHeader title={t.activity_tab || 'Faoliyat'} subtitle={t.activity_hint || "So'nggi hodisalar"} />
          {activity.length === 0 ? (
            <EmptyState icon={<Activity size={22} />} title={t.search_empty} />
          ) : (
            <div className="space-y-3">
              {activity.map((it, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
                    style={{ background: it.tone === 'success' ? '#157A4F' : it.tone === 'danger' ? '#C13B30' : it.tone === 'warning' ? '#A8650A' : '#98A2B3' }}
                  />
                  <div className="min-w-0 flex-1">
                    {/* Holat tarjimalari kichik harfda ("keldi") — tasmada
                        gap boshi sifatida ko'rinishi uchun bosh harf */}
                    <div className="text-[13px] text-ink first-letter:uppercase">{it.text}</div>
                    <div className="text-[12px] text-muted tabular-nums">{it.date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default StudentProfile;
