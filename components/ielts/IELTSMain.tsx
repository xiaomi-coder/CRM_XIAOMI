import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Headphones, PenTool, Mic, Trophy, ChevronRight, Clock, ArrowLeft, Loader2 } from 'lucide-react';
import { IELTSAttempt, IELTSAttemptStatus, IELTSExamType, IELTSReadingQuestion, IELTSListeningQuestion, IELTSWritingTask, IELTSSpeakingQuestion } from '../../types';
import { getReadingBandScore, getListeningBandScore, calculateWritingOverall, calculateIELTSOverall } from '../../services/ieltsGradingService';
import { seedIELTSQuestionsForCenter } from '../../services/ieltsSeedService';
import { db } from '../../services/supabase';
import { sendTelegramMessage } from '../../services/telegramService';
import IELTSReading from './IELTSReading';
import IELTSListening from './IELTSListening';
import IELTSWriting from './IELTSWriting';
import IELTSSpeaking from './IELTSSpeaking';
import IELTSResults from './IELTSResults';

interface IELTSMainProps {
    t: any;
    centerId: string;
    studentName: string;
    leadId?: string;
    testId?: string | null;
    pinCode?: string | null;
    onComplete?: (attempt: IELTSAttempt) => void;
    onBack?: () => void;
}

type ExamSection = 'menu' | 'reading' | 'listening' | 'writing' | 'speaking' | 'results';

const SECTIONS = [
    { key: 'reading' as const, icon: BookOpen, label: 'Reading', time: '60 min', questions: 40, color: 'from-blue-500 to-indigo-600' },
    { key: 'listening' as const, icon: Headphones, label: 'Listening', time: '30 min', questions: 40, color: 'from-purple-500 to-pink-600' },
    { key: 'writing' as const, icon: PenTool, label: 'Writing', time: '60 min', questions: 2, color: 'from-emerald-500 to-teal-600' },
    { key: 'speaking' as const, icon: Mic, label: 'Speaking', time: '11-14 min', questions: 3, color: 'from-amber-500 to-orange-600' },
];

