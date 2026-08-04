import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Headphones, Clock, Volume2, AlertTriangle, CheckCircle, ArrowLeft, Play } from 'lucide-react';
import { IELTSListeningQuestion, IELTSExamType, IELTSQuestionType } from '../../types';
import { getListeningBandScore } from '../../services/ieltsGradingService';
import {
    buildQuestionBlocks,
    isAnswerCorrect,
    exceedsWordLimit,
    optionLetter,
    optionLabel,
    parseOptions,
    LETTER_CHOICE_TYPES,
    COMPLETION_TYPES,
    QuestionBlock,
} from '../../services/ieltsQuestionBlocks';

interface IELTSListeningProps {
    t: any;
    questions: IELTSListeningQuestion[];
    examType: IELTSExamType;
    onComplete: (score: number, answers: Record<number, string>) => void;
    onBack: () => void;
}

/** Haqiqiy imtihonda yozuv tugagach javoblarni tekshirishga beriladigan vaqt (kompyuter varianti) */
const CHECK_TIME = 2 * 60;
/** Audio bo'lmagan (placeholder) testlar uchun eski tartib: 30 daqiqa */
const FALLBACK_TIME = 30 * 60;
/** Audio ishlamay qolsa ham imtihon cheksiz cho'zilmasligi uchun chegara */
const MAX_TIME = 45 * 60;

type Phase = 'ready' | 'playing' | 'check' | 'done';

