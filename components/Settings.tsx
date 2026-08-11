
import React, { useState, useEffect } from 'react';
import { SystemSettings, Student, TestTemplate, Question, UserRole } from '../types';
import { Building2, Bot, X, BookOpen, Download, CheckCircle2, Edit2, Trash2, Loader2, AlertCircle, ExternalLink, Sparkles, KeyRound, Plus } from 'lucide-react';
import { PageHeader, Card, CardHeader, Button, Field, Input, StatusBadge, EmptyState } from './ui';
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
    <div className="animate-in fade-in duration-300">
      <PageHeader title={t.system_settings} subtitle={t.settings_hint || "Markaz ma'lumotlari, Telegram bot va xabarnomalar."} />

      {/* Parolni o'zgartirish — parol bazada hash, uni hech kim "ko'ra" olmaydi */}
      <Card className="mb-5">
        <CardHeader title={t.change_password || "Parolni o'zgartirish"} subtitle={t.change_password_hint || "Eski parolni bilish shart."} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <Field label={t.old_password || 'Eski parol'}>
            <Input type="password" value={pwOld} onChange={e => { setPwOld(e.target.value); setPwMsg(null); }} />
          </Field>
          <Field label={t.new_password || 'Yangi parol'}>
            <Input type="password" value={pwNew} onChange={e => { setPwNew(e.target.value); setPwMsg(null); }} />
          </Field>
          <Button onClick={handleChangePassword} disabled={pwBusy || pwOld.length < 1 || pwNew.length < 6}>
            {pwBusy ? '...' : (t.save || 'Saqlash')}
          </Button>
        </div>
        {pwMsg && (
          <p className={`text-[13px] font-medium mt-3 ${pwMsg.ok ? 'text-success' : 'text-danger'}`}>{pwMsg.text}</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {userRole === UserRole.DIRECTOR && (
          <div className="space-y-5">
            <form onSubmit={async (e) => {
              e.preventDefault();
              let toSave = formData;

              if (formData.botToken) {
                setBotStatus('checking');
                setBotError('');
                const botInfo = await getTelegramBotInfo(formData.botToken);
                if (botInfo.success && botInfo.username) {
                  setBotUsername(botInfo.username);
                  // Username ham saqlanadi — ota-onaga beriladigan ulanish
                  // havolasi (t.me/<username>?start=KOD) shundan yasaladi
                  toSave = { ...formData, botUsername: botInfo.username };
                  const webhookResult = await setTelegramWebhook(formData.botToken);
                  if (webhookResult.success) setBotStatus('success');
                  else { setBotStatus('error'); setBotError(webhookResult.error || 'Webhook xatosi'); }
                } else {
                  setBotStatus('error');
                  setBotError(botInfo.error || 'Bot topilmadi');
                }
              }

              // Bot tekshiruvi qanday tugashidan qat'i nazar sozlamalar saqlanadi
              onSave(toSave);
              alert(t.save);
            }} className="space-y-5">

              {/* Markaz */}
              <Card>
                <CardHeader title={t.settings} />
                <Field label={t.center_name}>
                  <Input value={formData.centerName} onChange={e => setFormData({ ...formData, centerName: e.target.value })} placeholder={t.center_name} />
                </Field>
              </Card>

              {/* Telegram bot */}
              <Card>
                <CardHeader
                  title="Telegram bot"
                  subtitle={t.bot_hint || "Ota-onalarga davomat va to'lov xabarlari shu bot orqali boradi."}
                  actions={
                    botStatus === 'checking' ? <Loader2 size={16} className="animate-spin text-primary" />
                      : botStatus === 'success' ? <StatusBadge label={t.tg_connected || 'Ulangan'} tone="success" />
                        : botStatus === 'error' ? <StatusBadge label={t.error || 'Xato'} tone="danger" /> : null
                  }
                />
                <Field label={t.bot_token || 'Bot tokeni'}>
                  <Input
                    value={formData.botToken}
                    onChange={e => setFormData({ ...formData, botToken: e.target.value })}
                    placeholder="123456:ABC-DEF… (@BotFather)"
                  />
                </Field>

                {botStatus === 'error' && botError && (
                  <p className="text-[13px] text-danger mt-2">{botError}</p>
                )}

                {botStatus === 'success' && botUsername && (
                  <div className="mt-3 p-3 rounded-md bg-success-bg">
                    <a href={`https://t.me/${botUsername}`} target="_blank" rel="noreferrer"
                      className="text-[13.5px] font-semibold text-success inline-flex items-center gap-1.5">
                      @{botUsername} <ExternalLink size={13} />
                    </a>
                    <p className="text-[12.5px] text-ink-2 mt-2 leading-5">
                      {t.parent_instruction || "Ota-ona: botni ochadi → /start → o'quvchi kodini yozadi."}
                    </p>
                  </div>
                )}

                {!formData.botToken && (
                  <div className="mt-3 p-3 rounded-md bg-canvas border border-line">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-muted mb-1.5">
                      {t.create_bot || 'Bot yaratish'}
                    </p>
                    <ol className="text-[12.5px] text-ink-2 leading-5 list-decimal list-inside space-y-0.5">
                      <li>Telegramda <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-primary">@BotFather</a> ga yozing</li>
                      <li><code className="bg-white px-1 rounded border border-line">/newbot</code> buyrug'ini yuboring</li>
                      <li>Bot nomini kiriting</li>
                      <li>Olingan tokenni shu yerga qo'ying</li>
                    </ol>
                  </div>
                )}
              </Card>

              {/* Kunlik hisobot */}
              <Card>
                <CardHeader title={t.daily_report || 'Kunlik hisobot'} subtitle={t.daily_report_hint || "Har kuni kechqurun direktorga Telegram orqali yuboriladi."} />
                <Field label={t.chat_id || 'Telegram Chat ID'} hint={t.chat_id_hint || "@userinfobot ga /start yozsangiz ID'ingizni aytadi."}>
                  <Input
                    value={formData.reportChatId || ''}
                    onChange={e => setFormData({ ...formData, reportChatId: e.target.value })}
                    placeholder="123456789"
                  />
                </Field>
              </Card>

              {/* AI */}
              <Card>
                <CardHeader title="AI (Gemini)" subtitle={t.ai_key_hint || "Bo'sh qoldirsangiz tizimning umumiy kaliti ishlatiladi."} />
                <Field label={t.api_key || 'API kalit'}>
                  <Input
                    type="password"
                    value={formData.geminiApiKey || ''}
                    onChange={e => setFormData({ ...formData, geminiApiKey: e.target.value })}
                    placeholder="AI_…"
                  />
                </Field>
              </Card>

              <Button type="submit" className="w-full">{t.save}</Button>
            </form>
          </div>
        )}

        {/* Testlar (eski so'rovnoma tizimi) */}
        <div className={userRole !== UserRole.DIRECTOR ? 'lg:col-span-2' : ''}>
          <Card padded={false}>
            <div className="p-5">
              <CardHeader
                title={t.tests}
                subtitle={`${templates.length}`}
                actions={
                  <Button variant="secondary" size="sm"
                    onClick={() => { setEditingTestId(null); setNewTemplate({ title: '', subject: t.subject, durationMinutes: 30, questions: [] }); setShowAddTestModal(true); }}>
                    <Plus size={14} /> {t.add_test}
                  </Button>
                }
              />
              {templates.length === 0 ? (
                <EmptyState icon={<BookOpen size={22} />} title={t.search_empty} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {templates.map(test => (
                    <div key={test.id} className="border border-line rounded-md p-3.5 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-ink truncate">{test.title}</p>
                          <p className="text-[12px] text-muted">{test.subject} · {test.questions.length}</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEditModal(test)} title={t.edit_staff}
                            className="p-1.5 text-muted hover:text-primary hover:bg-primary-subtle rounded-md transition-colors">
                            <Edit2 size={15} />
                          </button>
                          {onDeleteTest && (
                            <button
                              onClick={async () => {
                                if (window.confirm(t.delete_confirm)) { await onDeleteTest(test.id); loadTemplates(); }
                              }}
                              title={t.delete_action || "O'chirish"}
                              className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors">
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                      <Button variant="secondary" size="sm" className="w-full mt-3" onClick={() => exportToWord(test)}>
                        <Download size={13} /> Doc
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>


      {showAddTestModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-lg shadow-e1 overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="bg-amber-500 p-8 text-white flex justify-between items-center">
              <h3 className="text-2xl font-semibold uppercase tracking-tight">
                {editingTestId ? (t.save) : t.add_test}
              </h3>
              <button onClick={() => setShowAddTestModal(false)}><X size={24} /></button>
            </div>
            <div className="p-10 overflow-y-auto custom-scrollbar space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input className="w-full px-5 py-4 bg-slate-50 border rounded-md font-bold outline-none" value={newTemplate.title} onChange={e => setNewTemplate({ ...newTemplate, title: e.target.value })} placeholder={t.main} />
                <input className="w-full px-5 py-4 bg-slate-50 border rounded-md font-bold outline-none" value={newTemplate.subject} onChange={e => setNewTemplate({ ...newTemplate, subject: e.target.value })} placeholder={t.subject} />
                <input type="number" className="w-full px-5 py-4 bg-slate-50 border rounded-md font-bold outline-none" value={newTemplate.durationMinutes} onChange={e => setNewTemplate({ ...newTemplate, durationMinutes: Number(e.target.value) })} placeholder={t.minute} />
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                  <h4 className="font-semibold text-ink uppercase text-xs">{t.question} ({newTemplate.questions?.length || 0})</h4>
                  <button onClick={() => setNewTemplate(p => ({ ...p, questions: [...(p.questions || []), { id: Math.random().toString(), text: '', options: ['', '', '', ''], correctAnswer: 0 }] }))} className="bg-primary text-white px-5 py-2 rounded-xl text-[10px] font-semibold uppercase text-nowrap">+ {t.question}</button>
                </div>
                {newTemplate.questions?.map((q, qIdx) => (
                  <div key={q.id} className="p-6 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-[10px] uppercase text-indigo-500">{t.question} {qIdx + 1}</span>
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
                          <span className="font-semibold text-[12px] text-muted">{optionLetters[i]}</span>
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
              <button type="button" onClick={() => setShowAddTestModal(false)} className="flex-1 font-semibold uppercase text-xs text-muted">{t.cancel}</button>
              <button type="button" onClick={handleSaveTemplate} className="flex-1 bg-amber-500 text-white font-semibold py-4 rounded-md uppercase text-xs shadow-e1">
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
