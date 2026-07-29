import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Headphones, PenTool, Mic, Plus, Trash2, Edit3, Copy, Eye, Upload, Download, Search, Filter, X, ChevronDown, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { IELTSExamType, IELTSReadingQuestion, IELTSListeningQuestion, IELTSWritingTask, IELTSSpeakingQuestion } from '../../types';
import { db } from '../../services/supabase';
import ReadingQuestionBuilder from './ReadingQuestionBuilder';
import ListeningQuestionBuilder from './ListeningQuestionBuilder';
import WritingTaskBuilder from './WritingTaskBuilder';
import SpeakingQuestionBuilder from './SpeakingQuestionBuilder';

interface IELTSAdminProps {
    t: any;
    centerId: string;
    userRole: string;
    testId?: string | null;
}

type AdminTab = 'reading' | 'listening' | 'writing' | 'speaking';
type ModalMode = 'create' | 'edit' | 'preview' | null;

const TABS = [
    { key: 'reading' as const, icon: BookOpen, label: 'Reading', color: 'blue' },
    { key: 'listening' as const, icon: Headphones, label: 'Listening', color: 'purple' },
    { key: 'writing' as const, icon: PenTool, label: 'Writing', color: 'emerald' },
    { key: 'speaking' as const, icon: Mic, label: 'Speaking', color: 'amber' },
];

