
import React, { useState, useEffect } from 'react';
import { SystemSettings, Student, TestTemplate, Question, UserRole } from '../types';
import { Building2, Bot, X, BookOpen, Download, CheckCircle2, Edit2, Trash2, Loader2, AlertCircle, ExternalLink, Sparkles, KeyRound } from 'lucide-react';
import { db } from '../services/supabase';
import { setTelegramWebhook, getTelegramBotInfo } from '../services/telegramService';

import { translations, Language } from '../services/languageContext';

interface SettingsProps {
  t: any;
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
  onRefresh?: () => void;
  userRole?: UserRole;
  students?: Student[];
  onUpdateStudent?: (id: string, data: Partial<Student>) => void;
  onDeleteTest?: (testId: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ t, settings, onSave, onRefresh, userRole, onDeleteTest }) => {
  const [pwOld, setPwOld] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleChangePassword = async () => {
    setPwBusy(true);
    const res = await db.changePassword(pwOld, pwNew);
    setPwBusy(false);
    if (res.ok) {
      setPwMsg({ ok: true, text: "✓ Parol o'zgartirildi" });
      setPwOld(''); setPwNew('');
    } else {
      setPwMsg({
        ok: false,
        text: res.error === 'wrong_password' ? "Eski parol noto'g'ri"
          : res.error === 'too_short' ? "Yangi parol kamida 6 ta belgi bo'lishi kerak"
            : "Xatolik yuz berdi",
      });
    }
  };

  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [templates, setTemplates] = useState<TestTemplate[]>([]);
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<TestTemplate>>({
    title: '',
    subject: t.subject,
    durationMinutes: 30,
    questions: []
  });

  // Bot status states
  const [botStatus, setBotStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [botUsername, setBotUsername] = useState<string>('');
  const [botError, setBotError] = useState<string>('');

  const optionLetters = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    loadTemplates();
  }, [settings.centerId]);

  const loadTemplates = async () => {
    try {
      const data = await db.get('test_templates');
      const filtered = data.filter((t: any) => t.centerId === settings.centerId);
      setTemplates(filtered);
    } catch (err) {
      console.error("Testlarni yuklashda xato:", err);
    }
  };

  const openEditModal = (test: TestTemplate) => {
    setEditingTestId(test.id);
    setNewTemplate({
      title: test.title,
      subject: test.subject,
      durationMinutes: test.durationMinutes,
      questions: [...test.questions]
    });
    setShowAddTestModal(true);
  };

  const exportToWord = (test: TestTemplate) => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Test</title><style>
        body { font-family: 'Times New Roman', serif; }
        .title { text-align: center; font-size: 18pt; font-weight: bold; }
        .info { margin-bottom: 20pt; }
        .question { margin-top: 15pt; font-weight: bold; }
        .option { margin-left: 20pt; }
      </style></head><body>`;

    let content = `<div class='title'>${test.title.toUpperCase()}</div>`;
    content += `<div class='info'><b>Fan:</b> ${test.subject}<br><b>Vaqt:</b> ${test.durationMinutes} minut</div>`;

    test.questions.forEach((q, i) => {
      content += `<div class='question'>${i + 1}. ${q.text}</div>`;
      q.options.forEach((opt, oi) => {
        content += `<div class='option'>${optionLetters[oi]}) ${opt}</div>`;
      });
    });

    const footer = `</body></html>`;
    const fullHtml = header + content + footer;

    const blob = new Blob(['\ufeff', fullHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${test.title}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.title || !newTemplate.questions?.length) {
      alert(t.search_empty);
      return;
    }

    if (editingTestId) {
      await db.update('test_templates', editingTestId, {
        title: newTemplate.title,
        subject: newTemplate.subject,
        durationMinutes: newTemplate.durationMinutes,
        questions: newTemplate.questions
      });
    } else {
      const template: TestTemplate = {
        id: "TEST_" + Math.random().toString(36).substr(2, 9),
        centerId: settings.centerId,
        title: newTemplate.title!,
        subject: newTemplate.subject || t.subject,
        durationMinutes: newTemplate.durationMinutes || 30,
        questions: newTemplate.questions as Question[]
      };
      await db.insert('test_templates', template);
    }

    await loadTemplates();
    if (onRefresh) onRefresh();
    setShowAddTestModal(false);
    setEditingTestId(null);
    setNewTemplate({ title: '', subject: t.subject, durationMinutes: 30, questions: [] });
  };

  const updateQuestionText = (qIdx: number, text: string) => {
    const qs = [...(newTemplate.questions || [])];
    qs[qIdx] = { ...qs[qIdx], text };
    setNewTemplate({ ...newTemplate, questions: qs });
  };

  const updateOptionText = (qIdx: number, oIdx: number, val: string) => {
    const qs = [...(newTemplate.questions || [])];
    const opts = [...qs[qIdx].options];
    opts[oIdx] = val;
    qs[qIdx] = { ...qs[qIdx], options: opts };
    setNewTemplate({ ...newTemplate, questions: qs });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-32">
      {/* O'z parolini o'zgartirish — har qanday rol uchun.
          Parol bazada hash bo'lib saqlanadi, shuning uchun eski parolni
          bilish shart va uni hech kim "ko'ra" olmaydi. */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-amber-500 p-3.5 rounded-2xl shadow-lg"><KeyRound className="text-white" size={20} /></div>
          <h3 className="text-xl font-black text-slate-800 uppercase italic">{t.change_password || "Parolni o'zgartirish"}</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="password" value={pwOld} onChange={e => { setPwOld(e.target.value); setPwMsg(null); }}
            placeholder={t.old_password || 'Eski parol'}
            className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-amber-400/40" />
          <input type="password" value={pwNew} onChange={e => { setPwNew(e.target.value); setPwMsg(null); }}
            placeholder={t.new_password || 'Yangi parol'}
            className="px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-amber-400/40" />
          <button onClick={handleChangePassword} disabled={pwBusy || pwOld.length < 1 || pwNew.length < 6}
            className="px-6 py-3.5 bg-amber-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-amber-700 transition-colors disabled:opacity-40">
            {pwBusy ? '...' : (t.save || 'Saqlash')}
          </button>
        </div>
        {pwMsg && (
          <p className={`text-[11px] font-black mt-3 px-1 ${pwMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
            {pwMsg.text}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {userRole === UserRole.DIRECTOR && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="bg-indigo-600 p-4 rounded-3xl shadow-lg"><Building2 className="text-white" size={24} /></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">{t.settings}</h3>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();

              // Save settings first
              onSave(formData);

              // If bot token exists, setup webhook
              if (formData.botToken) {
                setBotStatus('checking');
                setBotError('');

                // Get bot info
                const botInfo = await getTelegramBotInfo(formData.botToken);
                if (botInfo.success && botInfo.username) {
                  setBotUsername(botInfo.username);

                  // Setup webhook
                  const webhookResult = await setTelegramWebhook(formData.botToken);
                  if (webhookResult.success) {
                    setBotStatus('success');
                  } else {
                    setBotStatus('error');
                    setBotError(webhookResult.error || 'Webhook xatosi');
                  }
                } else {
                  setBotStatus('error');
                  setBotError(botInfo.error || 'Bot topilmadi');
                }
              }

              alert(t.save);
            }} className="space-y-6">
              <input className="w-full px-6 py-4 bg-slate-50 border rounded-2xl font-bold" value={formData.centerName} onChange={e => setFormData({ ...formData, centerName: e.target.value })} placeholder={t.center_name} />

              {/* Telegram Bot Section */}
              <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Telegram Bot</span>
                  </div>
                  {botStatus === 'checking' && <Loader2 size={16} className="animate-spin text-indigo-400" />}
                  {botStatus === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                  {botStatus === 'error' && <AlertCircle size={16} className="text-red-400" />}
                </div>

                <input
                  className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs outline-none"
                  value={formData.botToken}
                  onChange={e => setFormData({ ...formData, botToken: e.target.value })}
                  placeholder="Bot tokenini kiriting (@BotFather dan oling)"
                />

                {botStatus === 'error' && botError && (
                  <p className="text-red-400 text-xs">❌ {botError}</p>
                )}

                {botStatus === 'success' && botUsername && (
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                    <p className="text-emerald-400 text-xs font-bold">✅ Bot ulandi!</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/70">Bot:</span>
                      <a
                        href={`https://t.me/${botUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 font-bold text-sm flex items-center gap-1 hover:underline"
                      >
                        @{botUsername} <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <p className="text-[10px] text-white/50 uppercase font-bold mb-2">Ota-onalar uchun yo'riqnoma:</p>
                      <p className="text-xs text-white/80">1. <a href={`https://t.me/${botUsername}`} target="_blank" className="text-indigo-400">@{botUsername}</a> botini oching</p>
                      <p className="text-xs text-white/80">2. /start buyrug'ini yuboring</p>
                      <p className="text-xs text-white/80">3. O'quvchi kodini kiriting (masalan: EDU-4CQ5)</p>
                    </div>
                  </div>
                )}

                {!formData.botToken && (
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-[10px] text-white/50 uppercase font-bold mb-2">Bot yaratish:</p>
                    <p className="text-xs text-white/70">1. Telegramda <a href="https://t.me/BotFather" target="_blank" className="text-indigo-400">@BotFather</a> ga yozing</p>
                    <p className="text-xs text-white/70">2. /newbot buyrug'ini yuboring</p>
                    <p className="text-xs text-white/70">3. Bot nomini kiriting</p>
                    <p className="text-xs text-white/70">4. Olingan tokenni shu yerga qo'ying</p>
                  </div>
                )}

                {/* AI Integration Section */}
                <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Integration (Gemini)</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-white/50 uppercase font-bold">Custom API Key (Optional)</p>
                    <input
                      type="password"
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-indigo-500 transition-colors"
                      value={formData.geminiApiKey || ''}
                      onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                      placeholder="AI_... (Bo'sh qoldirsangiz, tizimning umumiy kaliti ishlatiladi)"
                    />
                    <p className="text-[9px] text-white/40">Faqat o'zingizning shaxsiy limiti ishlatmoqchi bo'lsangiz to'ldiring. Aks holda bo'sh qoldiring.</p>
                  </div>
                </div>

                {/* Direktor Telegram Hisobot */}
                <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] text-white space-y-4">
                  <div className="flex items-center gap-2">
                    <Bot size={18} className="text-blue-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Kunlik Hisobot (Telegram)</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] text-white/70 uppercase font-bold">Direktor Telegram Chat ID</p>
                    <input
                      className="w-full bg-white/10 border border-white/20 p-3 rounded-xl text-xs outline-none focus:border-white/50 transition-colors placeholder-white/30"
                      value={formData.reportChatId || ''}
                      onChange={e => setFormData({ ...formData, reportChatId: e.target.value })}
                      placeholder="Masalan: 123456789"
                    />
                    <div className="bg-white/10 rounded-xl p-3 space-y-1">
                      <p className="text-[10px] text-white/70 font-bold">Chat ID olish uchun:</p>
                      <p className="text-[10px] text-white/60">1. Botingizga Telegramda /start yuboring</p>
                      <p className="text-[10px] text-white/60">2. <a href="https://t.me/userinfobot" target="_blank" className="text-blue-200 underline">@userinfobot</a> ga /start yuboring</p>
                      <p className="text-[10px] text-white/60">3. Ko'rsatilgan ID ni shu yerga yozing</p>
                    </div>
                    <p className="text-[9px] text-white/50">Har kuni kechqurun kunlik hisobot va test natijalari shu chatga yuboriladi.</p>
                  </div>
                </div>

              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl">{t.save}</button>
            </form>
          </div>
        )}

        <div className={`bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl ${userRole !== UserRole.DIRECTOR ? 'lg:col-span-2' : ''}`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-amber-500 p-4 rounded-3xl shadow-lg"><BookOpen className="text-white" size={24} /></div>
              <h3 className="text-2xl font-black text-slate-800 uppercase italic">{t.tests}</h3>
            </div>
            <button
              onClick={() => { setEditingTestId(null); setNewTemplate({ title: '', subject: t.subject, durationMinutes: 30, questions: [] }); setShowAddTestModal(true); }}
              className="px-6 py-3 bg-amber-50 text-amber-600 rounded-2xl hover:bg-amber-500 hover:text-white transition-all font-black uppercase text-[10px] tracking-widest"
            >
              + {t.add_test}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(test => (
              <div key={test.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between hover:shadow-lg transition-all relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => openEditModal(test)}
                    className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  {onDeleteTest && (
                    <button
                      onClick={async () => {
                        if (window.confirm(t.delete_confirm)) {
                          await onDeleteTest(test.id);
                          loadTemplates();
                        }
                      }}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div>
                  <p className="font-black text-slate-800 text-sm uppercase mb-1">{test.title}</p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{test.subject} • {test.questions.length}</p>
                </div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => exportToWord(test)}
                    className="w-full bg-white border border-slate-200 p-3 rounded-2xl hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase"
                  >
                    <Download size={14} /> Doc
                  </button>
                </div>
              </div>
            ))}
            {templates.length === 0 && <p className="col-span-2 text-center text-slate-400 py-10 font-bold italic">{t.search_empty}</p>}
          </div>
        </div>
      </div>

      {showAddTestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-amber-500 p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                {editingTestId ? (t.save) : t.add_test}
              </h3>
              <button onClick={() => setShowAddTestModal(false)}><X size={24} /></button>
            </div>
            <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={newTemplate.title} onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })} placeholder={t.main} />
                <input className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} placeholder={t.subject} />
                <input type="number" className="w-full px-5 py-4 bg-slate-50 border rounded-2xl font-bold outline-none" value={newTemplate.durationMinutes} onChange={e => setNewTemplate({ ...newTemplate, durationMinutes: Number(e.target.value) })} placeholder={t.minute} />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h4 className="font-black text-slate-800 uppercase text-xs">{t.question} ({newTemplate.questions?.length || 0})</h4>
                  <button onClick={() => setNewTemplate(p => ({ ...p, questions: [...(p.questions || []), { id: Math.random().toString(), text: '', options: ['', '', '', ''], correctAnswer: 0 }] }))} className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase text-nowrap">+ {t.question}</button>
                </div>
                {newTemplate.questions?.map((q, qIdx) => (
                  <div key={q.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4">
                    <div className="flex justify-between">
                      <span className="font-black text-[10px] uppercase text-indigo-500">{t.question} {qIdx + 1}</span>
                      <button type="button" onClick={() => {
                        const qs = [...newTemplate.questions!];
                        qs.splice(qIdx, 1);
                        setNewTemplate({ ...newTemplate, questions: qs });
                      }} className="text-red-400"><X size={16} /></button>
                    </div>
                    <textarea className="w-full p-4 rounded-xl border bg-white font-bold text-sm outline-none" value={q.text} onChange={e => updateQuestionText(qIdx, e.target.value)} placeholder="..." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((opt, i) => (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${q.correctAnswer === i ? 'bg-emerald-50 border-emerald-500' : 'bg-white'}`}>
                          <button type="button" onClick={() => {
                            const qs = [...newTemplate.questions!];
                            qs[qIdx].correctAnswer = i;
                            setNewTemplate({ ...newTemplate, questions: qs });
                          }} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${q.correctAnswer === i ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                            {q.correctAnswer === i && <CheckCircle2 size={14} />}
                          </button>
                          <span className="font-black text-[12px] text-slate-400">{optionLetters[i]}</span>
                          <input
                            className="w-full bg-transparent outline-none font-bold text-xs"
                            value={opt}
                            onChange={e => updateOptionText(qIdx, i, e.target.value)}
                            placeholder={t.variant}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex gap-4">
              <button type="button" onClick={() => setShowAddTestModal(false)} className="flex-1 font-black uppercase text-xs text-slate-400">{t.cancel}</button>
              <button type="button" onClick={handleSaveTemplate} className="flex-1 bg-amber-500 text-white font-black py-4 rounded-2xl uppercase text-xs shadow-xl">
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
