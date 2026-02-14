import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Headphones, Clock, Volume2, Play, Pause, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { IELTSListeningQuestion, IELTSExamType, IELTSQuestionType } from '../../types';
import { getListeningBandScore } from '../../services/ieltsGradingService';

interface IELTSListeningProps {
    t: any;
    questions: IELTSListeningQuestion[];
    examType: IELTSExamType;
    onComplete: (score: number, answers: Record<number, string>) => void;
    onBack: () => void;
}

const TOTAL_TIME = 30 * 60; // 30 daqiqa

const IELTSListening: React.FC<IELTSListeningProps> = ({ t, questions, examType, onComplete, onBack }) => {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [currentSection, setCurrentSection] = useState(1);
    const [timeLeft, setTimeLeft] = useState(() => {
        const saved = localStorage.getItem('ielts_listening_time');
        return saved ? parseInt(saved) : TOTAL_TIME;
    });
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Group by section
    const sections = useMemo(() => {
        const grouped: Record<number, IELTSListeningQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };
        questions.forEach(q => {
            if (grouped[q.sectionNumber]) grouped[q.sectionNumber].push(q);
        });
        Object.values(grouped).forEach(arr => arr.sort((a, b) => a.questionNumber - b.questionNumber));
        return grouped;
    }, [questions]);

    // Timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                const next = prev - 1;
                localStorage.setItem('ielts_listening_time', String(next));
                if (next <= 0) {
                    handleSubmit();
                    return 0;
                }
                return next;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleSubmit = useCallback(() => {
        if (isSubmitted) return;
        setIsSubmitted(true);
        if (timerRef.current) clearInterval(timerRef.current);
        localStorage.removeItem('ielts_listening_time');

        let correct = 0;
        questions.forEach(q => {
            const userAns = (answers[q.questionNumber] || '').trim().toLowerCase();
            const correctAns = q.correctAnswer.trim().toLowerCase();
            if (userAns === correctAns) correct++;
        });

        const bandScore = getListeningBandScore(correct);
        onComplete(bandScore, answers);
    }, [answers, questions, onComplete, isSubmitted]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const isUrgent = timeLeft < 300;
    const currentQuestions = sections[currentSection] || [];
    const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)]?.trim()).length;
    const sectionAudioUrl = currentQuestions[0]?.audioUrl;

    const setAnswer = (qNum: number, value: string) => {
        setAnswers(prev => ({ ...prev, [qNum]: value }));
    };

    const toggleAudio = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(() => { });
            }
            setIsPlaying(!isPlaying);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                            <ArrowLeft size={18} className="text-slate-400" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Headphones size={18} className="text-purple-600" />
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">IELTS Listening</h2>
                        </div>
                    </div>

                    <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-sm ${isUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-purple-50 text-purple-600'
                        }`}>
                        <Clock size={16} />
                        {formatTime(timeLeft)}
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                            {answeredCount}/{questions.length}
                        </span>
                        <button onClick={() => setShowSubmitConfirm(true)}
                            className="bg-purple-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-200">
                            {t.submit || 'Topshirish'}
                        </button>
                    </div>
                </div>

                {/* Section Navigation */}
                <div className="max-w-5xl mx-auto px-4 py-2 flex gap-2">
                    {[1, 2, 3, 4].map(s => {
                        const sQuestions = sections[s] || [];
                        const sAnswered = sQuestions.filter(q => answers[q.questionNumber]?.trim()).length;
                        return (
                            <button key={s} onClick={() => setCurrentSection(s)}
                                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${currentSection === s
                                        ? 'bg-purple-600 text-white shadow-md'
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}>
                                Section {s} ({sAnswered}/{sQuestions.length})
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 lg:py-6">
                {/* Audio Player */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] p-6 mb-6 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={toggleAudio}
                                className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all">
                                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <div>
                                <h3 className="font-black text-lg">{currentQuestions[0]?.sectionTitle || `Section ${currentSection}`}</h3>
                                <p className="text-purple-100 text-xs font-bold">{currentQuestions.length} {t.questions || 'savol'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Volume2 size={18} className="text-purple-200" />
                            <div className="w-32 h-1.5 bg-white/20 rounded-full">
                                <div className="w-0 h-full bg-white rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    {sectionAudioUrl && sectionAudioUrl !== 'placeholder' ? (
                        <audio ref={audioRef} src={sectionAudioUrl} onEnded={() => setIsPlaying(false)} />
                    ) : (
                        <div className="mt-4 bg-white/10 rounded-xl p-3 text-center">
                            <p className="text-xs font-bold text-purple-200">🎧 Audio placeholder — real audio keyinchalik qo'shiladi</p>
                        </div>
                    )}
                </div>

                {/* Questions */}
                <div className="space-y-4">
                    {currentQuestions.length > 0 ? currentQuestions.map(q => (
                        <div key={q.questionNumber} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-purple-200 transition-all">
                            <div className="flex items-start gap-3 mb-3">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${answers[q.questionNumber]?.trim() ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {q.questionNumber}
                                </span>
                                <p className="text-sm font-bold text-slate-700">{q.questionText}</p>
                            </div>

                            <div className="ml-11">
                                {q.questionType === IELTSQuestionType.MULTIPLE_CHOICE && q.options ? (
                                    <div className="space-y-2">
                                        {q.options.map((opt, i) => {
                                            const letter = String.fromCharCode(65 + i);
                                            return (
                                                <button key={i} onClick={() => setAnswer(q.questionNumber, letter)}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${answers[q.questionNumber] === letter
                                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                                            : 'bg-slate-50 text-slate-600 hover:bg-purple-50'
                                                        }`}>
                                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${answers[q.questionNumber] === letter ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                                        }`}>{letter}</span>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <input type="text" value={answers[q.questionNumber] || ''} onChange={e => setAnswer(q.questionNumber, e.target.value)}
                                        placeholder={t.type_answer || "Javobni yozing..."} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-bold focus:ring-2 focus:ring-purple-500" />
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center text-slate-400">
                            <Headphones size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold">{t.no_questions || "Savollar topilmadi"}</p>
                        </div>
                    )}
                </div>

                {/* Question Navigator */}
                {questions.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 mt-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.all_questions || "Barcha savollar"}</p>
                        <div className="flex flex-wrap gap-1.5">
                            {questions.map(q => (
                                <button key={q.questionNumber} onClick={() => setCurrentSection(q.sectionNumber)}
                                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${answers[q.questionNumber]?.trim()
                                            ? 'bg-purple-600 text-white'
                                            : currentSection === q.sectionNumber
                                                ? 'bg-purple-50 text-purple-600 border border-purple-200'
                                                : 'bg-slate-50 text-slate-400'
                                        }`}>
                                    {q.questionNumber}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Submit Modal */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-amber-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{t.confirm_submit || "Topshirasizmi?"}</h3>
                            <p className="text-sm text-slate-500 mt-2">{answeredCount}/{questions.length} javob berildi</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 font-black text-slate-400 text-xs uppercase">{t.cancel || "Bekor"}</button>
                            <button onClick={handleSubmit} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> {t.submit || "Topshirish"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IELTSListening;
