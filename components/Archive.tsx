
import React, { useState } from 'react';
import { Search, GraduationCap, UserMinus, Download, History } from 'lucide-react';
import { Student, StudentStatus, Group } from '../types';

interface ArchiveProps {
  students: Student[];
  groups: Group[];
}

interface ArchiveProps {
  t: any;
  students: Student[];
  groups: Group[];
}

const Archive: React.FC<ArchiveProps> = ({ t, students, groups }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | StudentStatus>('ALL');

  // Faqat faol bo'lmagan (Bitirgan yoki Tark etgan) o'quvchilarni filtrlaymiz
  const archivedStudents = students.filter(s =>
    s.status === StudentStatus.GRADUATED || s.status === StudentStatus.DROPPED
  );

  const filteredArchive = archivedStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone.includes(searchTerm);

    const matchesFilter = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesFilter;
  });

  const exportArchive = () => {
    const headers = [t.student_name, t.parent_phone, t.status, t.groups, t.teacher, t.exit_date, t.note];
    const rows = filteredArchive.map(s => [
      s.name,
      s.phone,
      s.status === StudentStatus.GRADUATED ? t.graduated : t.dropped,
      s.lastGroup || "—",
      s.lastTeacher || "—",
      s.exitDate || "—",
      s.exitNote || "—"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Archive_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-card border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none font-bold text-sm"
              placeholder={t.search_placeholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-gray-700 outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">{t.main.toUpperCase()} (ALL)</option>
            <option value={StudentStatus.GRADUATED}>{t.graduated.toUpperCase()}</option>
            <option value={StudentStatus.DROPPED}>{t.dropped.toUpperCase()}</option>
          </select>
        </div>
        <button
          onClick={exportArchive}
          className="bg-emerald-50 text-emerald-600 px-6 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 shadow-sm"
        >
          <Download size={14} /> EXCEL (CSV)
        </button>
      </div>

      <div className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-8 py-5">{t.student_name}</th>
              <th className="px-8 py-5">{t.status}</th>
              <th className="px-8 py-5">{t.groups} / {t.teacher}</th>
              <th className="px-8 py-5">{t.exit_date}</th>
              <th className="px-8 py-5">{t.note}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredArchive.length > 0 ? filteredArchive.map(s => (
              <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                  <div className="font-bold text-slate-800">{s.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{s.phone}</div>
                </td>
                <td className="px-8 py-6">
                  {s.status === StudentStatus.GRADUATED ? (
                    <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1.5 w-fit border border-emerald-200">
                      <GraduationCap size={12} /> {t.graduated}
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-700 px-4 py-1.5 rounded-full text-[9px] font-bold uppercase flex items-center gap-1.5 w-fit border border-red-200">
                      <UserMinus size={12} /> {t.dropped}
                    </span>
                  )}
                </td>
                <td className="px-8 py-6">
                  <div className="text-sm font-bold text-indigo-600 tracking-tighter">{s.lastGroup || '—'}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{s.lastTeacher || '—'}</div>
                </td>
                <td className="px-8 py-6 text-slate-400 font-bold text-[11px] italic">
                  {s.exitDate ? s.exitDate.split('-').reverse().join('.') : '—'}
                </td>
                <td className="px-8 py-6">
                  <div className="max-w-[200px] text-[11px] font-bold text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                    {s.exitNote || '—'}
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-8 py-32 text-center">
                  <div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                    <History size={32} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.search_empty}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Archive;
