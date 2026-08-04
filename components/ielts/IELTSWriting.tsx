import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PenTool, Clock, AlertTriangle, CheckCircle, ArrowLeft, Loader2, Sparkles, FileText, Image } from 'lucide-react';
import { IELTSWritingTask, IELTSExamType, IELTSWritingScore } from '../../types';
import { gradeWritingTask1, gradeWritingTask2, calculateWritingOverall } from '../../services/ieltsGradingService';

interface IELTSWritingProps {
    t: any;
    tasks: IELTSWritingTask[];
    examType: IELTSExamType;
    onComplete: (score: number, data: { task1Text: string; task2Text: string; task1Scores?: IELTSWritingScore; task2Scores?: IELTSWritingScore }) => void;
    onBack: () => void;
    apiKey?: string;
}

const TOTAL_TIME = 60 * 60; // 60 daqiqa

/**
 * Task 1 topshirig'ining oxirida `[DATA] ...` bo'limi bo'lishi mumkin — bu
 * grafikdagi raqamlarning matnli izohi. U FAQAT AI baholovchi uchun: model
 * rasmni ko'rmaydi, shusiz Task Achievement ni to'g'ri baholay olmaydi.
 * Talabaga ko'rsatilmaydi, aks holda grafikni o'qish shart bo'lmay qoladi.
 */
const visiblePrompt = (prompt?: string): string =>
    (prompt || '').split('[DATA]')[0].trim();

