
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus, TestTemplate } from '../types';
import { Plus, Trash2, X, Search, ArrowRight, Phone, ClipboardCheck, Send, Clock, Key, Eye, Award } from 'lucide-react';
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

const Leads: React.FC<LeadsProps> = ({ t, leads, centerId, onAdd, onUpdateStatus, onDelete, onRegister, onUpdateLead }) => {
  const [showModal, setShowModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState<Lead | null>(null);
  const [viewResult, setViewResult] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    subject: '',
    note: ''
  });

  useEffect(() => {
    db.get('test_templates').then(data => {
      if (Array.isArray(data)) {
        // Faqat joriy markazning testlarini filtrlash
        const filtered = data.filter(t => t.centerId === centerId);
        setTemplates(filtered);
      }
    }).catch(err => console.error("Templates error:", err));
  }, [centerId]);

  const columns: { status: LeadStatus; label: string; bg: string }[] = [
    { status: LeadStatus.NEW, label: t.lead_new, bg: 'bg-blue-600' },
    { status: LeadStatus.CONTACTED, label: t.lead_contacted, bg: 'bg-amber-500' },
    { status: LeadStatus.TRIAL, label: t.lead_trial, bg: 'bg-purple-600' },
    { status: LeadStatus.REGISTERED, label: t.lead_success, bg: 'bg-emerald-600' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData, status: LeadStatus.NEW, createdAt: new Date().toISOString() });
    setShowModal(false);
    setFormData({ name: '', phone: '', parentName: '', parentPhone: '', subject: '', note: '' });
  };

  const handleAssignTest = async () => {
    if (!showTestModal || !selectedTemplateId) return;
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      await db.update('leads', showTestModal.id, {
        testId: selectedTemplateId,
        testStatus: 'PENDING',
        testPin: pin,
        testScore: undefined // Oldingi natijani tozalash
      });
      alert(`${t.pin_created}: ${pin}`);
      setShowTestModal(null);
      onUpdateStatus(showTestModal.id, showTestModal.status);
    } catch (err) {
      console.error(err);
      alert(t.error_creating_pin);
    }
  };

  const safeLeads = Array.isArray(leads) ? leads : [];
  const filtered = safeLeads.filter(l => l.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="relative w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl outline-none font-bold text-sm" placeholder={t.search} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all">
          <Plus size={18} /> {t.add_lead}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {columns.map(col => (
          <div key={col.status} className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${col.bg}`}></div>
                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{col.label}</h4>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                {filtered.filter(l => l.status === col.status).length}
              </span>
            </div>
            <div className="bg-slate-100/50 rounded-[2.5rem] p-4 min-h-[500px] border border-dashed border-slate-200 flex flex-col gap-4">
              {filtered.filter(l => l.status === col.status).map(lead => (
                <div key={lead.id} className="bg-white p-5 rounded-3xl shadow-sm border border-transparent hover:border-indigo-100 transition-all group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <h5 className="font-black text-slate-800 text-sm tracking-tighter">{lead.name}</h5>
                    <button onClick={() => onDelete(lead.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
                  </div>

                  {lead.testPin && lead.testStatus === 'PENDING' && (
                    <div className="mb-3 bg-amber-50 p-2 rounded-xl border border-amber-100 flex items-center justify-between">
                      <span className="text-[9px] font-black text-amber-500 uppercase">PIN:</span>
                      <span className="text-xs font-black text-amber-700 tracking-widest">{lead.testPin}</span>
                    </div>
                  )}

                  <div className="text-[10px] font-bold text-slate-500 mb-4 flex items-center gap-2">
                    <Phone size={10} /> {lead.phone}
                  </div>

                  <div className="flex flex-col gap-2">
                    {lead.testStatus === 'COMPLETED' && (
                      <button
                        onClick={() => setViewResult(lead)}
                        className="w-full bg-emerald-50 text-emerald-600 py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 mb-1"
                      >
                        <Award size={14} /> {t.result}: {lead.testScore}%
                      </button>
                    )}

                    {col.status === LeadStatus.NEW && !lead.testId && (
                      <button
                        onClick={() => setShowTestModal(lead)}
                        className="w-full bg-amber-50 text-amber-600 py-2 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 hover:bg-amber-600 hover:text-white transition-all border border-amber-100"
                      >
                        <ClipboardCheck size={14} /> {t.get_pin}
                      </button>
                    )}

                    <button onClick={() => {
                      const next = [LeadStatus.NEW, LeadStatus.CONTACTED, LeadStatus.TRIAL, LeadStatus.REGISTERED];
                      const idx = next.indexOf(col.status);
                      if (idx < 3) onUpdateStatus(lead.id, next[idx + 1]);
                      else onRegister(lead);
                    }} className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all hover:bg-indigo-600 shadow-sm">
                      {t.status.toUpperCase()} <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {viewResult && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-sm rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-2">{viewResult.name}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">{t.result}</p>
            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
              <p className="text-5xl font-black text-emerald-600 italic tracking-tighter">{viewResult.testScore}%</p>
              <p className="text-[10px] font-black text-emerald-400 uppercase mt-2">{t.score}</p>
            </div>
            <button onClick={() => setViewResult(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest">{t.cancel}</button>
          </div>
        </div>
      )}


      {showTestModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-md rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">{t.tests}</h3>
              <button onClick={() => setShowTestModal(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{t.tests}</label>
                <select
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                >
                  <option value="">{t.select}</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.title} ({t.durationMinutes} m)</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowTestModal(null)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">{t.cancel}</button>
                <button
                  onClick={handleAssignTest}
                  disabled={!selectedTemplateId}
                  className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 uppercase text-[10px] tracking-widest disabled:opacity-50"
                >
                  <Key size={18} className="inline mr-2" /> {t.create_pin}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase text-slate-800">{t.add_lead}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.main}</p>
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t.student_name} />
                  <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder={t.phone} />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">{t.parent}</p>
                  <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.parentName} onChange={e => setFormData({ ...formData, parentName: e.target.value })} placeholder={t.full_name} />
                  <input className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.parentPhone} onChange={e => setFormData({ ...formData, parentPhone: e.target.value })} placeholder={t.phone} />
                </div>
              </div>
              <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} placeholder={t.subject} />
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black text-slate-400 uppercase text-[10px]">{t.cancel}</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 uppercase text-[10px]">{t.save}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
