
import React, { useState, useMemo } from 'react';
import { Expense } from '../types';
import { Plus, Trash2, X, AlertTriangle, MessageSquare, Receipt, Calendar, TrendingDown, Layers, Info, Filter, RefreshCcw, Search } from 'lucide-react';
import {
  PageHeader, Card, CardHeader, Button, KpiCard, Field, Input,
  Table, Th, Td, StatusBadge, EmptyState, TONE, Tone,
} from './ui';

interface ExpensesProps {
  t: any;
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id' | 'centerId'>) => void;
  onDelete: (id: string) => void;
}

// Har turkumga ma'noli rang — dizayn tizimidagi tone tizimi bo'yicha
const CATEGORY_TONE: Record<string, Tone> = {
  RENT: 'warning', TAX: 'info', ADVERTISING: 'brand', OTHER: 'muted',
};

const Expenses: React.FC<ExpensesProps> = ({ t, expenses, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filtr holatlari
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | Expense['category']>('ALL');

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

  // Sanalar "YYYY-MM-DD" ko'rinishida, shuning uchun to'g'ridan-to'g'ri
  // solishtirish mumkin — Date orqali o'girish vaqt mintaqasi tufayli bir kun
  // surilib ketishi mumkin edi.
  const filteredExpenses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return expenses.filter(exp => {
      if (startDate && exp.date < startDate) return false;
      if (endDate && exp.date > endDate) return false;
      if (categoryFilter !== 'ALL' && exp.category !== categoryFilter) return false;
      if (term && !exp.title.toLowerCase().includes(term)) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, startDate, endDate, categoryFilter, searchTerm]);

  const totalFiltered = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);

  // Turkumlar bo'yicha taqsimot — direktor pul qayerga ketayotganini ko'radi
  const byCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    filteredExpenses.forEach(e => { acc[e.category] = (acc[e.category] || 0) + e.amount; });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  }, [filteredExpenses]);

  const hasFilter = !!(startDate || endDate || searchTerm || categoryFilter !== 'ALL');

  const clearFilter = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setCategoryFilter('ALL');
  };

  // Vaqt mintaqasidan qat'i nazar to'g'ri ishlaydi (toISOString bir kun suradi)
  const fmtDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const applyPreset = (preset: 'this_month' | 'last_month' | 'this_year') => {
    const n = new Date();
    if (preset === 'this_month') {
      setStartDate(fmtDate(new Date(n.getFullYear(), n.getMonth(), 1)));
      setEndDate(fmtDate(new Date(n.getFullYear(), n.getMonth() + 1, 0)));
    } else if (preset === 'last_month') {
      setStartDate(fmtDate(new Date(n.getFullYear(), n.getMonth() - 1, 1)));
      setEndDate(fmtDate(new Date(n.getFullYear(), n.getMonth(), 0)));
    } else {
      setStartDate(fmtDate(new Date(n.getFullYear(), 0, 1)));
      setEndDate(fmtDate(new Date(n.getFullYear(), 11, 31)));
    }
  };

  const presetActive = (preset: 'this_month' | 'last_month' | 'this_year') => {
    const n = new Date();
    if (preset === 'this_month')
      return startDate === fmtDate(new Date(n.getFullYear(), n.getMonth(), 1)) &&
        endDate === fmtDate(new Date(n.getFullYear(), n.getMonth() + 1, 0));
    if (preset === 'last_month')
      return startDate === fmtDate(new Date(n.getFullYear(), n.getMonth() - 1, 1)) &&
        endDate === fmtDate(new Date(n.getFullYear(), n.getMonth(), 0));
    return startDate === fmtDate(new Date(n.getFullYear(), 0, 1)) &&
      endDate === fmtDate(new Date(n.getFullYear(), 11, 31));
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
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.expenses_label}
        subtitle={t.expenses_page_hint || "Markazingiz chiqimlarini turkumlar bo'yicha kuzating."}
        actions={
          <Button onClick={() => setShowModal(true)}>
            <Plus size={16} /> {t.add_expense}
          </Button>
        }
      />

      {/* Ko'rsatkichlar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard
          label={hasFilter ? (t.filtered_total || "Tanlangan davr bo'yicha") : (t.total_expenses || 'Jami xarajat')}
          value={totalFiltered.toLocaleString()}
          hint="UZS"
        />
        <KpiCard label={t.count} value={filteredExpenses.length} />
        {byCategory.slice(0, 2).map(([key, sum]) => {
          const cat = categories[key] || categories.OTHER;
          const percent = totalFiltered > 0 ? Math.round((sum / totalFiltered) * 100) : 0;
          return (
            <KpiCard key={key} label={cat.label} value={sum.toLocaleString()} hint={`${percent}% · UZS`} />
          );
        })}
      </div>

      {/* Filtr */}
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-ink-2">
            <Filter size={16} />
            <span className="text-[13px] font-semibold">{t.filter || 'Filtr'}</span>
          </div>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilter}>
              <RefreshCcw size={13} /> {t.clear_filter}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <Field label={t.search_label || 'Qidirish'} className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
              <Input
                className="pl-9"
                placeholder={t.search}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </Field>
          <Field label={t.from_date}>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </Field>
          <Field label={t.to_date}>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {([['this_month', t.this_month || 'Bu oy'], ['last_month', t.last_month || "O'tgan oy"], ['this_year', t.this_year || 'Bu yil']] as const).map(([key, label]) => (
            <Button
              key={key}
              size="sm"
              variant={presetActive(key as any) ? 'primary' : 'secondary'}
              onClick={() => applyPreset(key as any)}
            >
              {label}
            </Button>
          ))}

          <span className="w-px h-6 bg-line mx-1 hidden sm:block" />

          <Button size="sm" variant={categoryFilter === 'ALL' ? 'primary' : 'secondary'} onClick={() => setCategoryFilter('ALL')}>
            {t.all_categories || 'Barchasi'}
          </Button>
          {Object.entries(categories).map(([key, val]) => (
            <Button
              key={key}
              size="sm"
              variant={categoryFilter === key ? 'primary' : 'secondary'}
              onClick={() => setCategoryFilter(key as any)}
            >
              <val.icon size={13} /> {val.label}
            </Button>
          ))}
        </div>
      </Card>


      {/* Ro'yxat */}
      <Card padded={false}>
        <div className="px-5 pt-5 pb-4">
          <CardHeader
            title={t.history}
            subtitle={`${filteredExpenses.length} / ${expenses.length}`}
          />
        </div>
        <Table>
          <thead>
            <tr>
              <Th>{t.title}</Th>
              <Th>{t.category}</Th>
              <Th>{t.attendance_date}</Th>
              <Th align="right">{t.amount}</Th>
              <Th align="right">{t.actions || 'Amallar'}</Th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(exp => {
              const hasComment = exp.title.includes('[COMMENT]:');
              const parts = exp.title.split('[COMMENT]:');
              const title = parts[0];
              const comment = parts[1];
              const category = categories[exp.category] || categories.OTHER;

              return (
                <tr key={exp.id} className="hover:bg-[#FAFAFB] transition-colors">
                  <Td>
                    <div className="font-semibold text-ink">{title}</div>
                    {hasComment && (
                      <div className="flex items-start gap-1.5 mt-1.5 text-[12px] text-ink-2 max-w-md">
                        <MessageSquare size={12} className="text-muted mt-0.5 shrink-0" />
                        <span>{comment}</span>
                      </div>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge label={category.label} tone={CATEGORY_TONE[exp.category] || 'muted'} />
                  </Td>
                  <Td className="text-ink-2 tabular-nums">{exp.date}</Td>
                  <Td align="right">
                    <span className="font-semibold text-danger tabular-nums">
                      −{exp.amount.toLocaleString()}
                    </span>
                  </Td>
                  <Td align="right">
                    <button
                      onClick={() => setDeleteConfirmId(exp.id)}
                      title={t.delete_action || "O'chirish"}
                      className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </Td>
                </tr>
              );
            })}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={<Search size={22} />}
                    title={t.search_empty}
                    description={hasFilter ? (t.clear_filter_hint || "Filtrni tozalab ko'ring.") : undefined}
                    action={hasFilter ? (
                      <Button variant="secondary" size="sm" onClick={clearFilter}>
                        <RefreshCcw size={13} /> {t.clear_filter}
                      </Button>
                    ) : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>

      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 text-center animate-in zoom-in duration-200 border border-white/20">
            <div className="bg-red-100 w-16 h-16 rounded-3xl flex items-center justify-center text-red-600 mx-auto mb-6"><AlertTriangle size={32} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter italic">{t.delete_confirm}</h3>
            <p className="text-slate-500 text-sm mb-8 font-medium italic">{t.confirm_delete_staff}</p>
            <div className="flex gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">{t.cancel}</button>
              <button onClick={() => { onDelete(deleteConfirmId!); setDeleteConfirmId(null); }} className="flex-1 py-4 bg-red-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all">{t.delete_staff || 'Yes, delete'}</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300 border border-white/20">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-2.5 rounded-2xl text-red-600">
                  <Receipt size={24} />
                </div>
                <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">{t.add_expense}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.title}</label>
                <input required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all font-bold text-slate-800" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder={t.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.amount} (UZS)</label>
                  <input required type="number" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all font-black text-red-600 text-lg" value={formData.amount || ''} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} placeholder="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.attendance_date}</label>
                  <input required type="date" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/10 focus:bg-white transition-all font-bold text-slate-700" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.category || 'Category'}</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(categories).map(([key, val]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: key as any })}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.category === key
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.note}</label>
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
                className="w-full py-5 bg-red-600 text-white font-black rounded-2xl shadow-2xl shadow-red-100 uppercase text-xs tracking-widest mt-6 hover:scale-[1.02] active:scale-95 transition-all"
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
