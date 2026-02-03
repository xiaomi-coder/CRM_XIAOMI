
import React, { useState, useMemo, useEffect } from 'react';
import { User, Group, Payment, Student, UserRole } from '../types';
import { Calculator, User as UserIcon, Calendar, Percent, TrendingUp, BookOpen, Wallet, Users, Target, Activity } from 'lucide-react';

interface SalaryCalculationProps {
  users: User[];
  groups: Group[];
  payments: Payment[];
  students: Student[];
  currentUser: User;
}

interface SalaryCalculationProps {
  t: any;
  users: User[];
  groups: Group[];
  payments: Payment[];
  students: Student[];
  currentUser: User;
}

const SalaryCalculation: React.FC<SalaryCalculationProps> = ({ t, users, groups, payments, students, currentUser }) => {
  const MONTHS = [
    t.jan, t.feb, t.mar, t.apr, t.may, t.jun,
    t.jul, t.aug, t.sep, t.oct, t.nov, t.dec
  ];

  const isDirector = currentUser.role === UserRole.DIRECTOR;
  const [selectedTeacherId, setSelectedTeacherId] = useState(isDirector ? '' : currentUser.id);
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [percentage, setPercentage] = useState(40);

  useEffect(() => {
    if (!isDirector) {
      setSelectedTeacherId(currentUser.id);
      setPercentage(currentUser.salaryPercentage || 40);
    }
  }, [currentUser, isDirector]);

  useEffect(() => {
    // Agar til ozgarsa, tanlangan oyni ham yangilash kerak, aks holda eski tildagi oy qolib ketadi
    setSelectedMonth(MONTHS[new Date().getMonth()]);
  }, [t]);

  const teachers = users.filter(u => u.role === UserRole.TEACHER);

  const calculation = useMemo(() => {
    if (!selectedTeacherId) return null;

    const teacher = users.find(u => u.id === selectedTeacherId);
    if (!teacher) return null;

    const currentPercentage = isDirector ? percentage : (teacher.salaryPercentage || 40);
    const teacherGroupIds = teacher.groupIds || [];
    const teacherGroups = groups.filter(g =>
      teacherGroupIds.includes(g.id) || g.teacher === teacher.name
    );

    if (teacherGroups.length === 0) return { teacherName: teacher.name, groupsCount: 0 };

    let totalRevenue = 0;
    const groupDetails = teacherGroups.map(g => {
      const groupStudentIds = new Set(g.studentIds);
      const groupRev = payments
        .filter(p => groupStudentIds.has(p.studentId) && p.forMonth.toLowerCase() === selectedMonth.toLowerCase())
        .reduce((sum, p) => sum + p.amount, 0);

      totalRevenue += groupRev;

      return {
        name: g.name,
        subject: g.subject,
        revenue: groupRev,
        share: (groupRev * currentPercentage) / 100
      };
    });

    const teacherSalary = (totalRevenue * currentPercentage) / 100;
    const studentsCount = new Set(teacherGroups.flatMap(g => g.studentIds)).size;

    return {
      teacherName: teacher.name,
      groupsCount: teacherGroups.length,
      studentsCount,
      totalRevenue,
      teacherSalary,
      currentPercentage,
      groupDetails
    };
  }, [selectedTeacherId, selectedMonth, percentage, users, groups, payments, isDirector]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tanlov Paneli */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-wrap items-end gap-6">
        {isDirector && (
          <div className="flex-1 min-w-[250px] space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.teacher}</label>
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
              <select
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all"
                value={selectedTeacherId}
                onChange={(e) => {
                  const uid = e.target.value;
                  setSelectedTeacherId(uid);
                  const u = users.find(x => x.id === uid);
                  if (u?.salaryPercentage) setPercentage(u.salaryPercentage);
                }}
              >
                <option value="">{t.select_teacher}</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="w-full md:w-48 space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.month}</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
            <select
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {isDirector && (
          <div className="w-full md:w-32 space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t.share}</label>
            <div className="relative">
              <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
              <input
                type="number"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-black text-indigo-600"
                value={percentage}
                onChange={(e) => setPercentage(Number(e.target.value))}
              />
            </div>
          </div>
        )}
      </div>

      {calculation && calculation.groupsCount > 0 ? (
        <div className="space-y-6">
          {/* Statistika Kartalari */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet size={100} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t.salary}</p>
                <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">{calculation.teacherSalary.toLocaleString()}</h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">UZS</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-indigo-50 opacity-10 group-hover:scale-110 transition-transform">
                <Target size={100} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t.revenue}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{calculation.totalRevenue.toLocaleString()}</h3>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase italic">UZS</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-purple-50 opacity-10 group-hover:scale-110 transition-transform">
                <BookOpen size={100} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t.groups}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{calculation.groupsCount}</h3>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-amber-50 opacity-10 group-hover:scale-110 transition-transform">
                <Users size={100} />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{t.students}</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{calculation.studentsCount}</h3>
              </div>
            </div>
          </div>

          {/* Tafsilotlar Jadvali */}
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
                <Activity size={20} className="text-indigo-600" />
                {t.details} ({selectedMonth})
              </h3>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                {t.share}: {calculation.currentPercentage}%
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-5">{t.groups} / {t.subject}</th>
                    <th className="px-10 py-5 text-right">{t.revenue}</th>
                    <th className="px-10 py-5 text-right">{t.salary}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {calculation.groupDetails.map((group, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-all group">
                      <td className="px-10 py-6">
                        <div className="font-black text-slate-800 uppercase tracking-tight">{group.name}</div>
                        <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-0.5">{group.subject}</div>
                      </td>
                      <td className="px-10 py-6 text-right font-bold text-slate-600">
                        {group.revenue.toLocaleString()} <span className="text-[8px] font-black text-slate-400">UZS</span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="font-black text-emerald-600 text-lg">
                          +{group.share.toLocaleString()}
                        </div>
                        <div className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">UZS</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white">
                  <tr>
                    <td className="px-10 py-6 font-black uppercase tracking-widest text-[10px]">{t.total}:</td>
                    <td className="px-10 py-6 text-right font-black text-base">{calculation.totalRevenue.toLocaleString()} UZS</td>
                    <td className="px-10 py-6 text-right font-black text-xl text-emerald-400">{calculation.teacherSalary.toLocaleString()} UZS</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-24 rounded-[3rem] border border-dashed border-slate-200 text-center flex flex-col items-center">
          <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center text-slate-200 mb-6">
            <Calculator size={48} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">{t.search_empty}</h3>
          <p className="text-slate-400 max-w-sm mt-2 text-sm font-medium italic">
            Iltimos, o'qituvchini tanlang. Uning guruhlari borligiga va ushbu oyda o'quvchilar to'lov qilganiga ishonch hosil qiling.
          </p>
        </div>
      )}
    </div>
  );
};

export default SalaryCalculation;
