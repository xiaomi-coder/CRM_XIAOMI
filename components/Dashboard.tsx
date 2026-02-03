import React, { useState, useMemo } from 'react';
import {
  Users, Activity, Sparkles, Loader2 as LucideLoader2, BrainCircuit, Wallet,
  UserCheck, FileText, Download, AlertCircle, Layers, TrendingUp, TrendingDown, ArrowUpRight, BarChart3, Banknote, Calendar as CalendarIcon, X, Phone
} from 'lucide-react';
import { Student, Group, Payment, Attendance, User, UserRole, Expense, AttendanceStatus, Lead } from '../types';
import { analyzeDataWithAI } from '../services/geminiService';

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

  // Qarzdor o'quvchilar ro'yxati
  const debtorStudents = useMemo(() => {
    return students.filter(s => s.balance < 0).sort((a, b) => a.balance - b.balance);
  }, [students]);

  const stats = useMemo(() => {
    const filterByDate = (items: any[]) => {
      if (!items) return [];
      return items.filter(item => {
        if (!item.date) return true;
        const d = item.date; // "YYYY-MM-DD"
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
    users.filter(u => u.role === UserRole.TEACHER).forEach(teacher => {
      const teacherGroupIds = teacher.groupIds || [];
      const teacherGroups = groups.filter(g =>
        teacherGroupIds.includes(g.id) || g.teacher === teacher.name
      );
      const percentage = teacher.salaryPercentage || 40;

      teacherGroups.forEach(g => {
        const groupRevenue = filteredPayments
          .filter(p => g.studentIds.includes(p.studentId))
          .reduce((sum, p) => sum + p.amount, 0);
        totalSalaries += (groupRevenue * percentage) / 100;
      });
    });

    const profit = totalRevenue - (totalOfficeExpenses + totalSalaries);
    const presentCount = filteredAttendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
    const attPercentage = filteredAttendance.length > 0 ? ((presentCount / filteredAttendance.length) * 100).toFixed(1) : 0;
    const debtCount = students.filter(s => s.balance < 0).length;

    return { totalRevenue, totalOfficeExpenses, totalSalaries, profit, attPercentage, debtCount };
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
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 w-full xl:w-auto">
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 min-w-[300px]">
            <div className="bg-white p-2 rounded-xl shadow-sm"><CalendarIcon size={18} className="text-indigo-600" /></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.from_date}</span>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-slate-800 text-sm focus:ring-0 p-0" />
            </div>
          </div>

          <div className="text-slate-300 hidden md:block"><ArrowUpRight size={24} className="rotate-45" /></div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 min-w-[300px]">
            <div className="bg-white p-2 rounded-xl shadow-sm"><CalendarIcon size={18} className="text-amber-500" /></div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.to_date}</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none outline-none font-black text-slate-800 text-sm focus:ring-0 p-0" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full xl:w-auto">
          <button onClick={exportToCSV} className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-white text-emerald-600 px-8 py-4 rounded-2xl text-[10px] font-black uppercase border border-emerald-100 hover:bg-emerald-50 transition-all shadow-lg shadow-emerald-50">
            <Download size={18} /> {t.excel_csv}
          </button>
          <button onClick={() => window.print()} className="flex-1 xl:flex-none flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
            <FileText size={18} /> {t.export_pdf.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: t.students.toUpperCase(), val: students.length, color: 'text-slate-800', icon: <Users size={20} />, bg: 'bg-indigo-50', show: true, clickable: false },
          { label: t.groups.toUpperCase(), val: groups.length, color: 'text-slate-800', icon: <Layers size={20} />, bg: 'bg-purple-50', show: true, clickable: false },
          { label: t.revenue.toUpperCase(), val: stats.totalRevenue.toLocaleString(), color: 'text-emerald-600', icon: <TrendingUp size={20} />, bg: 'bg-emerald-50', show: user.role !== UserRole.TEACHER, clickable: false },
          { label: t.attendance.toUpperCase(), val: `${stats.attPercentage}%`, color: 'text-amber-600', icon: <BarChart3 size={20} />, bg: 'bg-amber-50', show: true, clickable: false },
          { label: t.debtors.toUpperCase(), val: stats.debtCount, color: 'text-rose-600', icon: <AlertCircle size={20} />, bg: 'bg-rose-50', show: user.role !== UserRole.TEACHER, clickable: true, onClick: () => setShowDebtorsModal(true) }
        ].filter(i => i.show).map((item, i) => (
          <div
            key={i}
            onClick={item.clickable ? item.onClick : undefined}
            className={`bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all relative group overflow-hidden ${item.clickable ? 'cursor-pointer hover:border-rose-300 hover:scale-[1.02]' : ''}`}
          >
            <div className={`absolute top-0 right-0 p-4 ${item.bg} rounded-bl-[2rem] opacity-40 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-3">{item.label}</p>
            <h3 className={`text-3xl font-black tracking-tighter ${item.color}`}>{item.val}</h3>
            {item.clickable && <p className="text-[9px] text-rose-400 mt-2 font-bold">{t.click_to_view || "Batafsil ko'rish uchun bosing"}</p>}
          </div>
        ))}
      </div>

      {(user.role === UserRole.DIRECTOR || user.role === UserRole.SUPER_ADMIN) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">{t.financial_report.toUpperCase()}</h3>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                {t.net_profit.toUpperCase()}: {stats.profit.toLocaleString()} UZS
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                <p className="text-[9px] font-black text-emerald-600 uppercase mb-2">{t.revenue}</p>
                <h4 className="text-xl font-black text-emerald-700">{stats.totalRevenue.toLocaleString()}</h4>
              </div>
              <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
                <p className="text-[9px] font-black text-blue-600 uppercase mb-2">{t.salaries}</p>
                <h4 className="text-xl font-black text-blue-700">{stats.totalSalaries.toLocaleString()}</h4>
              </div>
              <div className="p-6 bg-rose-50 rounded-[2rem] border border-rose-100">
                <p className="text-[9px] font-black text-rose-600 uppercase mb-2">{t.expenses_label}</p>
                <h4 className="text-xl font-black text-rose-700">{stats.totalOfficeExpenses.toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="bg-[#0a0d14] rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-indigo-600 p-2 rounded-xl"><Sparkles size={20} /></div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.4em] leading-none mb-1">EDUCONTROL</span>
                <h3 className="text-lg font-black italic tracking-tighter uppercase leading-none">{t.ai_analysis}</h3>
              </div>
            </div>
            <p className="text-indigo-100 text-[11px] leading-relaxed mb-8 opacity-70">{t.ai_analysis_note}</p>
            <button onClick={async () => { setLoadingAi(true); const res = await analyzeDataWithAI(students, payments, groups, attendance); alert(res); setLoadingAi(false); }} disabled={loadingAi} className="w-full bg-[#ffc107] text-black font-black py-4 rounded-2xl text-[10px] uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">
              {loadingAi ? t.ai_analyzing : t.start_analysis}
            </button>
          </div>
        </div>
      )}

      {/* Qarzdorlar Modal */}
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

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {debtorStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-30" />
                  <p className="font-bold">{t.no_debtors || "Qarzdor o'quvchilar yo'q"}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {debtorStudents.map((student, index) => (
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
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-rose-600">{Math.abs(student.balance).toLocaleString()} UZS</p>
                        <p className="text-[10px] text-rose-400 font-bold uppercase">{t.debt || "Qarz"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-[11px] text-gray-500 font-bold">{t.total_debt || "Jami qarz"}:</p>
                <p className="text-xl font-black text-rose-600">
                  {Math.abs(debtorStudents.reduce((sum, s) => sum + s.balance, 0)).toLocaleString()} UZS
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

