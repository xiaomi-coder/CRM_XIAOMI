
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, X, AlertTriangle, MessageSquare, Receipt, Calendar, TrendingDown, Layers, Info, Filter, RefreshCcw, Search } from 'lucide-react';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id' | 'centerId'>) => void;
  onDelete: (id: string) => void;
}

interface ExpensesProps {
  t: any;
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id' | 'centerId'>) => void;
  onDelete: (id: string) => void;
}

const Expenses: React.FC<ExpensesProps> = ({ t, expenses, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sana filtri uchun holatlar
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'OTHER' as Expense['category'],
    note: ''
  });

  const categories: Record<string, { label: string, color: string, icon: any }> = {
    RENT: { label: t.cat_rent, color: 'bg-orange-100 text-orange-600', icon: Calendar },
    TAX: { label: t.cat_tax, color: 'bg-blue-100 text-blue-600', icon: Layers },
    ADVERTISING: { label: t.cat_ad, color: 'bg-purple-100 text-purple-600', icon: TrendingDown },
    OTHER: { label: t.cat_other, color: 'bg-slate-100 text-slate-600', icon: Info }
  };

  // Filtrlangan xarajatlar
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      if (start && expDate < start) return false;
      if (end && expDate > end) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, startDate, endDate]);

  const totalFiltered = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = formData.note ? `${formData.title} [COMMENT]: ${formData.note}` : formData.title;
    onAdd({
      title: finalTitle,
      amount: formData.amount,
      date: formData.date,
      category: formData.category
    });
    setShowModal(false);
    setFormData({ title: '', amount: 0, date: new Date().toISOString().split('T')[0], category: 'OTHER', note: '' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Umumiy Xarajatlar va Statistika */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 to-rose-700 p-10 rounded-card shadow-pop shadow-red-200 text-white flex flex-col md:flex-row justify-between items-center gap-8 border border-white/10">
        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
          <Receipt size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <TrendingDown size={20} className="text-white" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">
              {startDate || endDate ? t.expenses_for_period : t.expenses_label}
            </p>
          </div>
          <h3 className="text-5xl font-bold tracking-tighter italic">
            {totalFiltered.toLocaleString()} <span className="text-lg font-bold not-italic opacity-70">UZS</span>
          </h3>
          <div className="flex items-center gap-4 mt-4">
            <p className="text-[10px] font-bold text-red-100 bg-white/10 w-fit px-4 py-1 rounded-full backdrop-blur-sm">
              {t.count}: {filteredExpenses.length}
            </p>
            {(startDate || endDate) && (
              <button onClick={clearFilter} className="flex items-center gap-1 text-[10px] font-bold uppercase text-white hover:text-amber-400 transition-colors">
                <RefreshCcw size={12} /> {t.clear_filter}
              </button>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="relative z-10 bg-white text-red-600 px-10 py-5 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-card flex items-center gap-3 hover:scale-105 active:scale-95 transition-all group"
        >
          <Plus size={20} className="stroke-[3px] group-hover:rotate-90 transition-transform duration-300" />
          {t.add_expense}
        </button>
      </div>

      {/* Filtrlash Paneli */}
      <div className="bg-white p-6 rounded-card border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-50 p-2 rounded-xl text-red-600">
            <Filter size={18} />
          </div>
          <h4 className="font-bold text-slate-800 uppercase tracking-widest text-xs">{t.from_date}:</h4>
        </div>

        <div className="flex flex-1 items-center gap-4 w-full">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.from_date}</span>
            <input
              type="date"
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs text-slate-700 focus:ring-4 focus:ring-red-500/5 transition-all"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.to_date}</span>
            <input
              type="date"
              className="w-full pl-14 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-xs text-slate-700 focus:ring-4 focus:ring-red-500/5 transition-all"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Ro'yxat */}
      <div className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <h4 className="font-bold text-slate-800 uppercase tracking-tighter text-lg flex items-center gap-2">
            <Receipt className="text-red-600" size={20} /> {t.history}
          </h4>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {startDate || endDate ? t.search : t.all_students}
          </div>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">{t.title}</th>
              <th className="px-8 py-5">{t.category}</th>
              <th className="px-8 py-5">{t.attendance_date}</th>
              <th className="px-8 py-5 text-right">{t.amount}</th>
              <th className="px-8 py-5 text-right">{t.main}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredExpenses.map(exp => {
              const hasComment = exp.title.includes('[COMMENT]:');
              const parts = exp.title.split('[COMMENT]:');
              const title = parts[0];
              const comment = parts[1];
              const category = categories[exp.category] || categories.OTHER;

              return (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1.5">
                      <div className="font-bold text-slate-800 uppercase tracking-tight text-sm">{title}</div>
                      {hasComment && (
                        <div className="flex items-start gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50 w-fit max-w-md">
                          <MessageSquare size={12} className="text-amber-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] font-bold text-amber-700 italic leading-relaxed">
                            {comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest ${category.color}`}>
                      <category.icon size={12} />
                      {category.label}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-400 font-mono italic">{exp.date}</td>
                  <td className="px-8 py-6 text-right">
                    <div className="font-bold text-red-600 text-lg">-{exp.amount.toLocaleString()}</div>
                    <div className="text-[8px] font-bold text-slate-300 uppercase">UZS</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => setDeleteConfirmId(exp.id)}
                      className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-24 text-center">
                  <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4 border border-dashed border-slate-200">
                    <Search size={40} />
                  </div>
                  <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">
                    {t.search_empty}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-card shadow-pop p-8 text-center animate-in zoom-in duration-200 border border-white/20">
            <div className="bg-red-100 w-16 h-16 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase tracking-tighter italic">{t.delete_confirm}</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium italic">{t.confirm_delete_staff}</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">{t.cancel}</button>
              <button onClick={() => { onDelete(deleteConfirmId!); setDeleteConfirmId(null); }} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all">{t.delete_staff || 'Yes, delete'}</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-card shadow-pop p-10 animate-in zoom-in duration-300 border border-white/20">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2.5 rounded-2xl text-red-600">
                  <Receipt size={24} />
                </div>
                <h3 className="text-2xl font-bold italic tracking-tighter uppercase text-slate-800">{t.add_expense}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.title}</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all font-bold text-slate-800" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder={t.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.amount} (UZS)</label>
                  <input required type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all font-bold text-red-600 text-lg" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.attendance_date}</label>
                  <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all font-bold text-slate-700" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.category || 'Category'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categories).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: key as any })}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border transition-all ${formData.category === key
                        ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-100'
                        : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-white hover:border-red-200'
                        }`}
                    >
                      <val.icon size={14} />
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <MessageSquare size={14} className="text-slate-400" />
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.note}</label>
                </div>
                <textarea
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none h-28 resize-none text-xs font-bold text-slate-600 focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all"
                  value={formData.note}
                  onChange={e => setFormData({ ...formData, note: e.target.value })}
                  placeholder={t.note_placeholder}
                />
              </div>
              <button
                type="submit"
                className="w-full py-5 bg-red-600 text-white font-bold rounded-2xl shadow-pop shadow-red-100 uppercase text-xs tracking-widest mt-6 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {t.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
