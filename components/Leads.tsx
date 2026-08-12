
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, TestTemplate } from '../types';
import {
  Plus, Trash2, X, Search, ArrowRight, ArrowLeft, Phone, ClipboardCheck,
  Key, Award, Copy, Check, ChevronDown, ChevronUp, UserPlus, Info, TrendingUp,
  CalendarClock, History
} from 'lucide-react';
import { db } from '../services/supabase';

interface LeadsProps {
  t: any;
  leads: Lead[];
  centerId: string; // Markaz ID - testlarni filtrlash uchun
  /** Takroriy lidni aniqlash va "o'quvchiga aylangan"ni ko'rsatish uchun */
  students?: { id: string; name: string; phone?: string }[];
  onAdd: (lead: Omit<Lead, 'id' | 'centerId'>) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
  onRegister: (lead: Lead) => void;
  onUpdateLead?: (id: string, data: Partial<Lead>) => void;
}

/** Telefonni solishtirish uchun: faqat raqamlar, oxirgi 9 ta belgi (+998 bo'lsa ham, bo'lmasa ham) */
const phoneKey = (phone?: string) => (phone || '').replace(/\D/g, '').slice(-9);

/** Lid manbalari — direktor qaysi kanal ishlayotganini ko'rishi uchun */
const SOURCES = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'telegram', label: 'Telegram' },
  { key: 'tanish', label: 'Tanish orqali' },
  { key: 'reklama', label: 'Reklama' },
  { key: 'boshqa', label: 'Boshqa' },
];
const sourceLabel = (key?: string) => SOURCES.find(s => s.key === key)?.label || null;

const todayStr = () => new Date().toISOString().split('T')[0];

/** Voronka bosqichlari — tartib muhim, oldinga/orqaga siljish shu bo'yicha */
const FLOW = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.TRIAL, LeadStatus.REGISTERED];

