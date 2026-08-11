import React, { useState, useMemo } from 'react';
import {
  Users, Activity, Sparkles, Loader2 as LucideLoader2, BrainCircuit, Wallet,
  UserCheck, FileText, Download, AlertCircle, Layers, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Banknote, Calendar as CalendarIcon, X, Phone, Search, Link2, Check
} from 'lucide-react';
import { Student, Group, Payment, Attendance, User, UserRole, Expense, AttendanceStatus, Lead, LeadStatus, StudentStatus } from '../types';
import { analyzeDataWithAI } from '../services/geminiService';
import { computeChurnRisk } from '../services/churnRisk';
import { db } from '../services/supabase';
import {
  PageHeader, Card, CardHeader, Button, KpiCard, StatusBadge,
  Field, Input, Table, Th, Td, EmptyState, TONE, Tone,
} from './ui';

interface DashboardProps {
  t: any;
  students: Student[];
  groups: Group[];
  payments: Payment[];
  attendance: Attendance[];
  user: User;
  expenses: Expense[];
  users: User[];
  leads: Lead[];
  /** Bot @username — ota-onaga beriladigan ulanish havolasini yasash uchun */
  botUsername?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ t, students, groups, payments, attendance, user, expenses, users, leads, botUsername }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
  const [showUnlinkedModal, setShowUnlinkedModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [debtorSearch, setDebtorSearch] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${lastDay}`;
  });

  const formatDate = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // O'quvchi guruhlarini topish
  const getStudentGroups = (studentId: string) => {
    return groups.filter(g => g.studentIds.includes(studentId));
  };

  // Qarzdor o'quvchilar — nextPaymentDate o'tgan yoki to'lov qilinmagan
  const debtorStudents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
    return students.filter(s => {
      // 1. nextPaymentDate o'tib ketgan bo'lsa — qarzdor
      if (s.nextPaymentDate && s.nextPaymentDate < today) {
        return true;
      }
      // 2. nextPaymentDate yo'q lekin guruhda bo'lsa va kamida 30 kun davomida to'lov qilmagan
      if (!s.nextPaymentDate) {
        const studentGroups = groups.filter(g => g.studentIds.includes(s.id));
        if (studentGroups.length > 0) {
          // So'nggi to'lovni tekshirish
          const studentPayments = payments.filter(p => p.studentId === s.id);
          if (studentPayments.length === 0) {
            // Hech to'lov qilinmagan va guruhda — qarzdor
            return true;
          }
          // So'nggi to'lov 30 kundan oldin bo'lsa — qarzdor
          const lastPayment = studentPayments.sort((a, b) => b.date.localeCompare(a.date))[0];
          const lastPaymentDate = new Date(lastPayment.date);
          const daysSincePayment = Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSincePayment > 30) {
            return true;
          }
        }
      }
      return false;
    }).sort((a, b) => {
      // nextPaymentDate bo'yicha saralash (eng eski birinchi)
      const dateA = a.nextPaymentDate || '9999-12-31';
      const dateB = b.nextPaymentDate || '9999-12-31';
      return dateA.localeCompare(dateB);
    });
  }, [students, groups, payments]);

  // Ketib qolish xavfi ostidagi o'quvchilar (qoidaviy bashorat)
  const riskStudents = useMemo(
    () => computeChurnRisk(students, attendance),
    [students, attendance]
  );

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // So'nggi 7 kunda kelgan lidlar
  const newLeads = useMemo(() => {
    const cutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    return leads.filter(l => (l.createdAt || '').slice(0, 10) >= cutoff).length;
  }, [leads]);

  // Bugun qo'ng'iroq qilish kerak bo'lgan lidlar (sanasi bugun yoki o'tib ketgan)
  const callsToday = useMemo(() => leads.filter(l =>
    l.followUpDate && l.followUpDate <= todayKey &&
    l.status !== LeadStatus.REGISTERED && l.status !== LeadStatus.REJECTED
  ).length, [leads, todayKey]);

  // Davomati past guruhlar — so'nggi 14 kunda 70% dan past
  const lowAttendanceGroups = useMemo(() => {
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    return groups.filter(g => {
      const recs = attendance.filter(a => a.groupId === g.id && a.date >= cutoff);
      if (recs.length < 3) return false;   // ma'lumot yetarli emas — hisobga olmaymiz
      const present = recs.filter(a => a.status !== AttendanceStatus.ABSENT).length;
      return (present / recs.length) * 100 < 70;
    }).length;
  }, [groups, attendance]);

  // Telegram'ga ulanmagan faol o'quvchilar — ota-ona xabar olmayapti
  const unlinkedStudents = useMemo(
    () => students.filter(s => s.status === StudentStatus.ACTIVE && !s.tgChatId),
    [students]
  );

  const connectLinkFor = (s: Student) =>
    botUsername && s.tgConnectionCode ? `https://t.me/${botUsername}?start=${s.tgConnectionCode}` : '';

  const copyConnectLink = (s: Student) => {
    const link = connectLinkFor(s);
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Oxirgi 6 oy daromadi (grafik uchun)
  const revenueTrend = useMemo(() => {
    const months: { key: string; label: string; total: number }[] = [];
    const names = [t.jan, t.feb, t.mar, t.apr, t.may, t.jun, t.jul, t.aug, t.sep, t.oct, t.nov, t.dec];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, label: String(names[d.getMonth()] || '').slice(0, 3), total: 0 });
    }
    payments.forEach(p => {
      const k = (p.date || '').slice(0, 7);
      const m = months.find(x => x.key === k);
      if (m) m.total += p.amount;
    });
    return months;
  }, [payments, t]);

  const maxRevenue = useMemo(() => Math.max(1, ...revenueTrend.map(m => m.total)), [revenueTrend]);

  // Lid voronkasi
  const funnel = useMemo(() => {
    const count = (s: LeadStatus) => leads.filter(l => l.status === s).length;
    const rows = [
      { label: t.lead_new || 'Yangi', value: count(LeadStatus.NEW) },
      { label: t.lead_contacted || "Bog'lanildi", value: count(LeadStatus.CONTACTED) },
      { label: t.lead_trial || 'Sinov darsida', value: count(LeadStatus.TRIAL) },
      { label: t.lead_success || "Ro'yxatdan o'tdi", value: count(LeadStatus.REGISTERED) },
    ];
    const max = Math.max(1, ...rows.map(r => r.value));
    return rows.map(r => ({ ...r, pct: Math.round((r.value / max) * 100) }));
  }, [leads, t]);

  // Yaqinlashayotgan to'lovlar — keyingi 14 kun ichida
  const upcomingPayments = useMemo(() => {
    const limit = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
    return students
      .filter(s => s.nextPaymentDate && s.nextPaymentDate >= todayKey && s.nextPaymentDate <= limit)
      .sort((a, b) => (a.nextPaymentDate || '').localeCompare(b.nextPaymentDate || ''))
      .slice(0, 6);
  }, [students, todayKey]);

  // Qarzdorlar qidiruvi
  const filteredDebtors = useMemo(() => {
    if (!debtorSearch.trim()) return debtorStudents;
    const term = debtorSearch.toLowerCase();
    return debtorStudents.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.phone.toLowerCase().includes(term) ||
      s.parentPhone?.toLowerCase().includes(term)
    );
  }, [debtorStudents, debtorSearch]);

  // Qarz kunlarini hisoblash
  const getDebtDays = (student: Student) => {
    if (student.nextPaymentDate) {
      const dueDate = new Date(student.nextPaymentDate);
      const today = new Date();
      const days = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    }
    // To'lov sanasi yo'q — so'nggi to'lovdan hisoblash
    const studentPayments = payments.filter(p => p.studentId === student.id);
    if (studentPayments.length > 0) {
      const lastPayment = studentPayments.sort((a, b) => b.date.localeCompare(a.date))[0];
      const days = Math.floor((new Date().getTime() - new Date(lastPayment.date).getTime()) / (1000 * 60 * 60 * 24));
      return days > 30 ? days - 30 : 0;
    }
    // Hech to'lov qilinmagan — ro'yxatga qo'shilgan kundan
    const joinedDate = new Date(student.joinedDate);
    return Math.floor((new Date().getTime() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const stats = useMemo(() => {
    const filterByDate = (items: any[]) => {
      if (!items) return [];
      return items.filter(item => {
        if (!item.date) return true;
        const d = item.date;
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;
        return true;
      });
    };

    const filteredPayments = filterByDate(payments);
    const filteredExpenses = filterByDate(expenses);
    const filteredAttendance = filterByDate(attendance);

    const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalOfficeExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    let totalSalaries = 0;
    // TEACHER va ADMIN rollarini hisobga olish
    users.filter(u => u.role === UserRole.TEACHER || u.role === UserRole.ADMIN).forEach(staff => {
      const staffGroupIds = staff.groupIds || [];
      const staffGroups = groups.filter(g =>
        staffGroupIds.includes(g.id) || g.teacher === staff.name
      );
      const percentage = staff.salaryPercentage || 40;

      staffGroups.forEach(g => {
        const groupRevenue = filteredPayments
          .filter(p => g.studentIds.includes(p.studentId))
          .reduce((sum, p) => sum + p.amount, 0);
        totalSalaries += (groupRevenue * percentage) / 100;
      });
    });

    const profit = totalRevenue - (totalOfficeExpenses + totalSalaries);
    const presentCount = filteredAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const attPercentage = filteredAttendance.length > 0 ? ((presentCount / filteredAttendance.length) * 100).toFixed(1) : 0;

    return { totalRevenue, totalOfficeExpenses, totalSalaries, profit, attPercentage };
  }, [payments, expenses, attendance, students, users, groups, startDate, endDate]);

  const exportToCSV = () => {
    const headers = [t.main, t.status, t.unit];
    const rows = [
      [t.total_revenue, stats.totalRevenue, "UZS"],
      [t.salaries, stats.totalSalaries, "UZS"],
      [t.expenses_label, stats.totalOfficeExpenses, "UZS"],
      [t.net_profit, stats.profit, "UZS"],
      [t.students, students.length, t.pcs]
    ];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${t.report}_${formatDate(new Date())}.csv`;
    link.click();
  };

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.dashboard}
        subtitle={t.dashboard_hint || "Markazingizda bugun nima bo'layotganini bir qarashda ko'ring."}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={exportToCSV}>
              <Download size={15} /> {t.excel_csv}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <FileText size={15} /> {t.export_pdf || 'PDF'}
            </Button>
          </>
        }
      />

      {/* Davr tanlash */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-ink-2 pb-2.5">
            <CalendarIcon size={16} />
            <span className="text-[13px] font-semibold">{t.filter || 'Davr'}</span>
          </div>
          <Field label={t.from_date} className="w-full sm:w-44">
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </Field>
          <Field label={t.to_date} className="w-full sm:w-44">
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Asosiy ko'rsatkichlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard label={t.students} value={students.length} />
        <KpiCard label={t.groups} value={groups.length} />
        <KpiCard label={t.leads} value={newLeads} hint={t.last_7_days || "so'nggi 7 kun"} />
        {user.role !== UserRole.TEACHER && (
          <KpiCard label={t.revenue} value={stats.totalRevenue.toLocaleString()} hint="UZS" />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {user.role !== UserRole.TEACHER && (
          <KpiCard
            label={t.debtors}
            value={debtorStudents.length}
            hint={t.click_to_view || "Batafsil ko'rish uchun bosing"}
            onClick={() => setShowDebtorsModal(true)}
          />
        )}
        <KpiCard label={t.attendance} value={`${stats.attPercentage}%`} />
        <KpiCard label={t.churn_risk} value={riskStudents.length} />
        {user.role !== UserRole.TEACHER && (
          <KpiCard label={t.net_profit} value={stats.profit.toLocaleString()} hint="UZS" />
        )}
      </div>

      {/* Diqqat talab qiladi */}
      {(user.role === UserRole.DIRECTOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
        <>
          <div className="text-[12px] font-bold uppercase tracking-[0.05em] text-[#5B6478] mb-2">
            {t.needs_attention || 'Diqqat talab qiladi'}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            {([
              { count: debtorStudents.length, label: t.overdue_payments || "Kechikkan to'lovlar", tone: 'danger' as Tone, onClick: () => setShowDebtorsModal(true) },
              { count: callsToday, label: t.calls_today || "Bugungi qo'ng'iroqlar", tone: 'info' as Tone },
              { count: lowAttendanceGroups, label: t.low_attendance_groups || 'Past davomatli guruhlar', tone: 'warning' as Tone },
              { count: riskStudents.length, label: t.at_risk_students || "Xavf ostidagi o'quvchilar", tone: 'warning' as Tone },
              { count: unlinkedStudents.length, label: t.unlinked_students || "Telegramga ulanmagan", tone: 'warning' as Tone, onClick: () => setShowUnlinkedModal(true) },
            ]).map((a, i) => (
              <div
                key={i}
                onClick={a.onClick}
                className={`rounded-lg p-3.5 border ${a.onClick ? 'cursor-pointer hover:brightness-[0.98]' : ''} transition-all`}
                style={{ background: TONE[a.tone].bg, borderColor: TONE[a.tone].dot + '33' }}
              >
                <div className="text-[20px] font-bold leading-tight" style={{ color: TONE[a.tone].fg }}>{a.count}</div>
                <div className="text-[12.5px] font-semibold mt-0.5" style={{ color: TONE[a.tone].fg }}>{a.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Grafik + voronka */}
      {(user.role === UserRole.DIRECTOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 mb-5">
          <Card>
            <CardHeader title={t.revenue_chart || 'Oylik daromad tendensiyasi'} />
            <div className="flex items-end gap-2 h-28">
              {revenueTrend.map(m => (
                <div key={m.key} className="flex-1 flex flex-col justify-end h-full" title={m.total.toLocaleString()}>
                  <div
                    className="w-full bg-primary rounded-t-[4px] min-h-[2px] transition-all"
                    style={{ height: `${Math.round((m.total / maxRevenue) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-muted mt-1.5">
              {revenueTrend.map(m => <span key={m.key} className="flex-1 text-center">{m.label}</span>)}
            </div>
          </Card>

          <Card>
            <CardHeader title={t.lead_conversion || 'Lid konversiyasi'} />
            <div className="space-y-2.5">
              {funnel.map(f => (
                <div key={f.label}>
                  <div className="flex justify-between text-[12px] text-ink-2 mb-1">
                    <span>{f.label}</span>
                    <span className="font-semibold text-ink tabular-nums">{f.value}</span>
                  </div>
                  <div className="h-1.5 bg-[#F0F1F3] rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Yaqinlashayotgan to'lovlar + ketib qolish xavfi */}
      {(user.role === UserRole.DIRECTOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 mb-5">
          <Card padded={false}>
            <div className="px-5 pt-5">
              <CardHeader title={t.upcoming_payments || "Yaqinlashayotgan to'lovlar"} subtitle={t.next_14_days || 'Keyingi 14 kun'} />
            </div>
            {upcomingPayments.length === 0 ? (
              <EmptyState title={t.no_upcoming_payments || "Yaqin kunlarda to'lov muddati yo'q."} />
            ) : (
              <Table>
                <tbody>
                  {upcomingPayments.map(s => {
                    const days = Math.ceil((new Date(s.nextPaymentDate!).getTime() - Date.now()) / 86400000);
                    return (
                      <tr key={s.id} className="hover:bg-[#FAFAFB]">
                        <Td className="font-semibold">{s.name}</Td>
                        <Td className="text-ink-2">{getStudentGroups(s.id).map(g => g.name).join(', ') || '—'}</Td>
                        <Td align="right" className="text-muted tabular-nums">{s.nextPaymentDate}</Td>
                        <Td align="right">
                          <StatusBadge
                            label={days <= 1 ? (t.expires_today || 'Bugun') : `${days} ${t.days_left_label || 'kun qoldi'}`}
                            tone={days <= 3 ? 'warning' : 'success'}
                          />
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>

          <Card>
            <CardHeader title={t.churn_risk} subtitle={t.churn_risk_desc} />
            {riskStudents.length === 0 ? (
              <p className="text-[13px] text-success bg-success-bg rounded-md px-3 py-2.5">
                {t.no_risk_students}
              </p>
            ) : (
              <div className="space-y-2.5">
                {riskStudents.slice(0, 5).map(r => (
                  <div key={r.student.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-ink truncate">{r.student.name}</div>
                      <div className="text-[12px] text-ink-2 truncate">{r.factors.join(' · ')}</div>
                      {(r.student.parentPhone || r.student.phone) && (
                        <a href={`tel:${(r.student.parentPhone || r.student.phone).replace(/\s/g, '')}`}
                          className="text-[12px] font-semibold text-primary inline-flex items-center gap-1 mt-0.5">
                          <Phone size={11} /> {r.student.parentPhone || r.student.phone}
                        </a>
                      )}
                    </div>
                    <StatusBadge
                      label={r.level === 'HIGH' ? (t.risk_high || 'Yuqori') : (t.risk_medium || "O'rta")}
                      tone={r.level === 'HIGH' ? 'danger' : 'warning'}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Moliya + AI */}
      {(user.role === UserRole.DIRECTOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          <Card>
            <CardHeader
              title={t.financial_report}
              actions={
                <span className="text-[12px] font-semibold text-ink-2">
                  {t.net_profit}: <span className="text-ink tabular-nums">{stats.profit.toLocaleString()}</span> UZS
                </span>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: t.revenue, value: stats.totalRevenue, tone: 'success' as Tone },
                { label: t.salaries, value: stats.totalSalaries, tone: 'info' as Tone },
                { label: t.expenses_label, value: stats.totalOfficeExpenses, tone: 'danger' as Tone },
              ].map(x => (
                <div key={x.label} className="rounded-md p-3" style={{ background: TONE[x.tone].bg }}>
                  <div className="text-[12px] font-semibold" style={{ color: TONE[x.tone].fg }}>{x.label}</div>
                  <div className="text-[18px] font-bold tabular-nums mt-0.5" style={{ color: TONE[x.tone].fg }}>
                    {x.value.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title={t.ai_analysis}
              actions={<span className="text-[10.5px] font-bold text-white bg-primary rounded-[5px] px-1.5 py-0.5">AI</span>}
            />
            <p className="text-[12.5px] text-ink-2 leading-5 mb-4">{t.ai_analysis_note}</p>
            <Button
              className="w-full"
              disabled={loadingAi}
              onClick={async () => {
                setLoadingAi(true);
                let apiKey = undefined;
                try {
                  if (user.centerId) {
                    const settings = await db.getOne('settings', 'centerId', user.centerId);
                    if (settings && settings.geminiApiKey) apiKey = settings.geminiApiKey;
                  }
                } catch (e) {
                  console.error("Settings fetch error:", e);
                }
                const res = await analyzeDataWithAI(students, payments, groups, attendance, apiKey);
                alert(res);
                setLoadingAi(false);
              }}
            >
              {loadingAi ? <><LucideLoader2 size={15} className="animate-spin" /> {t.ai_analyzing}</> : <><Sparkles size={15} /> {t.start_analysis}</>}
            </Button>
          </Card>
        </div>
      )}


      {/* ========== Qarzdorlar Modal ========== */}
      {/* Telegramga ulanmagan o'quvchilar — har biriga tayyor havola */}
      {showUnlinkedModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUnlinkedModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-e3 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-line flex justify-between items-center">
              <div>
                <h3 className="text-[15px] font-semibold text-ink">{t.unlinked_students || "Telegramga ulanmagan"}</h3>
                <p className="text-[12.5px] text-ink-2 mt-0.5">
                  {unlinkedStudents.length} {t.students?.toLowerCase() || "o'quvchi"} — {t.unlinked_hint || "ota-onasi xabar olmayapti"}
                </p>
              </div>
              <button onClick={() => setShowUnlinkedModal(false)} className="p-2 hover:bg-canvas rounded-md text-ink-2">
                <X size={20} />
              </button>
            </div>

            {!botUsername && (
              <div className="px-6 py-3 bg-warning-bg text-warning text-[12.5px] font-medium border-b border-line">
                {t.bot_not_connected_hint || "Avval Sozlamalarda Telegram botni ulang"}
              </div>
            )}

            <div className="p-4 max-h-[55vh] overflow-y-auto">
              {unlinkedStudents.length === 0 ? (
                <EmptyState title={t.all_linked || "Hamma o'quvchi ulangan"} />
              ) : (
                <div className="divide-y divide-line">
                  {unlinkedStudents.map(s => (
                    <div key={s.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold text-ink truncate">{s.name}</div>
                        <div className="text-[12px] text-muted truncate">{s.parentName} · {s.parentPhone}</div>
                      </div>
                      <button
                        onClick={() => copyConnectLink(s)}
                        disabled={!connectLinkFor(s)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-field text-[12px] font-semibold transition-all bg-primary-50 text-primary hover:bg-primary-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {copiedId === s.id
                          ? <><Check size={13} /> {t.copied || 'Nusxalandi'}</>
                          : <><Link2 size={13} /> {t.copy_connect_link || 'Ulanish havolasi'}</>}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDebtorsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDebtorsModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">{t.debtors || "Qarzdorlar"}</h3>
                  <p className="text-rose-100 text-[10px] font-bold">{debtorStudents.length} {t.students?.toLowerCase() || "o'quvchi"}</p>
                </div>
              </div>
              <button onClick={() => setShowDebtorsModal(false)} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Qidiruv */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-sm font-bold focus:ring-2 focus:ring-rose-500"
                  placeholder={t.search || "Qidiruv..."}
                  value={debtorSearch}
                  onChange={e => setDebtorSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 max-h-[50vh] overflow-y-auto">
              {filteredDebtors.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">{t.no_debtors || "Qarzdor o'quvchilar yo'q"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredDebtors.map((student, index) => {
                    const studentGroups = getStudentGroups(student.id);
                    const debtDays = getDebtDays(student);
                    return (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-rose-200 rounded-xl flex items-center justify-center text-rose-700 font-black text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-black text-slate-800">{student.name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <Phone size={12} />
                              <span>{student.phone || student.parentPhone || "Telefon yo'q"}</span>
                            </div>
                            {/* Guruh nomlari */}
                            {studentGroups.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {studentGroups.map(g => (
                                  <span key={g.id} className="text-[9px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 text-purple-600 border border-purple-200">
                                    {g.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-rose-600">
                            {debtDays} {t.days || "kun"}
                          </p>
                          <p className="text-[10px] text-rose-400 font-bold">
                            {student.nextPaymentDate
                              ? `${t.due_date || 'Muddati'}: ${student.nextPaymentDate}`
                              : (t.no_payment || "To'lov qilinmagan")
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-gray-500 font-bold">{t.total_debtors || "Jami qarzdorlar"}:</p>
                <p className="text-xl font-black text-rose-600">
                  {debtorStudents.length} {t.students?.toLowerCase() || "o'quvchi"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