const IELTSListening: React.FC<IELTSListeningProps> = ({ t, questions, examType, onComplete, onBack }) => {
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [currentSection, setCurrentSection] = useState(1);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [phase, setPhase] = useState<Phase>('ready');
    /** Ayni paytda ijro etilayotgan bo'lim — ko'rilayotgan bo'limdan farq qilishi mumkin */
    const [playingPart, setPlayingPart] = useState(1);
    const [elapsed, setElapsed] = useState(0);
    const [checkLeft, setCheckLeft] = useState(CHECK_TIME);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Bo'limlar bo'yicha guruhlash
    const sections = useMemo(() => {
        const grouped: Record<number, IELTSListeningQuestion[]> = { 1: [], 2: [], 3: [], 4: [] };
        questions.forEach(q => {
            if (grouped[q.sectionNumber]) grouped[q.sectionNumber].push(q);
        });
        Object.values(grouped).forEach(arr => arr.sort((a, b) => a.questionNumber - b.questionNumber));
        return grouped;
    }, [questions]);

    const audioFor = useCallback((section: number) => {
        const url = sections[section]?.[0]?.audioUrl;
        return url && url !== 'placeholder' ? url : null;
    }, [sections]);

    /** Testda haqiqiy audio bormi? Yo'q bo'lsa — eski (o'qituvchi o'zi o'qiydigan) tartib */
    const hasAudio = useMemo(() => [1, 2, 3, 4].some(s => audioFor(s)), [audioFor]);

    const handleSubmit = useCallback(() => {
        if (isSubmitted) return;
        setIsSubmitted(true);
        setPhase('done');
        if (timerRef.current) clearInterval(timerRef.current);
        if (audioRef.current) audioRef.current.pause();

        let correct = 0;
        questions.forEach(q => {
            if (isAnswerCorrect(answers[q.questionNumber] || '', q.correctAnswer)) correct++;
        });
        onComplete(getListeningBandScore(correct), answers);
    }, [answers, questions, onComplete, isSubmitted]);

    // handleSubmit har javob kiritilganda yangilanadi — soat undan qayta ishga tushmasligi uchun ref
    const submitRef = useRef(handleSubmit);
    useEffect(() => { submitRef.current = handleSubmit; }, [handleSubmit]);

    // Soat vaqt belgisiga (deadline) asoslanadi — interval kechiksa ham vaqt to'g'ri qoladi
    useEffect(() => {
        if (phase === 'ready' || phase === 'done') return;
        const startedAt = Date.now() - elapsed * 1000;
        const checkDeadline = Date.now() + CHECK_TIME * 1000;
        const limit = hasAudio ? MAX_TIME : FALLBACK_TIME;

        timerRef.current = setInterval(() => {
            if (phase === 'check') {
                const left = Math.max(0, Math.round((checkDeadline - Date.now()) / 1000));
                setCheckLeft(left);
                if (left <= 0) submitRef.current();
            } else {
                const passed = Math.floor((Date.now() - startedAt) / 1000);
                setElapsed(passed);
                // Audio yo'q bo'lsa 30 daqiqadan keyin, bor bo'lsa 45 daqiqadan keyin majburiy yakun
                if (passed >= limit) submitRef.current();
            }
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [phase, hasAudio]);

    /** Bo'lim tugadi — keyingisiga o'tadi, oxirgisidan keyin tekshirish vaqti boshlanadi */
    const advancePart = useCallback(() => {
        setPlayingPart(prev => {
            const next = prev + 1;
            if (next > 4 || !audioFor(next)) {
                setPhase('check');
                return prev;
            }
            setCurrentSection(next);
            return next;
        });
    }, [audioFor]);

    // Yozuvni ijro etish — FAQAT bir marta, to'xtatib yoki qaytarib bo'lmaydi
    useEffect(() => {
        if (phase !== 'playing') return;
        const url = audioFor(playingPart);
        if (!url) { advancePart(); return; }
        const el = audioRef.current;
        if (!el) return;
        el.src = url;
        el.play().catch(() => { /* brauzer to'sib qo'ysa, foydalanuvchi qayta boshlaydi */ });
    }, [phase, playingPart, audioFor, advancePart]);

    const startTest = () => {
        setPhase('playing');
        setPlayingPart(1);
        setCurrentSection(1);
    };

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    const currentQuestions = sections[currentSection] || [];
    const currentBlocks = useMemo(() => buildQuestionBlocks(currentQuestions), [sections, currentSection]);
    const answeredCount = Object.keys(answers).filter(k => answers[parseInt(k)]?.trim()).length;

    const setAnswer = (qNum: number, value: string) => {
        setAnswers(prev => ({ ...prev, [qNum]: value }));
    };

    // ---- Boshlanish ekrani: haqiqiy imtihon qoidalari ----
    if (phase === 'ready') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] border border-slate-100 p-8 max-w-lg w-full shadow-xl">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-sm font-bold">
                        <ArrowLeft size={16} /> {t.back || 'Orqaga'}
                    </button>
                    <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                        <Headphones size={32} className="text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 mb-2">IELTS Listening</h2>
                    <p className="text-sm text-slate-500 font-medium mb-6">{questions.length} {t.questions || 'savol'} · 4 {t.parts || 'bo\'lim'}</p>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 space-y-2">
                        <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">
                            {t.exam_rules || 'Imtihon qoidalari'}
                        </p>
                        {hasAudio ? (
                            <>
                                <p className="text-sm text-slate-700 font-medium">• Yozuv <b>faqat bir marta</b> qo'yiladi.</p>
                                <p className="text-sm text-slate-700 font-medium">• Uni <b>to'xtatib yoki qaytarib bo'lmaydi</b>.</p>
                                <p className="text-sm text-slate-700 font-medium">• 4 ta bo'lim ketma-ket, to'xtovsiz ijro etiladi.</p>
                                <p className="text-sm text-slate-700 font-medium">• Yozuv tugagach javoblarni tekshirish uchun <b>2 daqiqa</b> beriladi.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-slate-700 font-medium">• Bu testda audio yo'q — o'qituvchi transkriptni ovoz chiqarib o'qiydi.</p>
                                <p className="text-sm text-slate-700 font-medium">• Jami vaqt: 30 daqiqa.</p>
                            </>
                        )}
                    </div>

                    <button onClick={startTest}
                        className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-2">
                        <Play size={18} /> {t.start || 'Boshlash'}
                    </button>
                </div>
            </div>
        );
    }

    const renderQuestion = (q: IELTSListeningQuestion, block: QuestionBlock<IELTSListeningQuestion>) => {
        const value = answers[q.questionNumber] || '';
        const isLetterChoice = LETTER_CHOICE_TYPES.includes(q.questionType);
        const isCompletion = COMPLETION_TYPES.includes(q.questionType);
        const wordLimit = block.wordLimit || '';
        const overLimit = isCompletion && exceedsWordLimit(value, wordLimit);

        return (
            <div key={q.questionNumber} className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-purple-200 transition-all">
                <div className="flex items-start gap-3 mb-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 ${value.trim() ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                        }`}>
                        {q.questionNumber}
                    </span>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{q.questionText}</p>
                </div>

                <div className="ml-11">
                    {q.questionType === IELTSQuestionType.MULTIPLE_CHOICE && q.options ? (
                        <div className="space-y-2">
                            {parseOptions(q.options).items.map((opt, i) => {
                                const letter = optionLetter(opt, i);
                                return (
                                    <button key={i} onClick={() => setAnswer(q.questionNumber, letter)}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-3 ${value === letter
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                            : 'bg-slate-50 text-slate-600 hover:bg-purple-50'
                                            }`}>
                                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0 ${value === letter ? 'bg-white/20 text-white' : 'bg-white text-slate-400 border border-slate-200'
                                            }`}>{letter}</span>
                                        {optionLabel(opt)}
                                    </button>
                                );
                            })}
                        </div>
                    ) : isLetterChoice && block.options.length > 0 ? (
                        <div className="flex gap-2 flex-wrap">
                            {block.options.map((opt, i) => {
                                const letter = optionLetter(opt, i);
                                return (
                                    <button key={letter} onClick={() => setAnswer(q.questionNumber, letter)}
                                        title={optionLabel(opt)}
                                        className={`w-11 h-11 rounded-xl text-sm font-black transition-all ${value === letter
                                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                                            : 'bg-slate-50 text-slate-500 hover:bg-purple-50'
                                            }`}>
                                        {letter}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            <input type="text" value={value} onChange={e => setAnswer(q.questionNumber, e.target.value)}
                                placeholder={wordLimit || t.type_answer || 'Javobni yozing...'}
                                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none text-sm font-bold focus:ring-2 ${overLimit ? 'border-amber-300 focus:ring-amber-500' : 'border-slate-200 focus:ring-purple-500'
                                    }`} />
                            {overLimit && (
                                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wide mt-1.5">
                                    ⚠️ {wordLimit} — {t.word_limit_exceeded || "so'z chegarasidan oshdi"}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Yozuv — bitta element, boshqaruv tugmalarisiz (imtihon sharti) */}
            <audio ref={audioRef} onEnded={advancePart} onError={advancePart} />

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

                    {phase === 'check' ? (
                        <div className="flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-sm bg-red-50 text-red-600 animate-pulse">
                            <Clock size={16} /> {formatTime(checkLeft)} — {t.check_answers || 'tekshiring'}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-sm bg-purple-50 text-purple-600">
                            <Volume2 size={16} /> {hasAudio ? `Part ${playingPart}/4` : formatTime(FALLBACK_TIME - elapsed)}
                        </div>
                    )}

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

                {/* Bo'limlar — ijro etilayotgani belgilanadi */}
                <div className="max-w-5xl mx-auto px-4 py-2 flex gap-2">
                    {[1, 2, 3, 4].map(s => {
                        const sQuestions = sections[s] || [];
                        const sAnswered = sQuestions.filter(q => answers[q.questionNumber]?.trim()).length;
                        const isLive = hasAudio && phase === 'playing' && playingPart === s;
                        return (
                            <button key={s} onClick={() => setCurrentSection(s)}
                                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${currentSection === s
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}>
                                {isLive && '🔊 '}Part {s} ({sAnswered}/{sQuestions.length})
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="max-w-5xl mx-auto p-4 lg:py-6">
                {/* Holat paneli — boshqaruvsiz, faqat ma'lumot */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-[2rem] p-6 mb-6 text-white">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-black text-lg">
                                {sections[playingPart]?.[0]?.sectionTitle || `Part ${playingPart}`}
                            </h3>
                            <p className="text-purple-100 text-xs font-bold mt-1">
                                {phase === 'check'
                                    ? (t.recording_finished || 'Yozuv tugadi — javoblaringizni tekshiring')
                                    : hasAudio
                                        ? (t.playing_once || 'Yozuv ijro etilmoqda — bir marta, to\'xtatib bo\'lmaydi')
                                        : (t.no_audio_teacher || 'Audio yo\'q — o\'qituvchi transkriptni o\'qiydi')}
                            </p>
                        </div>
                        {phase === 'playing' && hasAudio && (
                            <div className="flex items-end gap-1 h-8" aria-hidden>
                                {[0, 1, 2, 3, 4].map(i => (
                                    <span key={i} className="w-1.5 bg-white/70 rounded-full animate-pulse"
                                        style={{ height: `${12 + ((i * 7) % 20)}px`, animationDelay: `${i * 120}ms` }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Savollar — bloklarga bo'lingan, rasmiy ko'rsatmalar bilan */}
                <div className="space-y-4">
                    {currentBlocks.length > 0 ? currentBlocks.map(block => (
                        <div key={`${block.questionType}-${block.firstNumber}`} className="space-y-3">
                            <div className="bg-purple-50/60 border border-purple-100 rounded-2xl p-5">
                                <p className="text-xs font-black text-purple-600 uppercase tracking-widest mb-2">{block.rangeLabel}</p>
                                {block.instructions.map((line, i) => (
                                    <p key={i} className={`text-sm leading-relaxed ${i === 0 ? 'font-bold text-slate-700' : 'text-slate-600'}`}>{line}</p>
                                ))}
                                {block.repeatNote && (
                                    <p className="text-xs font-bold text-slate-500 italic mt-2">NB You may use any letter more than once.</p>
                                )}
                                {/* Xarita / plan / diagramma */}
                                {block.image && (
                                    <img src={block.image} alt="Map or plan" className="w-full mt-3 rounded-xl border border-purple-100 bg-white"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                )}
                                {block.options.some((o, i) => optionLabel(o) !== optionLetter(o, i)) && (
                                    <div className="mt-3 bg-white rounded-xl border border-purple-100 p-3 space-y-1">
                                        {block.options.map((opt, i) => (
                                            <p key={i} className="text-sm font-bold text-slate-700">
                                                <span className="text-purple-600">{optionLetter(opt, i)}</span>{'  '}{optionLabel(opt)}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {block.questions.map(q => renderQuestion(q, block))}
                        </div>
                    )) : (
                        <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center text-slate-400">
                            <Headphones size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="font-bold">{t.no_questions || 'Savollar topilmadi'}</p>
                        </div>
                    )}
                </div>

                {questions.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-100 p-4 mt-6">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{t.all_questions || 'Barcha savollar'}</p>
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

            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={32} className="text-amber-600" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">{t.confirm_submit || 'Topshirasizmi?'}</h3>
                            <p className="text-sm text-slate-500 mt-2">{answeredCount}/{questions.length} javob berildi</p>
                            {phase === 'playing' && hasAudio && (
                                <p className="text-xs font-bold text-amber-600 mt-2">
                                    ⚠️ Yozuv hali tugamadi — topshirsangiz qolgan bo'limlarni eshitolmaysiz.
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 py-3 font-black text-slate-400 text-xs uppercase">{t.cancel || 'Bekor'}</button>
                            <button onClick={handleSubmit} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-2">
                                <CheckCircle size={16} /> {t.submit || 'Topshirish'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IELTSListening;
