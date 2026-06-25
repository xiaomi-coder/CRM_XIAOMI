
import React, { useState, useMemo } from 'react';
import { Payment, Student, SystemSettings, Group } from '../types';
import { CreditCard, DollarSign, Plus, Search, Calendar, Download, Trash2, Pencil, X, User } from 'lucide-react';
import { sendTelegramMessage } from '../services/telegramService';

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

  const filteredPayments = payments.filter(p =>
    getStudentName(p.studentId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportPaymentsToExcel = () => {
    const headers = [t.students, t.phone, t.attendance_date, t.month, t.amount, t.main];
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
            <div className="bg-green-50 text-green-600 p-2 rounded-lg">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">{t.cash}</p>
              <p className="font-bold">{(payments.filter(p => p.type === 'CASH').reduce((sum, p) => sum + p.amount, 0)).toLocaleString()} UZS</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-3">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">{t.card}</p>
              <p className="font-bold">{(payments.filter(p => p.type !== 'CASH').reduce((sum, p) => sum + p.amount, 0)).toLocaleString()} UZS</p>
            </div>
          </div>
          <button
            onClick={() => { setShowModal(true); setStudentSearch(''); }}
            className="bg-indigo-600 text-white p-4 rounded-xl shadow-md font-bold flex items-center justify-center space-x-2 hover:bg-indigo-700 transition-all"
          >
            <Plus size={20} />
            <span>{t.accept_payment}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">{t.last_payments}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={exportPaymentsToExcel}
              className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[11px] font-bold uppercase border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all"
            >
              <Download size={16} /> Excel
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                className="bg-gray-50 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">{t.students}</th>
                <th className="px-6 py-4">{t.groups}</th>
                <th className="px-6 py-4">{t.attendance_date}</th>
                <th className="px-6 py-4">{t.month}</th>
                <th className="px-6 py-4">{t.amount}</th>
                <th className="px-6 py-4">{t.main}</th>
                <th className="px-6 py-4">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-800">{getStudentName(payment.studentId)}</span>
                    <p className="text-[10px] text-gray-400 font-bold">{getStudent(payment.studentId)?.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    {payment.groupId ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-purple-50 text-purple-600">
                        {getGroupName(payment.groupId)}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">
                    {payment.date}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-indigo-600 font-semibold bg-indigo-50 px-2 py-1 rounded-lg w-fit text-xs">
                      <Calendar size={12} />
                      <span>{payment.forMonth}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-green-600">+{payment.amount.toLocaleString()} UZS</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${payment.type === 'CASH' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                      {payment.type === 'CASH' ? t.cash : t.card}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditPayment(payment);
                          setEditData({ amount: payment.amount, forMonth: payment.forMonth, type: payment.type, date: payment.date });
                        }}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                        title={t.edit || "Tahrirlash"}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t.delete_confirm)) {
                            onDelete(payment.id);
                          }
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title={t.delete_staff}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== To'lov qabul qilish Modal (Student Search bilan) ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-pop p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
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
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-card max-h-[200px] overflow-y-auto">
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectStudent(s)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 transition-all text-left border-b border-gray-50 last:border-0"
                      >
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                          {s.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm truncate">{s.name}</p>
                          <p className="text-[10px] text-gray-400">{s.phone} {s.nextPaymentDate ? `• ${t.next_payment_due}: ${s.nextPaymentDate}` : ''}</p>
                        </div>
                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(s.balance || 0) >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
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
                    <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg text-indigo-600 border border-indigo-200">
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
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-pop p-8 animate-in fade-in zoom-in duration-200">
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