const IELTSAdmin: React.FC<IELTSAdminProps> = ({ t, centerId, userRole, testId }) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('reading');
    const [examTypeFilter, setExamTypeFilter] = useState<IELTSExamType>(IELTSExamType.ACADEMIC);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Data
    const [readingQuestions, setReadingQuestions] = useState<any[]>([]);
    const [listeningQuestions, setListeningQuestions] = useState<any[]>([]);
    const [writingTasks, setWritingTasks] = useState<any[]>([]);
    const [speakingQuestions, setSpeakingQuestions] = useState<any[]>([]);

    const isReadOnly = userRole === 'teacher';

    // Database mapping helpers
    const toCamelCase = (item: any) => {
        if (!item) return item;
        // DIQQAT: jadvallarda ustunlar aralash (asosan camelCase, faqat test_id snake_case).
        // ?? bo'lmasa, mavjud camelCase qiymat undefined bilan o'chib ketadi.
        return {
            ...item,
            centerId: item.center_id ?? item.centerId,
            testId: item.test_id ?? item.testId,
            examType: item.exam_type ?? item.examType,
            // Reading
            passageNumber: item.passage_number ?? item.passageNumber,
            passageTitle: item.passage_title ?? item.passageTitle,
            passageText: item.passage_text ?? item.passageText,
            questionNumber: item.question_number ?? item.questionNumber,
            questionType: item.question_type ?? item.questionType,
            questionText: item.question_text ?? item.questionText,
            correctAnswer: item.correct_answer ?? item.correctAnswer,
            // Listening
            sectionNumber: item.section_number ?? item.sectionNumber,
            sectionTitle: item.section_title ?? item.sectionTitle,
            audioUrl: item.audio_url ?? item.audioUrl,
            // Writing
            taskNumber: item.task_number ?? item.taskNumber,
            taskPrompt: item.task_prompt ?? item.taskPrompt,
            wordLimitMin: item.word_limit_min ?? item.wordLimitMin,
            timeMinutes: item.time_minutes ?? item.timeMinutes,
            // Speaking
            partNumber: item.part_number ?? item.partNumber,
            cueCardTopic: item.cue_card_topic ?? item.cueCardTopic,
            cueCardPoints: item.cue_card_points ?? item.cueCardPoints,
            preparationTime: item.preparation_time ?? item.preparationTime,
            speakingTime: item.speaking_time ?? item.speakingTime
        };
    };

    const toSnakeCase = (item: any) => {
        const { id, ...rest } = item;
        return {
            id,
            center_id: rest.centerId,
            test_id: rest.testId,
            exam_type: rest.examType,
            // Reading
            passage_number: rest.passageNumber,
            passage_title: rest.passageTitle,
            passage_text: rest.passageText,
            question_number: rest.questionNumber,
            question_type: rest.questionType,
            question_text: rest.questionText,
            correct_answer: rest.correctAnswer,
            options: rest.options,
            points: rest.points,
            // Listening
            section_number: rest.sectionNumber,
            section_title: rest.sectionTitle,
            audio_url: rest.audioUrl,
            // Writing
            task_number: rest.taskNumber,
            task_prompt: rest.taskPrompt,
            word_limit_min: rest.wordLimitMin,
            time_minutes: rest.timeMinutes,
            // Speaking
            part_number: rest.partNumber,
            cue_card_topic: rest.cueCardTopic,
            cue_card_points: rest.cueCardPoints,
            preparation_time: rest.preparationTime,
            speaking_time: rest.speakingTime
        };
    };

    useEffect(() => { loadAll(); }, [centerId, testId]);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [r, l, w, s] = await Promise.all([
                db.get('ielts_reading_questions'),
                db.get('ielts_listening_questions'),
                db.get('ielts_writing_tasks'),
                db.get('ielts_speaking_questions'),
            ]);

            const mapAndFilter = (list: any[], filterFn: (item: any) => boolean) => {
                return (list as any[]).map(toCamelCase).filter(filterFn);
            }

            if (testId) {
                // Filter by testId
                setReadingQuestions(mapAndFilter(r, q => q.testId === testId));
                setListeningQuestions(mapAndFilter(l, q => q.testId === testId));
                setWritingTasks(mapAndFilter(w, q => q.testId === testId));
                setSpeakingQuestions(mapAndFilter(s, q => q.testId === testId));
            } else {
                // Fallback: Show all center questions
                setReadingQuestions(mapAndFilter(r, q => q.centerId === centerId));
                setListeningQuestions(mapAndFilter(l, q => q.centerId === centerId));
                setWritingTasks(mapAndFilter(w, q => q.centerId === centerId));
                setSpeakingQuestions(mapAndFilter(s, q => q.centerId === centerId));
            }
        } catch (e) { console.error('Load error:', e); }
        setLoading(false);
    };

    const showSuccess = (msg: string) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    };

    // ===== CRUD =====
    const handleSave = async (table: string, data: any) => {
        try {
            if (editingItem?.id) {
                await db.update(table, editingItem.id, toSnakeCase(data));
                showSuccess('Muvaffaqiyatli yangilandi! ✅');
            } else {
                const newItem = { ...data, id: crypto.randomUUID(), centerId, testId: testId || null };
                await db.insert(table, toSnakeCase(newItem));
                showSuccess('Muvaffaqiyatli qo\'shildi! ✅');
            }
            setModalMode(null);
            setEditingItem(null);
            loadAll();
        } catch (e) {
            console.error('Save error:', e);
            alert('Xatolik yuz berdi!');
        }
    };

    const handleDelete = async (table: string, id: string, name: string) => {
        if (!confirm(`"${name}" ni o'chirmoqchimisiz?`)) return;
        try {
            await db.delete(table, id);
            showSuccess('O\'chirildi! 🗑️');
            loadAll();
        } catch (e) {
            console.error('Delete error:', e);
        }
    };

    const handleDuplicate = async (table: string, item: any) => {
        const { id, ...rest } = item;
        try {
            const newItem = { ...rest, id: crypto.randomUUID() };
            await db.insert(table, toSnakeCase(newItem));
            showSuccess('Nusxa yaratildi! 📋');
            loadAll();
        } catch (e) {
            console.error('Duplicate error:', e);
        }
    };

    const handleExcelImport = async (file: File) => {
        try {
            const text = await file.text();
            // CSV parser: birinchi qator = header
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) { alert('Fayl bo\'sh yoki noto\'g\'ri format!'); return; }

            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
            const rows = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.replace(/"/g, '').trim());
                const obj: any = {};
                headers.forEach((h, i) => { obj[h] = values[i] || ''; });
                return obj;
            });

            const table = activeTab === 'reading' ? 'ielts_reading_questions'
                : activeTab === 'listening' ? 'ielts_listening_questions'
                    : activeTab === 'writing' ? 'ielts_writing_tasks'
                        : 'ielts_speaking_questions';

            let count = 0;
            for (const row of rows) {
                const item: any = { id: crypto.randomUUID(), centerId, testId: testId || null };

                if (activeTab === 'reading') {
                    item.examType = row['ExamType'] || 'academic';
                    item.passageNumber = Number(row['PassageNumber'] || 1);
                    item.passageTitle = row['PassageTitle'] || '';
                    item.passageText = row['PassageText'] || '';
                    item.questionNumber = Number(row['QuestionNumber'] || count + 1);
                    item.questionType = row['QuestionType'] || 'multiple_choice';
                    item.questionText = row['QuestionText'] || '';
                    item.options = row['Options'] ? JSON.parse(row['Options']) : null;
                    item.correctAnswer = row['CorrectAnswer'] || '';
                    item.points = Number(row['Points'] || 1);
                } else if (activeTab === 'listening') {
                    item.examType = row['ExamType'] || 'academic';
                    item.sectionNumber = Number(row['SectionNumber'] || 1);
                    item.sectionTitle = row['SectionTitle'] || '';
                    item.audioUrl = row['AudioUrl'] || 'placeholder';
                    item.questionNumber = Number(row['QuestionNumber'] || count + 1);
                    item.questionType = row['QuestionType'] || 'multiple_choice';
                    item.questionText = row['QuestionText'] || '';
                    item.options = row['Options'] ? JSON.parse(row['Options']) : null;
                    item.correctAnswer = row['CorrectAnswer'] || '';
                } else if (activeTab === 'writing') {
                    item.examType = row['ExamType'] || 'academic';
                    item.taskNumber = Number(row['TaskNumber'] || 1);
                    item.taskPrompt = row['TaskPrompt'] || '';
                    item.wordLimitMin = Number(row['WordLimitMin'] || 150);
                    item.timeMinutes = Number(row['TimeMinutes'] || 60);
                } else {
                    item.partNumber = Number(row['PartNumber'] || 1);
                    item.questionText = row['QuestionText'] || '';
                    item.cueCardTopic = row['CueCardTopic'] || null;
                    item.cueCardPoints = row['CueCardPoints'] ? JSON.parse(row['CueCardPoints']) : null;
                    item.preparationTime = row['PreparationTime'] ? Number(row['PreparationTime']) : null;
                    item.speakingTime = row['SpeakingTime'] ? Number(row['SpeakingTime']) : null;
                }

                await db.insert(table, toSnakeCase(item));
                count++;
            }
            showSuccess(`${count} ta savol import qilindi! 📥`);
            loadAll();
        } catch (e) {
            console.error('CSV import error:', e);
            alert('Import xatosi! CSV formatini tekshiring.');
        }
    };

    // ===== GET CURRENT DATA =====
    const getCurrentData = () => {
        let items: any[] = [];
        switch (activeTab) {
            case 'reading': items = readingQuestions; break;
            case 'listening': items = listeningQuestions; break;
            case 'writing': items = writingTasks; break;
            case 'speaking': items = speakingQuestions; break;
        }
        // Only filter by exam type if NOT in specific test mode (test implies type)
        if (!testId) {
            items = items.filter(q => q.examType === examTypeFilter);
        }
        if (searchTerm) {
            items = items.filter(q =>
                JSON.stringify(q).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return items;
    };

    const getTableName = () => {
        switch (activeTab) {
            case 'reading': return 'ielts_reading_questions';
            case 'listening': return 'ielts_listening_questions';
            case 'writing': return 'ielts_writing_tasks';
            case 'speaking': return 'ielts_speaking_questions';
        }
    };

    const currentData = getCurrentData();
    const tableName = getTableName();

    // ===== RENDER BUILDER MODAL =====
    const renderBuilderModal = () => {
        if (!modalMode || modalMode === 'preview') return null;

        const onSave = (data: any) => handleSave(tableName, data);
        const onClose = () => { setModalMode(null); setEditingItem(null); };

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-10 overflow-y-auto">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl mx-4 mb-10">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h3 className="text-lg font-black text-slate-800">
                            {editingItem ? 'Tahrirlash' : 'Yangi savol qo\'shish'} — {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </h3>
                        <button onClick={onClose} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6">
                        {activeTab === 'reading' && <ReadingQuestionBuilder t={t} initial={editingItem} examType={examTypeFilter} onSave={onSave} onCancel={onClose} />}
                        {activeTab === 'listening' && <ListeningQuestionBuilder t={t} initial={editingItem} examType={examTypeFilter} onSave={onSave} onCancel={onClose} />}
                        {activeTab === 'writing' && <WritingTaskBuilder t={t} initial={editingItem} examType={examTypeFilter} onSave={onSave} onCancel={onClose} />}
                        {activeTab === 'speaking' && <SpeakingQuestionBuilder t={t} initial={editingItem} onSave={onSave} onCancel={onClose} />}
                    </div>
                </div>
            </div>
        );
    };

    // ===== RENDER PREVIEW MODAL =====
    const renderPreviewModal = () => {
        if (modalMode !== 'preview' || !editingItem) return null;
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                            <Eye size={20} className="text-indigo-500" /> Ko'rib chiqish
                        </h3>
                        <button onClick={() => { setModalMode(null); setEditingItem(null); }} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200">
                            <X size={18} className="text-slate-500" />
                        </button>
                    </div>
                    <div className="p-6">
                        <pre className="bg-slate-50 rounded-2xl p-6 text-xs text-slate-700 overflow-x-auto whitespace-pre-wrap font-mono">
                            {JSON.stringify(editingItem, null, 2)}
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    // ===== RENDER QUESTION CARD =====
    const renderQuestionCard = (item: any, idx: number) => {
        const title = item.questionText || item.taskPrompt || item.passageTitle || '';
        const shortTitle = title.length > 80 ? title.slice(0, 80) + '...' : title;
        const qType = item.questionType || (item.taskNumber ? `Task ${item.taskNumber}` : `Part ${item.partNumber}`);
        const qNum = item.questionNumber || idx + 1;

        return (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg transition-all group">
                <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xs flex-shrink-0">
                                Q{qNum}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-700 truncate">{shortTitle}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                                        {qType}
                                    </span>
                                    {item.passageNumber && (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-500 px-2 py-0.5 rounded-md">
                                            Passage {item.passageNumber}
                                        </span>
                                    )}
                                    {item.sectionNumber && (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-purple-50 text-purple-500 px-2 py-0.5 rounded-md">
                                            Section {item.sectionNumber}
                                        </span>
                                    )}
                                    {item.correctAnswer && (
                                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-500 px-2 py-0.5 rounded-md">
                                            ✓ {item.correctAnswer.length > 20 ? item.correctAnswer.slice(0, 20) + '...' : item.correctAnswer}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Action buttons */}
                        {!isReadOnly && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingItem(item); setModalMode('preview'); }}
                                    className="p-2 bg-slate-50 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 transition-all" title="Ko'rish">
                                    <Eye size={14} />
                                </button>
                                <button onClick={() => { setEditingItem(item); setModalMode('edit'); }}
                                    className="p-2 bg-slate-50 rounded-lg hover:bg-amber-50 hover:text-amber-600 text-slate-400 transition-all" title="Tahrirlash">
                                    <Edit3 size={14} />
                                </button>
                                <button onClick={() => handleDuplicate(tableName, item)}
                                    className="p-2 bg-slate-50 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 text-slate-400 transition-all" title="Nusxalash">
                                    <Copy size={14} />
                                </button>
                                <button onClick={() => handleDelete(tableName, item.id, shortTitle)}
                                    className="p-2 bg-slate-50 rounded-lg hover:bg-red-50 hover:text-red-600 text-slate-400 transition-all" title="O'chirish">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}
                        {isReadOnly && (
                            <button onClick={() => { setEditingItem(item); setModalMode('preview'); }}
                                className="p-2 bg-slate-50 rounded-lg hover:bg-indigo-50 text-slate-400 transition-all">
                                <Eye size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ===== MAIN RENDER =====
    return (
        <div className="min-h-screen bg-[#f8f9fc]">
            {/* Success toast */}
            {successMsg && (
                <div className="fixed top-6 right-6 z-[60] bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm flex items-center gap-2 animate-[slideIn_0.3s_ease]">
                    <CheckCircle size={18} /> {successMsg}
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="flex items-center justify-between py-5">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">IELTS Test Builder</h1>
                            <p className="text-xs font-bold text-slate-400 mt-1">Savollar yaratish va boshqarish</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Excel import - Only show if valid context */}
                            {!isReadOnly && (
                                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all">
                                    <Upload size={14} /> CSV Import
                                    <input type="file" accept=".csv" className="hidden"
                                        onChange={(e) => e.target.files?.[0] && handleExcelImport(e.target.files[0])} />
                                </label>
                            )}
                            {/* Exam type filter - Hide if viewing specific test */}
                            {!testId && (
                                <div className="flex bg-slate-100 rounded-xl p-1">
                                    {[IELTSExamType.ACADEMIC, IELTSExamType.GENERAL].map(type => (
                                        <button key={type} onClick={() => setExamTypeFilter(type)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${examTypeFilter === type
                                                ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                                            {type === 'academic' ? 'Academic' : 'General'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1">
                        {TABS.map(tab => {
                            const count = (tab.key === 'reading' ? readingQuestions : tab.key === 'listening' ? listeningQuestions
                                : tab.key === 'writing' ? writingTasks : speakingQuestions)
                                .filter((q: any) => tab.key === 'speaking' || q.examType === examTypeFilter).length;
                            const Icon = tab.icon;
                            return (
                                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === tab.key
                                        ? 'bg-[#f8f9fc] text-indigo-600 border-t-2 border-x border-indigo-500 border-slate-100'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
                                    <Icon size={16} /> {tab.label}
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] ${activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                        <input type="text" placeholder="Savollarni qidirish..." value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400" />
                    </div>
                    {!isReadOnly && (
                        <button onClick={() => { setEditingItem(null); setModalMode('create'); }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                            <Plus size={16} /> Yangi qo'shish
                        </button>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-indigo-400" size={32} />
                    </div>
                )}

                {/* Empty state */}
                {!loading && currentData.length === 0 && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center">
                        <AlertTriangle size={48} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-lg font-black text-slate-600 mb-2">Savollar topilmadi</h3>
                        <p className="text-sm text-slate-400 mb-6">
                            {searchTerm ? `"${searchTerm}" bo'yicha natija yo'q` : 'Yangi savol qo\'shish uchun tugmani bosing'}
                        </p>
                        {!isReadOnly && !searchTerm && (
                            <button onClick={() => { setEditingItem(null); setModalMode('create'); }}
                                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase">
                                <Plus size={14} className="inline mr-2" /> Birinchi savolni qo'shish
                            </button>
                        )}
                    </div>
                )}

                {/* Question list */}
                {!loading && currentData.length > 0 && (
                    <div className="space-y-3">
                        {currentData
                            .sort((a: any, b: any) => (a.questionNumber || a.passageNumber || a.taskNumber || a.partNumber || 0) - (b.questionNumber || b.passageNumber || b.taskNumber || b.partNumber || 0))
                            .map((item: any, idx: number) => renderQuestionCard(item, idx))}
                    </div>
                )}

                {/* Stats footer */}
                {!loading && currentData.length > 0 && (
                    <div className="mt-6 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Jami: {currentData.length} ta savol</span>
                        {!testId && <span>{examTypeFilter === 'academic' ? 'Academic' : 'General Training'}</span>}
                    </div>
                )}
            </div>

            {/* Modals */}
            {renderBuilderModal()}
            {renderPreviewModal()}
        </div>
    );
};

export default IELTSAdmin;
