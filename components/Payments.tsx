
import React, { useState, useMemo } from 'react';
import { Payment, Student, SystemSettings, Group } from '../types';
import { CreditCard, DollarSign, Plus, Search, Calendar, Download, Trash2, Pencil, X, User, Filter, RefreshCcw } from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';
import { PageHeader, Card, CardHeader, Button, KpiCard, Field, Input, Table, Th, Td, StatusBadge, Avatar, EmptyState } from './ui';

interface PaymentsProps {
  t: any;
  payments: Payment[];
  students: Student[];
  groups: Group[];
  onAdd: (payment: Omit<Payment, 'id' | 'centerId'>, nextPaymentDate?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Payment>) => void;
  settings: SystemSettings;
}

const Payments: React.FC<PaymentsProps> = ({ t, payments, students, groups, onAdd, onDelete, onEdit, settings }) => {
  const MONTHS = [
    t.jan, t.feb, t.mar, t.apr, t.may, t.jun,
    t.jul, t.aug, t.sep, t.oct, t.nov, t.dec
  ];

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  // Sana oralig'i — avval umuman yo'q edi, ya'ni "bu oy qancha tushdi?"
  // degan savolga javob berib bo'lmasdi
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [editData, setEditData] = useState<{ amount: number; forMonth: string; type: Payment['type']; date: string }>({ amount: 0, forMonth: '', type: 'CASH', date: '' });
  const currentMonthName = MONTHS[new Date().getMonth()];

  // Student search in modal
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [newPayment, setNewPayment] = useState<{
    studentId: string;
    groupId: string;
    amount: number;
    type: Payment['type'];
    forMonth: string;
    date: string;
    nextPaymentDate: string;
  }>({
    studentId: '',
    groupId: '',
    amount: 0,
    type: 'CASH',
    forMonth: currentMonthName,
    date: new Date().toISOString().split('T')[0],
    nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
  });

  const getStudent = (id: string) => students.find(s => s.id === id);
  const getStudentName = (id: string) => getStudent(id)?.name || 'Unknown';
  const getGroup = (id: string) => groups.find(g => g.id === id);
  const getGroupName = (id: string) => getGroup(id)?.name || '';

  const getStudentGroups = (studentId: string) => {
    return groups.filter(g => g.studentIds.includes(studentId));
  };

  // Filtered students for search in modal
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const term = studentSearch.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(term) ||
      s.phone.toLowerCase().includes(term) ||
      s.parentPhone?.toLowerCase().includes(term)
    );
  }, [students, studentSearch]);

  // Sanalar "YYYY-MM-DD" — to'g'ridan-to'g'ri solishtiriladi (Date orqali
  // o'girish vaqt mintaqasi tufayli chegaradagi kunni surib yuborardi)
  const filteredPayments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return payments.filter(p => {
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      if (!term) return true;
      // Qidiruv endi telefon bo'yicha ham ishlaydi (avval faqat ism edi)
      const st = getStudent(p.studentId);
      return (st?.name || '').toLowerCase().includes(term)
        || (st?.phone || '').toLowerCase().includes(term)
        || (st?.parentPhone || '').toLowerCase().includes(term);
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [payments, students, searchTerm, startDate, endDate]);

  // Jamilar endi FILTRGA bo'ysunadi — avval har doim butun tarix ko'rsatilardi
  // va ekrandagi ro'yxat bilan mos kelmasdi
  const cashTotal = useMemo(() => filteredPayments.filter(p => p.type === 'CASH').reduce((s, p) => s + p.amount, 0), [filteredPayments]);
  const cardTotal = useMemo(() => filteredPayments.filter(p => p.type !== 'CASH').reduce((s, p) => s + p.amount, 0), [filteredPayments]);
  const grandTotal = cashTotal + cardTotal;

  const hasFilter = !!(searchTerm || startDate || endDate);
  const clearFilter = () => { setSearchTerm(''); setStartDate(''); setEndDate(''); };

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

  const exportPaymentsToExcel = () => {
    const headers = [t.students, t.phone, t.attendance_date, t.month, t.amount, t.payment_type || "To'lov turi"];
    const rows = filteredPayments.map(p => {
      const student = getStudent(p.studentId);
      return [
        student?.name || "Unknown",
        student?.phone || "",
        p.date,
        p.forMonth,
        p.amount.toString(),
        p.type
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Payments_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectStudent = (student: Student) => {
    setNewPayment({ ...newPayment, studentId: student.id, groupId: '' });
    setStudentSearch(student.name);
    setShowStudentDropdown(false);
  };

  const handleSave = async () => {
    if (!newPayment.studentId || newPayment.amount <= 0) return;

    setLoading(true);

    onAdd({
      studentId: newPayment.studentId,
      groupId: newPayment.groupId || undefined,
      amount: newPayment.amount,
      type: newPayment.type,
      forMonth: newPayment.forMonth,
      date: newPayment.date
    }, newPayment.nextPaymentDate);

    // Telegram orqali xabar yuborish
    if (settings.notifyPayment && settings.botToken) {
      const student = students.find(s => s.id === newPayment.studentId);
      if (student && student.tgChatId) {
        const message = `<b>${t.accept_payment}!</b>\n\n👤 ${t.students}: <b>${student.name}</b>\n💰 ${t.amount}: <b>${newPayment.amount.toLocaleString()} UZS</b>\n📅 ${t.for_month}: <b>${newPayment.forMonth}</b>\n⏳ ${t.next_payment_due}: <b>${newPayment.nextPaymentDate}</b>\n\n<i>${settings.centerName}</i>`;
        await sendTelegramMessage(settings.botToken, student.tgChatId, message);
      }
    }

    setLoading(false);
    setShowModal(false);
    setStudentSearch('');
    setNewPayment({
      studentId: '',
      groupId: '',
      amount: 0,
      type: 'CASH',
      forMonth: currentMonthName,
      date: new Date().toISOString().split('T')[0],
      nextPaymentDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });
  };

  return (
    <div className="animate-in fade-in duration-300">
      <PageHeader
        title={t.payments}
        subtitle={t.payments_hint || "To'lovlarni qabul qiling va tushumni kuzating."}
        actions={
          <>
            <Button variant="secondary" onClick={exportPaymentsToExcel}>
              <Download size={15} /> Excel
            </Button>
            <Button onClick={() => { setShowModal(true); setStudentSearch(''); }}>
              <Plus size={16} /> {t.accept_payment}
            </Button>
          </>
        }
      />

      {/* Ko'rsatkichlar — filtrga bo'ysunadi */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard
          label={hasFilter ? (t.filtered_total || "Tanlangan davr bo'yicha") : (t.total || 'Jami')}
          value={grandTotal.toLocaleString()}
          hint="UZS"
        />
        <KpiCard label={t.count} value={filteredPayments.length} />
        <KpiCard label={t.cash} value={cashTotal.toLocaleString()} hint="UZS" />
        <KpiCard label={t.card} value={cardTotal.toLocaleString()} hint="UZS" />
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
              <Input className="pl-9" placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
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
        </div>
      </Card>

      {/* Ro'yxat */}
      <Card padded={false}>
        <div className="px-5 pt-5">
          <CardHeader title={t.last_payments} subtitle={`${filteredPayments.length} / ${payments.length}`} />
        </div>
        <Table>
          <thead>
            <tr>
              <Th>{t.students}</Th>
              <Th>{t.groups}</Th>
              <Th>{t.attendance_date}</Th>
              <Th>{t.month}</Th>
              <Th align="right">{t.amount}</Th>
              <Th>{t.payment_type || "To'lov turi"}</Th>
              <Th align="right">{t.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map(payment => {
              const st = getStudent(payment.studentId);
              return (
                <tr key={payment.id} className="hover:bg-[#FAFAFB] transition-colors">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={st?.name || '?'} size={32} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{getStudentName(payment.studentId)}</div>
                        <div className="text-[12px] text-muted truncate">{st?.phone}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {payment.groupId
                      ? <span className="text-[12px] font-medium text-primary bg-primary-subtle px-1.5 py-0.5 rounded">{getGroupName(payment.groupId)}</span>
                      : <span className="text-muted">—</span>}
                  </Td>
                  <Td className="tabular-nums text-ink-2">{payment.date}</Td>
                  <Td>{payment.forMonth}</Td>
                  <Td align="right" className="font-semibold text-success tabular-nums">
                    +{payment.amount.toLocaleString()}
                  </Td>
                  <Td>
                    <StatusBadge
                      label={payment.type === 'CASH' ? t.cash : t.card}
                      tone={payment.type === 'CASH' ? 'warning' : 'info'}
                      dot={false}
                    />
                  </Td>
                  <Td align="right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setEditPayment(payment);
                          setEditData({ amount: payment.amount, forMonth: payment.forMonth, type: payment.type, date: payment.date });
                        }}
                        title={t.edit_staff || 'Tahrirlash'}
                        className="p-1.5 text-muted hover:text-primary hover:bg-primary-subtle rounded-md transition-colors"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => { if (window.confirm(t.delete_confirm)) onDelete(payment.id); }}
                        title={t.delete_action || "O'chirish"}
                        className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })}
            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    icon={<Search size={22} />}
                    title={t.search_empty}
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

      {/* ========== To'lov qabul qilish Modal (Student Search bilan) ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="text-indigo-600" />
                {t.accept_payment}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {/* O'quvchi qidirish */}
              <div className="relative">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.select_student}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder={t.search || "O'quvchi qidirish..."}
                    value={studentSearch}
                    onChange={(e) => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                      if (!e.target.value) {
                        setNewPayment({ ...newPayment, studentId: '', groupId: '' });
                      }
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                  />
                  {newPayment.studentId && (
                    <button
                      onClick={() => {
                        setStudentSearch('');
                        setNewPayment({ ...newPayment, studentId: '', groupId: '' });
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Dropdown ro'yxat */}
                {showStudentDropdown && !newPayment.studentId && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto">
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-all text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{s.name}</p>
                          <p className="text-[10px] text-gray-400">{s.phone} {s.nextPaymentDate ? `• ${t.next_payment_due}: ${s.nextPaymentDate}` : ''}</p>
                        </div>
                        <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${(s.balance || 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                          {(s.balance || 0).toLocaleString()}
                        </div>
                      </button>
                    )) : (
                      <p className="text-center text-gray-400 text-xs py-4">{t.search_empty || "Topilmadi"}</p>
                    )}
                  </div>
                )}

                {/* Tanlangan o'quvchi */}
                {newPayment.studentId && (
                  <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 flex items-center gap-3">
                    <User size={16} className="text-indigo-600" />
                    <div className="flex-1">
                      <p className="font-bold text-indigo-800 text-sm">{getStudentName(newPayment.studentId)}</p>
                      <p className="text-[10px] text-indigo-500">{getStudent(newPayment.studentId)?.phone}</p>
                    </div>
                    <span className="text-[10px] font-black bg-white px-2 py-1 rounded-lg text-indigo-600 border border-indigo-200">
                      {t.balance || 'Balans'}: {(getStudent(newPayment.studentId)?.balance || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {newPayment.studentId && getStudentGroups(newPayment.studentId).length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.groups}</label>
                  <select
                    className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl outline-none text-indigo-700 font-bold"
                    value={newPayment.groupId}
                    onChange={(e) => {
                      const group = getGroup(e.target.value);
                      setNewPayment({
                        ...newPayment,
                        groupId: e.target.value,
                        amount: group?.fee || newPayment.amount
                      });
                    }}
                  >
                    <option value="">{t.select_group || 'Guruhni tanlang'}...</option>
                    {getStudentGroups(newPayment.studentId).map(g => (
                      <option key={g.id} value={g.id}>{g.name} - {g.fee?.toLocaleString()} UZS</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.amount}</label>
                  <input type="number" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPayment.amount || ''} onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.for_month}</label>
                  <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPayment.forMonth} onChange={(e) => setNewPayment({ ...newPayment, forMonth: e.target.value })}>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.attendance_date}</label>
                  <input type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={newPayment.date} onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.next_payment_due}</label>
                  <input type="date" className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-xl outline-none text-indigo-700 font-bold" value={newPayment.nextPaymentDate} onChange={(e) => setNewPayment({ ...newPayment, nextPaymentDate: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.payment_method}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button onClick={() => setNewPayment({ ...newPayment, type: 'CASH' })} className={`flex-1 py-2 rounded-lg font-bold text-xs ${newPayment.type === 'CASH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>{t.cash}</button>
                  <button onClick={() => setNewPayment({ ...newPayment, type: 'CARD' })} className={`flex-1 py-2 rounded-lg font-bold text-xs ${newPayment.type === 'CARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>{t.card_transfer}</button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex space-x-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">{t.cancel}</button>
              <button
                onClick={handleSave}
                disabled={loading || !newPayment.studentId}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? t.sending : t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== To'lovni tahrirlash Modal (Sana bilan) ========== */}
      {editPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Pencil className="text-blue-600" />
                {t.edit || "Tahrirlash"}
              </h3>
              <button onClick={() => setEditPayment(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">{t.students}</p>
                <p className="font-bold text-gray-800">{getStudentName(editPayment.studentId)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.amount}</label>
                  <input type="number" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editData.amount || ''} onChange={(e) => setEditData({ ...editData, amount: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.attendance_date || 'Sana'}</label>
                  <input type="date" className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editData.date} onChange={(e) => setEditData({ ...editData, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.for_month}</label>
                <select className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none" value={editData.forMonth} onChange={(e) => setEditData({ ...editData, forMonth: e.target.value })}>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.payment_method}</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button onClick={() => setEditData({ ...editData, type: 'CASH' })} className={`flex-1 py-2 rounded-lg font-bold text-xs ${editData.type === 'CASH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>{t.cash}</button>
                  <button onClick={() => setEditData({ ...editData, type: 'CARD' })} className={`flex-1 py-2 rounded-lg font-bold text-xs ${editData.type === 'CARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}>{t.card_transfer}</button>
                </div>
              </div>
            </div>
            <div className="mt-8 flex space-x-3">
              <button onClick={() => setEditPayment(null)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">{t.cancel}</button>
              <button
                onClick={() => {
                  if (editData.amount > 0) {
                    onEdit(editPayment.id, { amount: editData.amount, forMonth: editData.forMonth, type: editData.type, date: editData.date });
                    setEditPayment(null);
                  }
                }}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