const Leads: React.FC<LeadsProps> = ({ t, leads, centerId, students = [], onAdd, onUpdateStatus, onDelete, onRegister, onUpdateLead }) => {
  /** Sudrab ko'chirish holati */
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  /** O'chirishdan oldin tasdiq — avval bir bosishda yo'qolardi */
  const [confirmDelete, setConfirmDelete] = useState<Lead | null>(null);
  /** Izohni joyida tahrirlash */
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState<Lead | null>(null);
  const [viewResult, setViewResult] = useState<Lead | null>(null);
  const [createdPin, setCreatedPin] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  /** Qayta qo'ng'iroq sanasini tahrirlash */
  const [editingDate, setEditingDate] = useState<string | null>(null);
  /** Tarixni ko'rish */
  const [showHistory, setShowHistory] = useState<Lead | null>(null);

  const [formData, setFormData] = useState({
    name: '', phone: '', parentName: '', parentPhone: '', subject: '', note: '', source: ''
  });

  useEffect(() => {
    db.get('test_templates').then(data => {
      if (Array.isArray(data)) {
        setTemplates(data.filter(x => x.centerId === centerId));
      }
    }).catch(err => console.error("Templates error:", err));
  }, [centerId]);

  /**
   * Bosqich sozlamalari. `hint` — eng muhim qo'shimcha: foydalanuvchi har bir
   * ustun nimani anglatishini bilmasa, voronka tushunarsiz bo'lib qoladi.
   * Ranglar to'liq yozilgan (Tailwind dinamik satrlarni ko'rmaydi).
   */
  const columns = [
    { status: LeadStatus.NEW, label: t.lead_new, hint: t.lead_hint_new, dot: 'bg-sky-500', count: 'text-sky-600', hover: 'hover:ring-sky-100' },
    { status: LeadStatus.CONTACTED, label: t.lead_contacted, hint: t.lead_hint_contacted, dot: 'bg-amber-500', count: 'text-amber-600', hover: 'hover:ring-amber-100' },
    { status: LeadStatus.TRIAL, label: t.lead_trial, hint: t.lead_hint_trial, dot: 'bg-violet-500', count: 'text-violet-600', hover: 'hover:ring-violet-100' },
    { status: LeadStatus.REGISTERED, label: t.lead_success, hint: t.lead_hint_success, dot: 'bg-emerald-500', count: 'text-emerald-600', hover: 'hover:ring-emerald-100' },
  ];

  const matches = (l: Lead) => {
    const s = searchTerm.trim().toLowerCase();
    if (!s) return true;
    return (l.name || '').toLowerCase().includes(s)
      || (l.phone || '').includes(s)
      || (l.subject || '').toLowerCase().includes(s);
  };

  const activeLeads = useMemo(
    () => leads.filter(l => l.status !== LeadStatus.REJECTED && matches(l)),
    [leads, searchTerm]
  );
  const rejectedLeads = useMemo(
    () => leads.filter(l => l.status === LeadStatus.REJECTED && matches(l)),
    [leads, searchTerm]
  );

  /** Voronka ko'rsatkichlari — direktor uchun asosiy ma'lumot */
  const stats = useMemo(() => {
    const total = leads.length;
    const won = leads.filter(l => l.status === LeadStatus.REGISTERED).length;
    const lost = leads.filter(l => l.status === LeadStatus.REJECTED).length;
    const closed = won + lost;
    return {
      total,
      won,
      inProgress: total - won - lost,
      conversion: closed > 0 ? Math.round((won / closed) * 100) : 0,
    };
  }, [leads]);

  /** Lid necha kun oldin kelgan — e'tiborsiz qolganini ko'rsatish uchun */
  const ageOf = (lead: Lead): number | null => {
    if (!lead.createdAt) return null;
    const days = Math.floor((Date.now() - new Date(lead.createdAt).getTime()) / 86400000);
    return isNaN(days) || days < 0 ? null : days;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, status: LeadStatus.NEW, createdAt: new Date().toISOString() } as any);
    setShowModal(false);
    setFormData({ name: '', phone: '', parentName: '', parentPhone: '', subject: '', note: '', source: '' });
  };

  const handleAssignTest = async () => {
    if (!showTestModal || !selectedTemplateId) return;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const leadId = showTestModal.id;
    try {
      await db.update('leads', leadId, {
        testId: selectedTemplateId,
        testStatus: 'PENDING',
        testPin: pin,
        testScore: undefined
      });
      setShowTestModal(null);
      setSelectedTemplateId('');
      setCreatedPin(pin); // alert() o'rniga — PIN ni nusxalash mumkin
      if (onUpdateLead) onUpdateLead(leadId, { testPin: pin, testStatus: 'PENDING' } as any);
    } catch (err) {
      console.error('Assign test error:', err);
    }
  };

  const copyPin = (pin: string) => {
    navigator.clipboard?.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 1600);
  };

  /** Bu lid allaqachon o'quvchi bazasida bormi (telefon bo'yicha) */
  const convertedIds = useMemo(() => {
    const keys = new Set(students.map(s => phoneKey(s.phone)).filter(Boolean));
    return new Set(leads.filter(l => phoneKey(l.phone) && keys.has(phoneKey(l.phone))).map(l => l.id));
  }, [students, leads]);

  /** Yangi lid kiritishda: shu telefon allaqachon bormi */
  const duplicateWarning = useMemo(() => {
    const key = phoneKey(formData.phone);
    if (!key) return null;
    const lead = leads.find(l => phoneKey(l.phone) === key);
    if (lead) return `${t.duplicate_lead || 'Bu raqam allaqachon lidlar ichida'}: ${lead.name}`;
    const student = students.find(s => phoneKey(s.phone) === key);
    if (student) return `${t.duplicate_student || 'Bu raqam allaqachon o\'quvchi'}: ${student.name}`;
    return null;
  }, [formData.phone, leads, students, t]);

  const moveForward = (lead: Lead) => {
    const idx = FLOW.indexOf(lead.status);
    if (idx >= 0 && idx < FLOW.length - 1) onUpdateStatus(lead.id, FLOW[idx + 1]);
    else onRegister(lead);
  };

  /** Sudrab tashlanganda — bosqichni to'g'ridan-to'g'ri o'zgartiradi */
  const handleDrop = (status: LeadStatus) => {
    const lead = leads.find(l => l.id === dragId);
    setDragId(null);
    setDragOver(null);
    if (!lead || lead.status === status) return;
    onUpdateStatus(lead.id, status);
  };

  /**
   * Bugun yoki kechikkan qo'ng'iroqlar — "hozir nima qilishim kerak" degan
   * savolga javob. Voronkada eng ko'p yo'qotiladigan narsa shu.
   */
  const dueLeads = useMemo(() => {
    const today = todayStr();
    return leads
      .filter(l => l.followUpDate && l.status !== LeadStatus.REJECTED && l.status !== LeadStatus.REGISTERED)
      .filter(l => (l.followUpDate as string) <= today)
      .sort((a, b) => (a.followUpDate! < b.followUpDate! ? -1 : 1));
  }, [leads]);

  /** Manba bo'yicha taqsimot — qaysi kanal ishlayapti */
  const bySource = useMemo(() => {
    const counts = new Map<string, number>();
    leads.forEach(l => { if (l.source) counts.set(l.source, (counts.get(l.source) || 0) + 1); });
    return SOURCES.map(s => ({ ...s, count: counts.get(s.key) || 0 })).filter(s => s.count > 0);
  }, [leads]);

  const saveNote = (lead: Lead) => {
    const value = noteDraft.trim();
    setEditingNote(null);
    if (value !== (lead.note || '') && onUpdateLead) onUpdateLead(lead.id, { note: value });
  };
  const moveBack = (lead: Lead) => {
    const idx = FLOW.indexOf(lead.status);
    if (idx > 0) onUpdateStatus(lead.id, FLOW[idx - 1]);
  };

  /** Tugmada keyingi bosqich nomi turadi (avval shunchaki "STATUS" yozilgan edi) */
  const nextLabel = (status: LeadStatus) => {
    const idx = FLOW.indexOf(status);
    if (idx === FLOW.length - 1) return t.add_student;
    return columns[idx + 1]?.label ?? '';
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Bo'lim nima uchun ekanini tushuntirish */}
      <div className="bg-primary-subtle border border-line rounded-lg px-4 py-3 flex items-start gap-2.5 mb-4">
        <Info size={16} className="text-primary shrink-0 mt-0.5" />
        <p className="text-[13px] text-ink-2 leading-5">{t.funnel_hint}</p>
      </div>

      {/* BUGUNGI ISH — kechikkan va bugungi qo'ng'iroqlar birinchi o'rinda */}
      {dueLeads.length > 0 && (
        <div className="bg-white rounded-3xl border-2 border-amber-200 overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 flex items-center gap-2.5">
            <CalendarClock size={16} className="text-amber-600 shrink-0" />
            <span className="text-[11px] font-black text-amber-900 uppercase tracking-widest">
              {t.calls_today || "Bugun qo'ng'iroq qilish kerak"}
            </span>
            <span className="text-[10px] font-black text-amber-700 bg-white px-2 py-0.5 rounded-lg">{dueLeads.length}</span>
          </div>
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            {dueLeads.map(lead => {
              const overdue = (lead.followUpDate as string) < todayStr();
              return (
                <div key={lead.id} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-2xl">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-slate-800 text-sm truncate">{lead.name}</p>
                    <p className={`text-[10px] font-black uppercase tracking-wide ${overdue ? 'text-red-500' : 'text-amber-600'}`}>
                      {overdue ? (t.overdue || 'Kechikkan') : (t.today_label || 'Bugun')} · {lead.followUpDate}
                    </p>
                  </div>
                  <a href={`tel:${lead.phone}`} className="p-2 rounded-md bg-primary text-white hover:bg-primary-hover transition-colors shrink-0">
                    <Phone size={14} />
                  </a>
                  <button
                    onClick={() => onUpdateLead?.(lead.id, { followUpDate: '' })}
                    title={t.mark_done || 'Bajarildi'}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-colors shrink-0"
                  >
                    <Check size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Voronka ko'rsatkichlari */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600"><UserPlus size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{t.total_leads}</p>
            <p className="text-xl font-black text-slate-800 leading-tight">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600"><ClipboardCheck size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{t.in_progress}</p>
            <p className="text-xl font-black text-slate-800 leading-tight">{stats.inProgress}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600"><Award size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{t.lead_success}</p>
            <p className="text-xl font-black text-slate-800 leading-tight">{stats.won}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600"><TrendingUp size={18} /></div>
          <div className="min-w-0">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{t.conversion}</p>
            <p className="text-xl font-black text-emerald-600 leading-tight">{stats.conversion}%</p>
          </div>
        </div>
      </div>

      {/* Manba bo'yicha taqsimot — qaysi kanal lid keltiryapti */}
      {bySource.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 px-5 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.by_source || 'Manba bo\'yicha'}</span>
          {bySource.map(s => (
            <div key={s.key} className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">{s.label}</span>
              <span className="text-sm font-black text-slate-800">{s.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Qidiruv + qo'shish */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-3xl border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-200 transition-all"
            placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-3.5 py-2 rounded-field font-semibold text-[13.5px] flex items-center justify-center gap-1.5 hover:bg-primary-hover transition-colors"
        >
          <Plus size={18} /> {t.add_lead}
        </button>
      </div>

      {/* Voronka */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col, colIdx) => {
          const items = activeLeads.filter(l => l.status === col.status);
          return (
            <div key={col.status} className="space-y-3">

              {/* Ustun sarlavhasi + BOSQICH TUSHUNTIRISHI */}
              <div className="px-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.dot}`} />
                    <h4 className="font-black text-slate-800 text-[11px] uppercase tracking-widest truncate">{col.label}</h4>
                  </div>
                  <span className={`text-[10px] font-black ${col.count} bg-white border border-slate-100 px-2 py-0.5 rounded-lg shrink-0`}>
                    {items.length}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 leading-snug">{col.hint}</p>
              </div>

              <div
                onDragOver={e => { e.preventDefault(); if (dragOver !== col.status) setDragOver(col.status); }}
                onDragLeave={() => setDragOver(prev => (prev === col.status ? null : prev))}
                onDrop={e => { e.preventDefault(); handleDrop(col.status); }}
                className={`rounded-3xl p-3 min-h-[400px] border flex flex-col gap-3 transition-colors ${dragOver === col.status
                  ? 'bg-emerald-50 border-emerald-300 border-dashed'
                  : 'bg-slate-50 border-slate-100'
                  }`}
              >
                {items.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-300 text-center px-4">
                      {dragOver === col.status ? (t.drop_here || 'Shu yerga tashlang') : t.no_leads_here}
                    </p>
                  </div>
                )}

                {items.map(lead => {
                  const age = ageOf(lead);
                  const stale = age !== null && age >= 7 && col.status !== LeadStatus.REGISTERED;
                  const converted = convertedIds.has(lead.id);
                  return (
                    <div key={lead.id}
                      draggable
                      onDragStart={() => setDragId(lead.id)}
                      onDragEnd={() => { setDragId(null); setDragOver(null); }}
                      className={`bg-white p-4 rounded-2xl border border-slate-100 hover:ring-2 ${col.hover} hover:border-transparent transition-all group cursor-grab active:cursor-grabbing ${dragId === lead.id ? 'opacity-40' : ''
                        }`}>

                      {/* Ism + fan */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0">
                          <h5 className="font-black text-slate-800 text-sm truncate">{lead.name}</h5>
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {lead.subject && (
                              <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                                {lead.subject}
                              </span>
                            )}
                            {sourceLabel(lead.source) && (
                              <span className="text-[9px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md uppercase">
                                {sourceLabel(lead.source)}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setConfirmDelete(lead)}
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Telefon — bosilsa qo'ng'iroq qiladi */}
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 mb-2 transition-colors w-fit"
                      >
                        <Phone size={11} /> {lead.phone}
                      </a>

                      {/* Necha kun oldin kelgan — 7 kundan oshsa qizil */}
                      {age !== null && (
                        <p className={`text-[9px] font-black uppercase tracking-wide mb-2 ${stale ? 'text-red-500' : 'text-slate-300'}`}>
                          {age === 0 ? t.today_label : `${age} ${t.days_ago}`}
                        </p>
                      )}

                      {/* Izoh — avval yozilardi-yu, hech qayerda ko'rinmasdi */}
                      {editingNote === lead.id ? (
                        <textarea
                          autoFocus
                          rows={2}
                          value={noteDraft}
                          onChange={e => setNoteDraft(e.target.value)}
                          onBlur={() => saveNote(lead)}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveNote(lead); }
                            if (e.key === 'Escape') setEditingNote(null);
                          }}
                          placeholder={t.note}
                          className="w-full mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-bold outline-none resize-none focus:ring-2 focus:ring-amber-300"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingNote(lead.id); setNoteDraft(lead.note || ''); }}
                          className={`w-full text-left mb-2 px-3 py-2 rounded-xl text-[11px] font-bold transition-colors ${lead.note
                            ? 'bg-amber-50 text-slate-600 hover:bg-amber-100 border border-amber-100'
                            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50 border border-dashed border-slate-200'
                            }`}
                        >
                          {lead.note || `+ ${t.note}`}
                        </button>
                      )}

                      {/* Qayta qo'ng'iroq sanasi */}
                      {editingDate === lead.id ? (
                        <input
                          type="date"
                          autoFocus
                          defaultValue={lead.followUpDate || ''}
                          onBlur={e => { setEditingDate(null); onUpdateLead?.(lead.id, { followUpDate: e.target.value }); }}
                          onChange={e => { setEditingDate(null); onUpdateLead?.(lead.id, { followUpDate: e.target.value }); }}
                          className="w-full mb-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-sky-300"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingDate(lead.id)}
                          className={`w-full mb-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5 transition-colors ${!lead.followUpDate
                            ? 'text-slate-300 hover:text-slate-500 hover:bg-slate-50 border border-dashed border-slate-200'
                            : lead.followUpDate < todayStr()
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : lead.followUpDate === todayStr()
                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                : 'bg-sky-50 text-sky-700 border border-sky-100'
                            }`}
                        >
                          <CalendarClock size={12} className="shrink-0" />
                          {lead.followUpDate || (t.set_followup || "Qo'ng'iroq sanasi")}
                        </button>
                      )}

                      {/* PIN — bosilsa nusxalanadi */}
                      {lead.testPin && lead.testStatus === 'PENDING' && (
                        <button
                          onClick={() => copyPin(lead.testPin!)}
                          className="w-full mb-2 bg-amber-50 hover:bg-amber-100 p-2 rounded-xl border border-amber-100 flex items-center justify-between transition-colors"
                        >
                          <span className="text-[9px] font-black text-amber-500 uppercase">PIN</span>
                          <span className="text-xs font-black text-amber-700 tracking-widest flex items-center gap-1.5">
                            {lead.testPin}
                            {copiedPin === lead.testPin ? <Check size={12} /> : <Copy size={12} />}
                          </span>
                        </button>
                      )}

                      {/* Test natijasi */}
                      {lead.testStatus === 'COMPLETED' && (
                        <button
                          onClick={() => setViewResult(lead)}
                          className="w-full mb-2 bg-success-bg text-success py-2 rounded-md text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:brightness-95 transition-all"
                        >
                          <Award size={13} /> {t.result}: {lead.testScore}%
                        </button>
                      )}

                      {/* Test tayinlash */}
                      {col.status === LeadStatus.NEW && !lead.testId && (
                        <button
                          onClick={() => setShowTestModal(lead)}
                          className="w-full mb-2 bg-slate-50 text-slate-600 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                        >
                          <ClipboardCheck size={13} /> {t.get_pin}
                        </button>
                      )}

                      {/* ASOSIY AMAL — keyingi bosqich nomi bilan.
                          Allaqachon o'quvchi bazasida bo'lsa, tugma o'rniga holat ko'rsatiladi:
                          aks holda qayta bosilib, ikkinchi o'quvchi yaratilib qolardi. */}
                      {converted ? (
                        <div className="w-full bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2">
                          <Check size={12} /> {t.already_student || "O'quvchi bazasida"}
                        </div>
                      ) : (
                        <button
                          onClick={() => moveForward(lead)}
                          className="w-full bg-primary text-white py-2 rounded-md text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-primary-hover transition-colors"
                        >
                          <span className="truncate">{nextLabel(lead.status)}</span>
                          <ArrowRight size={11} className="shrink-0" />
                        </button>
                      )}

                      {/* Ikkilamchi amallar: orqaga / rad etdi */}
                      <div className="flex gap-1.5 mt-1.5">
                        {colIdx > 0 && (
                          <button
                            onClick={() => moveBack(lead)}
                            title={t.move_back}
                            className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <ArrowLeft size={12} />
                          </button>
                        )}
                        {lead.history && lead.history.length > 0 && (
                          <button
                            onClick={() => setShowHistory(lead)}
                            title={t.history || 'Tarix'}
                            className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition-colors"
                          >
                            <History size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => onUpdateStatus(lead.id, LeadStatus.REJECTED)}
                          className="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          {t.reject_lead}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rad etganlar — yig'iladi, lekin yo'qolmaydi */}
      {rejectedLeads.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowRejected(v => !v)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">{t.rejected_list}</span>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">{rejectedLeads.length}</span>
            </div>
            {showRejected ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </button>

          {showRejected && (
            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {rejectedLeads.map(lead => (
                <div key={lead.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 opacity-70 hover:opacity-100 transition-opacity">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h5 className="font-black text-slate-600 text-sm truncate line-through">{lead.name}</h5>
                    <button onClick={() => setConfirmDelete(lead)} className="text-slate-300 hover:text-red-500 shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 mb-3">{lead.phone}</p>
                  <button
                    onClick={() => onUpdateStatus(lead.id, LeadStatus.NEW)}
                    className="w-full py-2 rounded-xl text-[9px] font-black uppercase text-slate-500 bg-white border border-slate-200 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft size={11} /> {t.lead_new}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lid tarixi — qachon qaysi bosqichga o'tgan */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="min-w-0">
                <h3 className="text-lg font-black text-slate-800 tracking-tight truncate">{showHistory.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{t.history || 'Tarix'}</p>
              </div>
              <button onClick={() => setShowHistory(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"><X size={20} /></button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[...(showHistory.history || [])].reverse().map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700">
                      {columns.find(c => c.status === h.from)?.label || h.from || '—'}
                      {' → '}
                      {columns.find(c => c.status === h.to)?.label || h.to}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {new Date(h.at).toLocaleString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* O'chirishdan oldin tasdiq — avval savat belgisi bir bosishda o'chirardi */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Trash2 size={28} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">{confirmDelete.name}</h3>
            <p className="text-xs font-bold text-slate-500 mb-1">{confirmDelete.phone}</p>
            <p className="text-[11px] font-bold text-slate-400 mb-6">
              {t.delete_lead_warning || "Lid butunlay o'chiriladi va qaytarib bo'lmaydi."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
                className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-colors"
              >
                {t.delete_lead || "O'chirish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN yaratildi — nusxalash mumkin (avval alert() ishlatilardi) */}
      {createdPin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Key size={30} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.pin_created}</p>
            <button
              onClick={() => copyPin(createdPin)}
              className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl py-6 mb-5 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group"
            >
              <p className="text-4xl font-black text-slate-800 tracking-[0.25em] mb-2">{createdPin}</p>
              <span className="text-[9px] font-black uppercase text-slate-400 group-hover:text-emerald-600 flex items-center justify-center gap-1.5 transition-colors">
                {copiedPin === createdPin
                  ? <><Check size={12} /> {t.copy_pin}</>
                  : <Copy size={12} />}
              </span>
            </button>
            <button
              onClick={() => setCreatedPin(null)}
              className="w-full py-2.5 bg-primary text-white rounded-field font-semibold text-[13.5px] hover:bg-primary-hover transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Test natijasi */}
      {viewResult && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Award size={30} />
            </div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-1">{viewResult.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5">{t.result}</p>
            <div className="bg-slate-50 p-7 rounded-2xl border border-slate-100 mb-6">
              <p className="text-5xl font-black text-emerald-600 tracking-tighter">{viewResult.testScore}%</p>
              <p className="text-[9px] font-black text-emerald-400 uppercase mt-2 tracking-widest">{t.score}</p>
            </div>
            <button
              onClick={() => setViewResult(null)}
              className="w-full py-2.5 bg-primary text-white rounded-field font-semibold text-[13.5px] hover:bg-primary-hover transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Test tayinlash */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-xl font-black tracking-tight text-slate-800">{t.tests}</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{showTestModal.name}</p>
              </div>
              <button onClick={() => setShowTestModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors shrink-0"><X size={22} /></button>
            </div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.tests}</label>
            <select
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all"
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
            >
              <option value="">{t.select}</option>
              {templates.map(tpl => (
                <option key={tpl.id} value={tpl.id}>{tpl.title} ({tpl.durationMinutes} m)</option>
              ))}
            </select>
            {templates.length === 0 && (
              <p className="text-[10px] font-bold text-amber-600 mt-3 ml-1">{t.no_data}</p>
            )}
            <div className="flex gap-3 pt-7">
              <button onClick={() => setShowTestModal(null)} className="flex-1 py-3.5 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">{t.cancel}</button>
              <button
                onClick={handleAssignTest}
                disabled={!selectedTemplateId}
                className="flex-1 py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 uppercase text-[10px] tracking-widest disabled:opacity-40 disabled:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <Key size={16} /> {t.create_pin}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yangi lid */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-100">
              <h3 className="text-xl font-black tracking-tight text-slate-800">{t.add_lead}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.main}</p>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t.student_name} />
                  <input required className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl outline-none font-bold focus:ring-2 transition-all ${duplicateWarning ? 'border-amber-300 focus:ring-amber-400/40' : 'border-slate-100 focus:ring-emerald-500/30'
                    }`} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder={t.phone} />
                  {/* Takroriy raqam — to'sib qo'ymaydi, faqat ogohlantiradi */}
                  {duplicateWarning && (
                    <p className="text-[10px] font-black text-amber-600 flex items-center gap-1.5 px-1">
                      <Info size={12} className="shrink-0" /> {duplicateWarning}
                    </p>
                  )}
                  {/* Manba — qaysi kanal ishlayotganini bilish uchun */}
                  <select
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all text-slate-600"
                    value={formData.source}
                    onChange={e => setFormData({ ...formData, source: e.target.value })}
                  >
                    <option value="">{t.source || 'Qayerdan keldi?'}</option>
                    {SOURCES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.parent}</p>
                  <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} placeholder={t.full_name} />
                  <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} placeholder={t.phone} />
                </div>
              </div>
              <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder={t.subject} />
              <textarea rows={2} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold resize-none focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} placeholder={t.note} />
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">{t.cancel}</button>
                <button type="submit" className="flex-1 py-3.5 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
