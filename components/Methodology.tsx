
import React, { useState } from 'react';
import { BookOpen, Plus, FileText, Search, Layout, Clock, Download, X, ExternalLink, Bookmark } from 'lucide-react';
import { User, Group } from '../types';
import { translations, Language } from '../services/languageContext';

interface MethodologyProps {
  user: User;
  groups: Group[];
}

const Methodology: React.FC<MethodologyProps> = ({ user, groups }) => {
  const [lang] = useState<Language>(() => (localStorage.getItem('edu_lang') as Language) || 'uz');
  const t = translations[lang];
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const plans = [
    { id: '1', title: 'IELTS Writing Task 1: Maps', level: 'Advanced', group: 'IELTS Expert', date: '2024-05-10', files: 2 },
    { id: '2', title: 'Elementary Grammar: Present Continuous', level: 'Beginner', group: 'English Foundation', date: '2024-05-12', files: 1 },
    { id: '3', title: 'Mathematics: Trigonometric Functions', level: 'High School', group: 'Math Grade 11', date: '2024-05-15', files: 3 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-sm font-bold text-sm"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-700 shadow-card transition-all"
        >
          <Plus size={18}/> {t.add_lesson_plan}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white p-8 rounded-card border border-gray-100 shadow-sm hover:shadow-card transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <BookOpen size={24} />
               </div>
               <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-tighter">
                 {plan.level}
               </span>
            </div>
            <h4 className="text-lg font-bold text-slate-800 tracking-tighter mb-2">{plan.title}</h4>
            <div className="flex items-center gap-2 mb-6">
               <Bookmark size={12} className="text-indigo-400" />
               <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{plan.group}</p>
            </div>
            <div className="flex gap-3 pt-6 border-t border-slate-50">
               <button className="flex-1 bg-slate-50 hover:bg-slate-100 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-600 transition-all flex items-center justify-center gap-2">
                 <Download size={14}/> PDF
               </button>
               <button className="flex-1 bg-indigo-50 hover:bg-indigo-100 py-3 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-indigo-600 transition-all flex items-center justify-center gap-2">
                 <ExternalLink size={14}/> Ko'rish
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Methodology;
