import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BookOpen, Clock, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { IELTSReadingQuestion, IELTSExamType, IELTSQuestionType } from '../../types';
import { getReadingBandScore } from '../../services/ieltsGradingService';

interface IELTSReadingProps {
    t: any;
    questions: IELTSReadingQuestion[];
    examType: IELTSExamType;
    onComplete: (score: number, answers: Record<number, string>) => void;
    onBack: () => void;
}

const TOTAL_TIME = 60 * 60; // 60 daqiqa

const IELTSReading: React.FC<IELTSReadingProps> = ({ t, questions, examType, onComplete, onBack }) => {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [currentPassage, setCurrentPassage] = useState(1);
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('ielts_reading_time');
        return saved ? parseInt(saved) : TOTAL_TIME;
    });
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Group questions by passage
    const passages = useMemo(() => {
        const grouped: Record<number, IELTSReadingQuestion[]> = { 1: [], 2: [], 3: [] };
        questions.forEach(q => {
            if (grouped[q.passageNumber]) {
                grouped[q.passageNumber].push(q);
            }
        });
        // Sort by question number
        Object.values(grouped).forEach(arr => arr.sort((a, b) => a.questionNumber - b.questionNumber));
        return grouped;
    }, [questions]);

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 1;
                localStorage.setItem('ielts_reading_time', String(next));
                if (next <= 0) {
                    handleSubmit();
                    return 0;
                }
                return next;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const handleSubmit = useCallback(() => {
        if (isSubmitted) return;
        setIsSubmitted(true);
        if (timerRef.current) clearInterval(timerRef.current);
        localStorage.removeItem('ielts_reading_time');

        // Calculate score
        let correct = 0;
        questions.forEach(q => {
            const userAnswer = (answers[q.questionNumber] || '').trim().toLowerCase();
            const correctAnswer = q.correctAnswer.trim().toLowerCase();
            if (userAnswer === correctAnswer) correct++;
        });

        const bandScore = getReadingBandScore(correct, examType);
        onComplete(bandScore, answers);
    }, [answers, questions, examType, onComplete, isSubmitted]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const isUrgent = timeLeft < 300; // < 5 min
    const currentQuestions = passages[currentPassage] || [];
    const passageText = currentQuestions[0]?.passageText || '';
    const passageTitle = currentQuestions[0]?.passageTitle || `Passage ${currentPassage}`;
    const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)]?.trim()).length;

    const setAnswer = (qNum: number, value: string) => {
        setAnswers(prev => ({ ...prev, [qNum]: value }));
    };

    const renderQuestion = (q: IELTSReadingQuestion) => {
        const value = answers[q.questionNumber] || '';

        return (
            <div key={q.questionNumber} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-indigo-200 transition-all">
                <div className="flex items-start gap-3 mb-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${value.trim() ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                        {q.questionNumber}
                    </span>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{q.questionText}</p>
                </div>

                {/* Multiple Choice */}
                {q.questionType === IELTSQuestionType.MULTIPLE_CHOICE && q.options && (
                    <div className="ml-11 space-y-2">
                        {q.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i); // A, B, C, D
                            return (
                                <button key={i} onClick={() => setAnswer(q.questionNumber, letter)}
                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${value === letter
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                            : 'bg-slate-50 text-slate-600 hover:bg-indigo-50'
                                        }`}>
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${value === letter ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                        }`}>{letter}</span>
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* True/False/Not Given */}
                {(q.questionType === IELTSQuestionType.TRUE_FALSE_NOT_GIVEN || q.questionType === IELTSQuestionType.YES_NO_NOT_GIVEN) && (
                    <div className="ml-11 flex gap-2 flex-wrap">
                        {(q.questionType === IELTSQuestionType.TRUE_FALSE_NOT_GIVEN
                            ? ['TRUE', 'FALSE', 'NOT GIVEN']
                            : ['YES', 'NO', 'NOT GIVEN']
                        ).map(opt => (
                            <button key={opt} onClick={() => setAnswer(q.questionNumber, opt)}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${value === opt
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-slate-50 text-slate-500 hover:bg-indigo-50'
                                    }`}>
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {/* Text Input (gap fill, short answer, completion) */}
                {['sentence_completion', 'summary_completion', 'short_answer', 'matching_headings', 'matching_features'].includes(q.questionType) && (
                    <div className="ml-11">
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setAnswer(q.questionNumber, e.target.value)}
                            placeholder={t.type_answer || "Javobni yozing..."}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <ArrowLeft size={18} className="text-slate-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <BookOpen size={18} className="text-indigo-600" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">IELTS Reading</h2>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-sm ${isUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                        <Clock size={16} />
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                            {answeredCount}/{questions.length} {t.answered || 'javob'}
                        </span>
                        <button onClick={() => setShowSubmitConfirm(true)}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                            {t.submit || 'Topshirish'}
                        </button>
                    </div>
                </div>

                {/* Passage Navigation */}
                <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2">
                    {[1, 2, 3].map(p => {
                        const pQuestions = passages[p] || [];
                        const pAnswered = pQuestions.filter(q => answers[q.questionNumber]?.trim()).length;
                        return (
                            <button key={p} onClick={() => setCurrentPassage(p)}
                                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${currentPassage === p
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}>
                                Passage {p} ({pAnswered}/{pQuestions.length})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content — Split View */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-6 p-4 lg:py-6">
                {/* Left: Passage Text */}
                <div className="bg-white rounded-[2rem] border border-slate-100 p-6 lg:p-8 max-h-[calc(100vh-180px)] overflow-y-auto lg:sticky lg:top-[140px]">
                    <h3 className="text-lg font-black text-slate-800 mb-4 uppercase tracking-tight">{passageTitle}</h3>
                    <div className="text-sm text-slate-600 leading-[1.8] whitespace-pre-wrap font-medium">
                        {passageText || (
                            <div className="text-center py-12 text-slate-400">
                                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                                <p className="font-bold">{t.no_questions || "Bu passage uchun savollar topilmadi"}</p>
                                <p className="text-xs mt-2">Supabase da ielts_reading_questions jadvaliga ma'lumot qo'shing</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Questions */}
                <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-2 mt-4 lg:mt-0">
                    {currentQuestions.length > 0 ? (
                        currentQuestions.map(q => renderQuestion(q))
                    ) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center text-slate-400">
                            <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold text-sm">{t.no_questions || "Savollar topilmadi"}</p>
                            <p className="text-xs mt-2">Passage {currentPassage} uchun savollarni Supabase ga yuklang</p>
                        </div>
                    )}

                    {/* Question number navigator */}
                    {questions.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 p-4">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.all_questions || "Barcha savollar"}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {questions.map(q => (
                                    <button key={q.questionNumber}
                                        onClick={() => { setCurrentPassage(q.passageNumber); }}
                                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${answers[q.questionNumber]?.trim()
                                                ? 'bg-indigo-600 text-white'
                                                : currentPassage === q.passageNumber
                                                    ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                                                    : 'bg-slate-50 text-slate-400'
                                            }`}>
                                        {q.questionNumber}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-amber-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{t.confirm_submit || "Topshirasizmi?"}</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                {answeredCount}/{questions.length} {t.questions_answered || "ta savolga javob berildi"}
                            </p>
                            {answeredCount < questions.length && (
                                <p className="text-xs text-amber-600 font-bold mt-2">
                                    ⚠️ {questions.length - answeredCount} {t.unanswered || "ta savol javobsiz"}
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)}
                                className="flex-1 py-3 font-black text-slate-400 text-xs uppercase">{t.cancel || "Bekor qilish"}</button>
                            <button onClick={handleSubmit}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> {t.submit || "Topshirish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IELTSReading;