const IELTSMain: React.FC<IELTSMainProps> = ({ t, centerId, studentName, leadId, testId, pinCode, onComplete, onBack }) => {
    const [currentSection, setCurrentSection] = useState<ExamSection>('menu');
    const [examType, setExamType] = useState<IELTSExamType>(IELTSExamType.ACADEMIC);
    const [testTitle, setTestTitle] = useState<string>(''); // For multi-test mode
    const [attempt, setAttempt] = useState<IELTSAttempt | null>(null);
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState<string | undefined>(undefined);
    const [centerBotToken, setCenterBotToken] = useState<string>('');
    const [centerReportChatId, setCenterReportChatId] = useState<string>('');
    const [centerName, setCenterName] = useState<string>('');
    const seedingRef = React.useRef(false);

    // Load questions from Supabase
    const [readingQuestions, setReadingQuestions] = useState<IELTSReadingQuestion[]>([]);
    const [listeningQuestions, setListeningQuestions] = useState<IELTSListeningQuestion[]>([]);
    const [writingTasks, setWritingTasks] = useState<IELTSWritingTask[]>([]);
    const [speakingQuestions, setSpeakingQuestions] = useState<IELTSSpeakingQuestion[]>([]);

    const loadCenterSettings = (s: any) => {
        if (!s) return;
        if (s.geminiApiKey) setApiKey(s.geminiApiKey);
        if (s.botToken) setCenterBotToken(s.botToken);
        if (s.reportChatId) setCenterReportChatId(s.reportChatId);
        if (s.centerName) setCenterName(s.centerName);
    };

    useEffect(() => {
        if (testId) {
            db.getOne('ielts_tests', 'id', testId).then((test: any) => {
                if (test) {
                    setExamType(test.examType);
                    setTestTitle(test.title);
                    if (test.centerId) {
                        db.getOne('settings', 'centerId', test.centerId).then(loadCenterSettings);
                    }
                }
            });
        } else if (centerId && centerId !== 'GLOBAL') {
            db.getOne('settings', 'centerId', centerId).then(loadCenterSettings);
        }
        loadQuestions();
    }, [centerId, examType, testId]);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const [reading, listening, writing, speaking] = await Promise.all([
                db.get('ielts_reading_questions'),
                db.get('ielts_listening_questions'),
                db.get('ielts_writing_tasks'),
                db.get('ielts_speaking_questions')
            ]);

            // Helper to map snake_case DB columns to camelCase
            const toCamelCase = (item: any) => {
                if (!item) return item;
                // Basic mapping for all types
                // DIQQAT: jadvallarda ustunlar aralash — ba'zilari camelCase ("questionText"),
                // faqat test_id snake_case. Shuning uchun ?? bilan ikkalasini ham qo'llab-quvvatlaymiz,
                // aks holda mavjud camelCase qiymat undefined bilan o'chib ketadi.
                const base = {
                    ...item,
                    centerId: item.center_id ?? item.centerId,
                    testId: item.test_id ?? item.testId,
                    examType: item.exam_type ?? item.examType,
                    questionText: item.question_text ?? item.questionText,
                    questionType: item.question_type ?? item.questionType,
                    questionNumber: item.question_number ?? item.questionNumber,
                    correctAnswer: item.correct_answer ?? item.correctAnswer,
                };
                // Specific fields
                if (item.passage_title) base.passageTitle = item.passage_title;
                if (item.passage_text) base.passageText = item.passage_text;
                if (item.passage_number) base.passageNumber = item.passage_number;
                if (item.section_title) base.sectionTitle = item.section_title;
                if (item.section_number) base.sectionNumber = item.section_number;
                if (item.audio_url) base.audioUrl = item.audio_url;
                if (item.task_number) base.taskNumber = item.task_number;
                if (item.task_prompt) base.taskPrompt = item.task_prompt;
                if (item.word_limit_min) base.wordLimitMin = item.word_limit_min;
                if (item.time_minutes) base.timeMinutes = item.time_minutes;
                if (item.part_number) base.partNumber = item.part_number;
                if (item.cue_card_topic) base.cueCardTopic = item.cue_card_topic;
                if (item.cue_card_points) base.cueCardPoints = item.cue_card_points;
                if (item.preparation_time) base.preparationTime = item.preparation_time;
                if (item.speaking_time) base.speakingTime = item.speaking_time;

                return base;
            };

            const mapList = (list: any[]) => (list || []).map(toCamelCase);

            const r = mapList(reading as any[]);
            const l = mapList(listening as any[]);
            const w = mapList(writing as any[]);
            const s = mapList(speaking as any[]);

            // Bu markaz uchun savollar bormi tekshirish
            let centerReading = [];

            if (testId) {
                // Specific Test Mode: Filter by testId
                centerReading = r.filter((q: any) => q.testId === testId);
                setReadingQuestions(centerReading as IELTSReadingQuestion[]);
                setListeningQuestions(l.filter((q: any) => q.testId === testId) as IELTSListeningQuestion[]);
                setWritingTasks(w.filter((q: any) => q.testId === testId) as IELTSWritingTask[]);
                setSpeakingQuestions(s.filter((q: any) => q.testId === testId) as IELTSSpeakingQuestion[]);
            } else {
                // Global Mode (legacy): Filter by centerId and examType
                centerReading = r.filter((q: any) => q.centerId === centerId && q.examType === examType);

                if (centerReading.length === 0 && !seedingRef.current) {
                    // Savollar yo'q — avtomatik namuna savollar yaratish (faqat 1 marta)
                    seedingRef.current = true;
                    const seeded = await seedIELTSQuestionsForCenter(centerId);
                    seedingRef.current = false;
                    if (seeded) {
                        // Qayta yuklash — yangi savollar bilan
                        setLoading(false);
                        return loadQuestions();
                    }
                }
                setReadingQuestions(centerReading as IELTSReadingQuestion[]);
                setListeningQuestions(l.filter((q: any) => q.centerId === centerId && q.examType === examType) as IELTSListeningQuestion[]);
                setWritingTasks(w.filter((q: any) => q.centerId === centerId && q.examType === examType) as IELTSWritingTask[]);
                setSpeakingQuestions(s.filter((q: any) => q.centerId === centerId) as IELTSSpeakingQuestion[]);
            }
        } catch (e) {
            console.error('Questions load error:', e);
        }
        setLoading(false);
    };

    const startExam = async () => {
        const newAttempt: IELTSAttempt = {
            id: crypto.randomUUID(),
            centerId,
            studentName,
            examType,
            startTime: new Date().toISOString(),
            readingStatus: IELTSAttemptStatus.NOT_STARTED,
            listeningStatus: IELTSAttemptStatus.NOT_STARTED,
            writingStatus: IELTSAttemptStatus.NOT_STARTED,
            speakingStatus: IELTSAttemptStatus.NOT_STARTED,
            status: IELTSAttemptStatus.IN_PROGRESS,

            leadId,
            testId: testId || undefined,
            pinCode: pinCode || undefined
        };

        try {
            await db.insert('ielts_attempts', newAttempt);
        } catch (e) {
            console.error('Could not save attempt:', e);
        }

        setAttempt(newAttempt);
        setCurrentSection('reading');
    };

    const handleSectionComplete = useCallback(async (section: string, score: number, data?: any) => {
        if (!attempt) return;

        const updates: Partial<IELTSAttempt> = {};

        switch (section) {
            case 'reading':
                updates.readingStatus = IELTSAttemptStatus.COMPLETED;
                updates.readingScore = score;
                updates.readingAnswers = data?.answers;
                break;
            case 'listening':
                updates.listeningStatus = IELTSAttemptStatus.COMPLETED;
                updates.listeningScore = score;
                updates.listeningAnswers = data?.answers;
                break;
            case 'writing':
                updates.writingStatus = IELTSAttemptStatus.COMPLETED;
                updates.writingScore = score;
                updates.writingTask1Text = data?.task1Text;
                updates.writingTask2Text = data?.task2Text;
                updates.writingTask1Scores = data?.task1Scores;
                updates.writingTask2Scores = data?.task2Scores;
                break;
            case 'speaking':
                updates.speakingStatus = IELTSAttemptStatus.COMPLETED;
                updates.speakingScore = score;
                updates.speakingScores = data?.scores;
                break;
        }

        const updatedAttempt = { ...attempt, ...updates };
        setAttempt(updatedAttempt);

        try {
            await db.update('ielts_attempts', attempt.id, updates);
        } catch (e) {
            console.error('Update error:', e);
        }

        // Auto navigate to next section
        const sectionOrder: ExamSection[] = ['reading', 'listening', 'writing', 'speaking'];
        const currentIdx = sectionOrder.indexOf(section as ExamSection);
        if (currentIdx < 3) {
            setCurrentSection(sectionOrder[currentIdx + 1]);
        } else {
            // All sections done — calculate overall and go to results
            const overall = calculateIELTSOverall(
                updatedAttempt.readingScore || 0,
                updatedAttempt.listeningScore || 0,
                updatedAttempt.writingScore || 0,
                score
            );
            const finalAttempt = {
                ...updatedAttempt,
                overallScore: overall,
                status: IELTSAttemptStatus.COMPLETED,
                endTime: new Date().toISOString()
            };
            setAttempt(finalAttempt);
            try {
                await db.update('ielts_attempts', attempt.id, {
                    overallScore: overall,
                    status: IELTSAttemptStatus.COMPLETED,
                    endTime: finalAttempt.endTime
                });
            } catch (e) {
                console.error('Final update error:', e);
            }
            if (onComplete) onComplete(finalAttempt);

            // Direktorga test natijasi xabarini yuborish
            if (centerBotToken && centerReportChatId) {
                const r = finalAttempt.readingScore || 0;
                const l = finalAttempt.listeningScore || 0;
                const w = finalAttempt.writingScore || 0;
                const sp = score;
                const msg = `📝 <b>YANGI TEST NATIJASI</b>\n\n👤 O'quvchi: <b>${studentName}</b>\n📋 Test: ${testTitle || 'IELTS Mock'}\n📅 Sana: ${new Date().toLocaleDateString('uz-UZ')}\n\n📊 <b>Natijalar:</b>\n📖 Reading: <b>${r}</b>\n🎧 Listening: <b>${l}</b>\n✍️ Writing: <b>${w}</b>\n🎤 Speaking: <b>${sp}</b>\n\n🏆 Overall Band: <b>${overall}</b>\n\n<i>${centerName || 'EduControl CRM'}</i>`;
                sendTelegramMessage(centerBotToken, centerReportChatId, msg).catch(console.error);
            }

            setCurrentSection('results');
        }
    }, [attempt, onComplete]);

    const getStatusForSection = (section: string): IELTSAttemptStatus => {
        if (!attempt) return IELTSAttemptStatus.NOT_STARTED;
        switch (section) {
            case 'reading': return attempt.readingStatus;
            case 'listening': return attempt.listeningStatus;
            case 'writing': return attempt.writingStatus;
            case 'speaking': return attempt.speakingStatus;
            default: return IELTSAttemptStatus.NOT_STARTED;
        }
    };

    // Render section components
    if (currentSection === 'reading' && attempt) {
        return <IELTSReading t={t} questions={readingQuestions} examType={examType}
            onComplete={(score, answers) => handleSectionComplete('reading', score, { answers })}
            onBack={() => setCurrentSection('menu')} />;
    }
    if (currentSection === 'listening' && attempt) {
        return <IELTSListening t={t} questions={listeningQuestions} examType={examType}
            onComplete={(score, answers) => handleSectionComplete('listening', score, { answers })}
            onBack={() => setCurrentSection('menu')} />;
    }
    if (currentSection === 'writing' && attempt) {
        return <IELTSWriting t={t} tasks={writingTasks} examType={examType}
            apiKey={apiKey}
            onComplete={(score, data) => handleSectionComplete('writing', score, data)}
            onBack={() => setCurrentSection('menu')} />;
    }
    if (currentSection === 'speaking' && attempt) {
        return <IELTSSpeaking t={t} questions={speakingQuestions}
            apiKey={apiKey}
            onComplete={(score, data) => handleSectionComplete('speaking', score, data)}
            onBack={() => setCurrentSection('menu')} />;
    }
    if (currentSection === 'results' && attempt) {
        return <IELTSResults t={t} attempt={attempt} onBack={onBack || (() => setCurrentSection('menu'))} />;
    }

    // Main Menu
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8">
            {/* Header */}
            <div className="max-w-5xl mx-auto">
                {onBack && (
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 transition-all text-sm font-bold">
                        <ArrowLeft size={18} /> {t.back || 'Ortga'}
                    </button>
                )}

                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-3 bg-indigo-50 px-6 py-2 rounded-full mb-4">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">IELTS MOCK EXAM</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-3">
                        {studentName}
                    </h1>
                    <p className="text-slate-400 text-sm font-bold">
                        {testTitle || (t.ielts_desc || "Professional IELTS Mock Exam — AI baholash bilan")}
                    </p>
                </div>

                {/* Specific Test Title */}
                {testTitle && (
                    <div className="bg-white rounded-xl p-4 mb-8 text-center shadow-lg border border-indigo-100 max-w-lg mx-auto transform -translate-y-4">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Maxsus Imtihon</span>
                        <h2 className="text-lg font-black text-indigo-700">{testTitle}</h2>
                    </div>
                )}

                {/* Exam Type Selection (Only if NOT specific test) */}
                {!attempt && !testId && (
                    <div className="flex justify-center gap-4 mb-12">
                        {[
                            { type: IELTSExamType.ACADEMIC, label: 'Academic', desc: 'University uchun' },
                            { type: IELTSExamType.GENERAL, label: 'General Training', desc: 'Visa/ish uchun' }
                        ].map(et => (
                            <button key={et.type} onClick={() => setExamType(et.type)}
                                className={`px-8 py-4 rounded-2xl font-black text-sm transition-all border-2 ${examType === et.type
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200 scale-105'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                                    }`}>
                                <div>{et.label}</div>
                                <div className={`text-[9px] mt-1 ${examType === et.type ? 'text-indigo-200' : 'text-slate-400'}`}>{et.desc}</div>
                            </button>
                        ))}
                    </div>
                )}

                {/* Sections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                    {SECTIONS.map((section, i) => {
                        const status = getStatusForSection(section.key);
                        const isCompleted = status === IELTSAttemptStatus.COMPLETED;
                        const Icon = section.icon;

                        return (
                            <div key={section.key}
                                className={`relative overflow-hidden rounded-[2rem] border transition-all ${isCompleted ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-xl'
                                    }`}>
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${section.color} flex items-center justify-center text-white shadow-lg`}>
                                            <Icon size={24} />
                                        </div>
                                        {isCompleted && (
                                            <div className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                                                ✓ {t.completed || 'Tugatildi'}
                                            </div>
                                        )}
                                        {!attempt && (
                                            <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-3 py-1 rounded-lg">{i + 1}/4</span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">{section.label}</h3>
                                    <div className="flex items-center gap-4 text-[11px] font-bold text-slate-400">
                                        <span className="flex items-center gap-1"><Clock size={12} /> {section.time}</span>
                                        <span>{section.questions} {section.questions > 2 ? t.questions || 'savol' : 'task'}</span>
                                    </div>
                                    {attempt && isCompleted && (
                                        <div className="mt-4 text-2xl font-black text-emerald-600">
                                            Band {attempt[`${section.key}Score` as keyof IELTSAttempt]?.toString() || '—'}
                                        </div>
                                    )}
                                </div>
                                {/* Decorative gradient stripe */}
                                <div className={`h-1 bg-gradient-to-r ${section.color}`}></div>
                            </div>
                        );
                    })}
                </div>

                {/* Start / View Results Button */}
                <div className="text-center">
                    {!attempt ? (
                        <button onClick={startExam} disabled={loading}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-16 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-3 mx-auto">
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <Trophy size={20} />}
                            {t.start_exam || "Imtihonni boshlash"}
                            <ChevronRight size={18} />
                        </button>
                    ) : attempt.status === IELTSAttemptStatus.COMPLETED ? (
                        <button onClick={() => setCurrentSection('results')}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-16 py-5 rounded-2xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-emerald-200 hover:scale-[1.02] transition-all flex items-center gap-3 mx-auto">
                            <Trophy size={20} />
                            {t.view_results || "Natijalarni ko'rish"}
                        </button>
                    ) : null}
                </div>

                {/* Progress indicator */}
                {attempt && attempt.status === IELTSAttemptStatus.IN_PROGRESS && (
                    <div className="mt-8 max-w-md mx-auto">
                        <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <span>{t.progress || 'Progress'}</span>
                            <span>{SECTIONS.filter(s => getStatusForSection(s.key) === IELTSAttemptStatus.COMPLETED).length}/4</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                                style={{ width: `${SECTIONS.filter(s => getStatusForSection(s.key) === IELTSAttemptStatus.COMPLETED).length * 25}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IELTSMain;
