
import React, { useState, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, TestTemplate } from '../types';
import {
  Plus, Trash2, X, Search, ArrowRight, ArrowLeft, Phone, ClipboardCheck,
  Key, Award, Copy, Check, ChevronDown, ChevronUp, UserPlus, Info, TrendingUp
} from 'lucide-react';
import { db } from '../services/supabase';

interface LeadsProps {
  t: any;
  leads: Lead[];
  centerId: string; // Markaz ID - testlarni filtrlash uchun
  onAdd: (lead: Omit<Lead, 'id' | 'centerId'>) => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
  onRegister: (lead: Lead) => void;
  onUpdateLead?: (id: string, data: Partial<Lead>) => void;
}

/** Voronka bosqichlari — tartib muhim, oldinga/orqaga siljish shu bo'yicha */
const FLOW = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.TRIAL, LeadStatus.REGISTERED];

const Leads: React.FC<LeadsProps> = ({ t, leads, centerId, onAdd, onUpdateStatus, onDelete, onRegister, onUpdateLead }) => {
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState<Lead | null>(null);
  const [viewResult, setViewResult] = useState<Lead | null>(null);
  const [createdPin, setCreatedPin] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [showRejected, setShowRejected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [formData, setFormData] = useState({
    name: '', phone: '', parentName: '', parentPhone: '', subject: '', note: ''
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
    setFormData({ name: '', phone: '', parentName: '', parentPhone: '', subject: '', note: '' });
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

  const moveForward = (lead: Lead) => {
    const idx = FLOW.indexOf(lead.status);
    if (idx >= 0 && idx < FLOW.length - 1) onUpdateStatus(lead.id, FLOW[idx + 1]);
    else onRegister(lead);
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
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Info size={18} className="text-emerald-600 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-emerald-900 leading-relaxed">{t.funnel_hint}</p>
      </div>

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
          className="bg-emerald-600 text-white px-7 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all"
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

              <div className="bg-slate-50 rounded-3xl p-3 min-h-[400px] border border-slate-100 flex flex-col gap-3">
                {items.length === 0 && (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-[10px] font-bold text-slate-300 text-center px-4">{t.no_leads_here}</p>
                  </div>
                )}

                {items.map(lead => {
                  const age = ageOf(lead);
                  const stale = age !== null && age >= 7 && col.status !== LeadStatus.REGISTERED;
                  return (
                    <div key={lead.id} className={`bg-white p-4 rounded-2xl border border-slate-100 hover:ring-2 ${col.hover} hover:border-transparent transition-all group`}>

                      {/* Ism + fan */}
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="min-w-0">
                          <h5 className="font-black text-slate-800 text-sm truncate">{lead.name}</h5>
                          {lead.subject && (
                            <span className="inline-block mt-1 text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md uppercase">
                              {lead.subject}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onDelete(lead.id)}
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
                        <p className={`text-[9px] font-black uppercase tracking-wide mb-3 ${stale ? 'text-red-500' : 'text-slate-300'}`}>
                          {age === 0 ? t.today_label : `${age} ${t.days_ago}`}
                        </p>
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
                          className="w-full mb-2 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100"
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

                      {/* ASOSIY AMAL — keyingi bosqich nomi bilan */}
                      <button
                        onClick={() => moveForward(lead)}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
                      >
                        <span className="truncate">{nextLabel(lead.status)}</span>
                        <ArrowRight size={11} className="shrink-0" />
                      </button>

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
                    <button onClick={() => onDelete(lead.id)} className="text-slate-300 hover:text-red-500 shrink-0">
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

      {/* PIN yaratildi — nusxalash mumkin (avval alert() ishlatilardi) */}
      {createdPin && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in duration-300">
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
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Test natijasi */}
      {viewResult && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in duration-300">
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
              className="w-full py-3.5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition-colors"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Test tayinlash */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300">
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
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-100">
              <h3 className="text-xl font-black tracking-tight text-slate-800">{t.add_lead}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={22} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.main}</p>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t.student_name} />
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-emerald-500/30 transition-all" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder={t.phone} />
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