const IELTSWriting: React.FC<IELTSWritingProps> = ({ t, tasks, examType, onComplete, onBack, apiKey }) => {
    const [task1Text, setTask1Text] = useState('');
    const [task2Text, setTask2Text] = useState('');
    const [activeTask, setActiveTask] = useState<1 | 2>(1);
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('ielts_writing_time');
        return saved ? parseInt(saved) : TOTAL_TIME;
    });
    const [isGrading, setIsGrading] = useState(false);
    const [gradingStep, setGradingStep] = useState('');
    const [task1Scores, setTask1Scores] = useState<IELTSWritingScore | null>(null);
    const [task2Scores, setTask2Scores] = useState<IELTSWritingScore | null>(null);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const task1 = tasks.find(t => t.taskNumber === 1);
    const task2 = tasks.find(t => t.taskNumber === 2);

    const wordCount1 = task1Text.trim() ? task1Text.trim().split(/\s+/).length : 0;
    const wordCount2 = task2Text.trim() ? task2Text.trim().split(/\s+/).length : 0;

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 1;
                localStorage.setItem('ielts_writing_time', String(next));
                if (next <= 0) {
                    handleSubmit();
                    return 0;
                }
                return next;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleSubmit = useCallback(async () => {
        if (isSubmitted) return;
        setIsSubmitted(true);
        if (timerRef.current) clearInterval(timerRef.current);
        localStorage.removeItem('ielts_writing_time');
        setIsGrading(true);

        try {
            let scores1: IELTSWritingScore | undefined;
            let scores2: IELTSWritingScore | undefined;

            // Grade Task 1
            if (task1Text.trim()) {
                setGradingStep('Task 1 baholanmoqda...');
                try {
                    scores1 = await gradeWritingTask1(task1Text, task1?.taskPrompt || 'Describe the information', task1?.taskImageUrl, apiKey);
                    setTask1Scores(scores1);
                } catch (e) {
                    console.error('Task 1 grading failed:', e);
                    scores1 = { taskAchievement: 5, coherenceCohesion: 5, lexicalResource: 5, grammaticalRange: 5, overallBand: 5, feedback: 'Baholashda xatolik', suggestions: [], wordCount: wordCount1 };
                }
            }

            // Grade Task 2
            if (task2Text.trim()) {
                setGradingStep('Task 2 baholanmoqda...');
                try {
                    scores2 = await gradeWritingTask2(task2Text, task2?.taskPrompt || 'Discuss both views', apiKey);
                    setTask2Scores(scores2);
                } catch (e) {
                    console.error('Task 2 grading failed:', e);
                    scores2 = { taskAchievement: 5, coherenceCohesion: 5, lexicalResource: 5, grammaticalRange: 5, overallBand: 5, feedback: 'Baholashda xatolik', suggestions: [], wordCount: wordCount2 };
                }
            }

            const band1 = scores1?.overallBand || 0;
            const band2 = scores2?.overallBand || 0;
            const overall = band1 && band2 ? calculateWritingOverall(band1, band2) : (band1 || band2 || 0);

            onComplete(overall, { task1Text, task2Text, task1Scores: scores1, task2Scores: scores2 });
        } catch (e) {
            console.error('Writing submit error:', e);
            onComplete(0, { task1Text, task2Text });
        }

        setIsGrading(false);
    }, [task1Text, task2Text, task1, task2, onComplete, isSubmitted, wordCount1, wordCount2]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const isUrgent = timeLeft < 300;
    const activeText = activeTask === 1 ? task1Text : task2Text;
    const activeWordCount = activeTask === 1 ? wordCount1 : wordCount2;
    const minWords = activeTask === 1 ? 150 : 250;
    const activePrompt = activeTask === 1 ? task1 : task2;

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <ArrowLeft size={18} className="text-slate-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <PenTool size={18} className="text-emerald-600" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">IELTS Writing</h2>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-sm ${isUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                        <Clock size={16} />
                        {formatTime(timeLeft)}
                    </div>

                    <button onClick={() => setShowSubmitConfirm(true)} disabled={isGrading}
                        className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center gap-2">
                        {isGrading ? <><Loader2 className="animate-spin" size={14} /> {gradingStep}</> : <>{t.submit || 'Topshirish'}</>}
                    </button>
                </div>

                {/* Task Toggle */}
                <div className="max-w-6xl mx-auto px-4 py-2 flex gap-2">
                    <button onClick={() => setActiveTask(1)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTask === 1 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}>
                        <FileText size={14} /> Task 1 ({wordCount1} {t.words || "so'z"})
                    </button>
                    <button onClick={() => setActiveTask(2)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTask === 2 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}>
                        <FileText size={14} /> Task 2 ({wordCount2} {t.words || "so'z"})
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 lg:py-6">
                {/* Left: Task Prompt */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 lg:p-8 lg:sticky lg:top-[140px] max-h-[calc(100vh-180px)] overflow-y-auto">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg">
                            Task {activeTask}
                        </span>
                        <span className="text-[9px] font-black text-slate-400">
                            {activeTask === 1 ? '20 min • 150+ words' : '40 min • 250+ words'}
                        </span>
                    </div>

                    {activePrompt?.taskImageUrl && (
                        <div className="mb-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <Image size={18} className="text-slate-400 mb-2" />
                            <img src={activePrompt.taskImageUrl} alt="Task visual" className="w-full rounded-xl"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                    )}

                    <div className="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                        {visiblePrompt(activePrompt?.taskPrompt) || (
                            activeTask === 1
                                ? "The chart below shows information about changes in average house prices in five different cities between 1990 and 2002 compared with the average house prices in 1989. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\n\nWrite at least 150 words."
                                : "Some people believe that the best way to improve public health is by increasing the number of sports facilities. Others think that this would have little effect and that other measures are needed.\n\nDiscuss both views and give your own opinion.\n\nWrite at least 250 words."
                        )}
                    </div>

                    {/* Word count indicator */}
                    <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black text-slate-400 uppercase">{t.word_count || "So'zlar soni"}</span>
                            <span className={`text-sm font-black ${activeWordCount >= minWords ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {activeWordCount}/{minWords}+
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${activeWordCount >= minWords ? 'bg-emerald-500' : activeWordCount >= minWords * 0.6 ? 'bg-amber-500' : 'bg-red-400'
                                }`} style={{ width: `${Math.min(100, (activeWordCount / minWords) * 100)}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Right: Text Area */}
                <div className="flex flex-col">
                    <textarea
                        value={activeTask === 1 ? task1Text : task2Text}
                        onChange={e => activeTask === 1 ? setTask1Text(e.target.value) : setTask2Text(e.target.value)}
                        placeholder={`Task ${activeTask} javobingizni bu yerga yozing...`}
                        className="flex-1 min-h-[500px] bg-white rounded-[2rem] border border-slate-100 p-8 outline-none text-sm leading-[2] font-medium text-slate-700 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        spellCheck="false"
                    />

                    {activeWordCount < minWords && activeWordCount > 0 && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-600" />
                            <p className="text-[11px] font-bold text-amber-700">
                                {minWords - activeWordCount} {t.more_words || "ta so'z yetmaydi"} (minimum {minWords})
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Grading Overlay */}
            {isGrading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl text-center">
                        <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Sparkles size={36} className="text-emerald-600 animate-pulse" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">AI Baholash</h3>
                        <p className="text-sm text-slate-500 mb-4">{gradingStep}</p>
                        <div className="flex justify-center">
                            <Loader2 className="animate-spin text-emerald-600" size={24} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-4">Bu 10-30 soniya davom etishi mumkin</p>
                    </div>
                </div>
            )}

            {/* Submit Modal */}
            {showSubmitConfirm && !isGrading && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={32} className="text-emerald-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{t.confirm_submit || "Topshirasizmi?"}</h3>
                            <p className="text-sm text-slate-500 mt-2">AI natijangizni baholaydi</p>
                            <div className="flex gap-4 justify-center mt-4">
                                <div className={`px-4 py-2 rounded-xl text-xs font-black ${wordCount1 >= 150 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    Task 1: {wordCount1} so'z
                                </div>
                                <div className={`px-4 py-2 rounded-xl text-xs font-black ${wordCount2 >= 250 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                    Task 2: {wordCount2} so'z
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 font-black text-slate-400 text-xs uppercase">{t.cancel || "Bekor"}</button>
                            <button onClick={() => { setShowSubmitConfirm(false); handleSubmit(); }}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2">
                                <Sparkles size={16} /> AI {t.submit || "Baholash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IELTSWriting;
