import React, { useState, useMemo } from 'react';
import {
  Users, Activity, Sparkles, Loader2 as LucideLoader2, BrainCircuit, Wallet,
  UserCheck, FileText, Download, AlertCircle, Layers, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Banknote, Calendar as CalendarIcon, X, Phone, Search
} from 'lucide-react';
import { Student, Group, Payment, Attendance, User, UserRole, Expense, AttendanceStatus, Lead } from '../types';
import { analyzeDataWithAI } from '../services/geminiService';
import { db } from '../services/supabase';

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
}

const Dashboard: React.FC<DashboardProps> = ({ t, students, groups, payments, attendance, user, expenses, users, leads }) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [showDebtorsModal, setShowDebtorsModal] = useState(false);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Premium Filter Section */}
      <div className="bg-white p-8 rounded-card border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 w-full xl:w-auto">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 min-w-[300px]">
            <div className="bg-white p-2 rounded-xl shadow-sm"><CalendarIcon size={18} className="text-indigo-600" /></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t.from_date}</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-slate-800 text-sm focus:ring-0 p-0" />
            </div>
          </div>

          <div className="text-slate-300 hidden md:block"><ArrowUpRight size={24} className="rotate-45" /></div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 min-w-[300px]">
            <div className="bg-white p-2 rounded-xl shadow-sm"><CalendarIcon size={18} className="text-amber-500" /></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{t.to_date}</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none outline-none font-bold text-slate-800 text-sm focus:ring-0 p-0" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button onClick={exportToCSV} className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase border border-emerald-100 hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-50">
            <Download size={18} /> {t.excel_csv}
          </button>
          <button onClick={() => window.print()} className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-bold uppercase hover:bg-slate-800 transition-all shadow-card shadow-slate-200">
            <FileText size={18} /> {t.export_pdf?.toUpperCase() || 'PDF'}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: (t.students || 'Students').toUpperCase(), val: students.length, color: 'text-slate-800', icon: <Users size={20} />, bg: 'bg-indigo-50', show: true, clickable: false },
          { label: (t.groups || 'Groups').toUpperCase(), val: groups.length, color: 'text-slate-800', icon: <Layers size={20} />, bg: 'bg-purple-50', show: true, clickable: false },
          { label: (t.revenue || 'Revenue').toUpperCase(), val: stats.totalRevenue.toLocaleString(), color: 'text-emerald-600', icon: <TrendingUp size={20} />, bg: 'bg-emerald-50', show: user.role !== UserRole.TEACHER, clickable: false },
          { label: (t.attendance || 'Attendance').toUpperCase(), val: `${stats.attPercentage}%`, color: 'text-amber-600', icon: <BarChart3 size={20} />, bg: 'bg-amber-50', show: true, clickable: false },
          { label: (t.debtors || 'Debtors').toUpperCase(), val: debtorStudents.length, color: 'text-rose-600', icon: <AlertCircle size={20} />, bg: 'bg-rose-50', show: user.role !== UserRole.TEACHER, clickable: true, onClick: () => setShowDebtorsModal(true) }
        ].filter(i => i.show).map((item, i) => (
          <div
            key={i}
            onClick={item.clickable ? item.onClick : undefined}
            className={`bg-white p-8 rounded-card shadow-sm border border-gray-100 hover:shadow-card transition-all relative group overflow-hidden ${item.clickable ? 'cursor-pointer hover:border-rose-300 hover:scale-[1.02]' : ''}`}
          >
            <div className={`absolute top-0 right-0 p-4 ${item.bg} rounded-bl-[2rem] opacity-40 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3">{item.label}</p>
            <h3 className={`text-3xl font-bold tracking-tighter ${item.color}`}>{item.val}</h3>
            {item.clickable && <p className="text-[9px] text-rose-400 mt-2 font-bold">{t.click_to_view || "Batafsil ko'rish uchun bosing"}</p>}
          </div>
        ))}
      </div>

      {(user.role === UserRole.DIRECTOR || user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-10 rounded-card border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-bold text-slate-800 uppercase tracking-tighter text-sm">{(t.financial_report || 'Financial Report').toUpperCase()}</h3>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest">
                {(t.net_profit || 'Profit').toUpperCase()}: {stats.profit.toLocaleString()} UZS
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-emerald-50 rounded-card border border-emerald-100">
                <p className="text-[9px] font-bold text-emerald-600 uppercase mb-2">{t.revenue}</p>
                <h4 className="text-xl font-bold text-emerald-700">{stats.totalRevenue.toLocaleString()}</h4>
              </div>
              <div className="p-6 bg-blue-50 rounded-card border border-blue-100">
                <p className="text-[9px] font-bold text-blue-600 uppercase mb-2">{t.salaries}</p>
                <h4 className="text-xl font-bold text-blue-700">{stats.totalSalaries.toLocaleString()}</h4>
              </div>
              <div className="p-6 bg-rose-50 rounded-card border border-rose-100">
                <p className="text-[9px] font-bold text-rose-600 uppercase mb-2">{t.expenses_label}</p>
                <h4 className="text-xl font-bold text-rose-700">{stats.totalOfficeExpenses.toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="bg-[#0a0d14] rounded-card p-8 text-white flex flex-col shadow-pop">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600 p-2 rounded-xl"><Sparkles size={20} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.4em] leading-none mb-1">EDUCONTROL</span>
                <h3 className="text-lg font-bold italic tracking-tighter uppercase leading-none">{t.ai_analysis}</h3>
              </div>
            </div>
            <p className="text-indigo-100 text-[11px] leading-relaxed mb-8 opacity-70">{t.ai_analysis_note}</p>
            <button onClick={async () => {
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
            }} disabled={loadingAi} className="w-full bg-[#ffc107] text-black font-bold py-4 rounded-2xl text-[10px] uppercase shadow-card hover:scale-105 active:scale-95 transition-all">
              {loadingAi ? t.ai_analyzing : t.start_analysis}
            </button>
          </div>
        </div>
      )}

      {/* ========== Qarzdorlar Modal ========== */}
      {showDebtorsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDebtorsModal(false)}>
          <div className="bg-white w-full max-w-2xl rounded-card shadow-pop overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertCircle size={24} />
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-tight">{t.debtors || "Qarzdorlar"}</h3>
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
                          <div className="w-10 h-10 bg-rose-200 rounded-xl flex items-center justify-center text-rose-700 font-bold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{student.name}</p>
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
                          <p className="text-sm font-bold text-rose-600">
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
                <p className="text-xl font-bold text-rose-600">
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
