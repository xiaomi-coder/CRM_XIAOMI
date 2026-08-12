import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Clock, ArrowLeft, Play, Square, ChevronRight, AlertTriangle, Loader2, Sparkles, Volume2 } from 'lucide-react';
import { IELTSSpeakingQuestion, IELTSSpeakingScore } from '../../types';
import { gradeSpeaking, calculateSpeakingOverall } from '../../services/ieltsGradingService';

interface IELTSSpeakingProps {
    t: any;
    questions: IELTSSpeakingQuestion[];
    onComplete: (score: number, data: { scores?: IELTSSpeakingScore }) => void;
    onBack: () => void;
    apiKey?: string;
}

type SpeakingPhase = 'intro' | 'part1' | 'part2-prep' | 'part2-speak' | 'part2-followup' | 'part3' | 'grading' | 'done';

/**
 * Rasmiy IELTS Speaking vaqtlari (jami 11–14 daqiqa):
 *   Part 1  — 4–5 daqiqa tanishuv savollari
 *   Part 2  — 1 daqiqa tayyorgarlik + 2 daqiqa gapirish + 1–2 qo'shimcha savol
 *   Part 3  — 4–5 daqiqa muhokama
 * Imtihonda vaqt tugaganda imtihonchi keyingi qismga o'tadi — bu yerda ham shunday.
 */
const PART_SECONDS: Record<string, number> = {
    part1: 5 * 60,
    'part2-prep': 60,
    'part2-speak': 120,
    'part2-followup': 60,
    part3: 5 * 60,
};

const IELTSSpeaking: React.FC<IELTSSpeakingProps> = ({ t, questions, onComplete, onBack, apiKey }) => {
    const [phase, setPhase] = useState<SpeakingPhase>('intro');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isGrading, setIsGrading] = useState(false);
    const [scores, setScores] = useState<IELTSSpeakingScore | null>(null);
    const [recordingSupported, setRecordingSupported] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Savollarni part bo'yicha guruhlash
    const part1Questions = questions.filter(q => q.partNumber === 1);
    const part2Questions = questions.filter(q => q.partNumber === 2);
    const part3Questions = questions.filter(q => q.partNumber === 3);

    const getCurrentPartQuestions = () => {
        if (phase === 'part1') return part1Questions;
        if (phase === 'part2-prep' || phase === 'part2-speak' || phase === 'part2-followup') return part2Questions;
        if (phase === 'part3') return part3Questions;
        return [];
    };

    const currentPartQuestions = getCurrentPartQuestions();
    const currentQuestion = currentPartQuestions[currentQuestionIdx];

    // Check MediaRecorder support
    useEffect(() => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setRecordingSupported(false);
        }
    }, []);

    /** Vaqt tugaganda nima bo'lishi — har renderda yangilanadi, soat esa qayta boshlanmaydi */
    const onTimeUpRef = useRef<() => void>(() => { });

    // Har qism o'z vaqti bilan boshlanadi; soat vaqt belgisiga asoslangan (kechikmaydi)
    useEffect(() => {
        const seconds = PART_SECONDS[phase];
        if (!seconds) { setTimeLeft(0); return; }
        const deadline = Date.now() + seconds * 1000;
        setTimeLeft(seconds);
        timerRef.current = setInterval(() => {
            const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
            setTimeLeft(left);
            if (left <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                onTimeUpRef.current();
            }
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlobs(prev => [...prev, blob]);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (e) {
            console.error('Recording error:', e);
            setRecordingSupported(false);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };

    const handleStartPart1 = () => {
        setPhase('part1');
        setCurrentQuestionIdx(0);
    };

    /** Part 2 uzun javobi tugadi — qo'shimcha savollar bo'lsa ularga, bo'lmasa Part 3 ga */
    const afterLongTurn = useCallback(() => {
        stopRecording();
        if (part2Questions.length > 1) {
            setPhase('part2-followup');
            setCurrentQuestionIdx(1);
        } else {
            setPhase('part3');
            setCurrentQuestionIdx(0);
        }
    }, [part2Questions.length]);

    const handleStartPart2Speaking = () => {
        setPhase('part2-speak');
        setCurrentQuestionIdx(0);
        startRecording();
    };

    const handleNextQuestion = () => {
        if (isRecording) stopRecording();
        const partQuestions = getCurrentPartQuestions();

        // Qism ichida keyingi savol bormi?
        if (phase !== 'part2-speak' && currentQuestionIdx < partQuestions.length - 1) {
            setCurrentQuestionIdx(prev => prev + 1);
            return;
        }

        // Keyingi qismga o'tish
        if (phase === 'part1') {
            setPhase('part2-prep');
            setCurrentQuestionIdx(0);
        } else if (phase === 'part2-speak') {
            afterLongTurn();
        } else if (phase === 'part2-followup') {
            setPhase('part3');
            setCurrentQuestionIdx(0);
        } else if (phase === 'part3') {
            handleFinalSubmit();
        }
    };

    const handleFinalSubmit = useCallback(async () => {
        if (isRecording) stopRecording();
        setPhase('grading');
        setIsGrading(true);

        try {
            // Combine all audio blobs
            const combinedBlob = new Blob(audioBlobs, { type: 'audio/webm' });

            if (combinedBlob.size > 100) {
                const result = await gradeSpeaking(combinedBlob, 1, currentQuestion?.questionText || 'General speaking assessment', apiKey);
                setScores(result);
                const overall = calculateSpeakingOverall(result.fluencyCoherence, result.lexicalResource, result.grammaticalRange, result.pronunciation);
                onComplete(overall, { scores: result });
            } else {
                // No audio recorded — give placeholder score
                const fallback: IELTSSpeakingScore = {
                    fluencyCoherence: 5, lexicalResource: 5, grammaticalRange: 5, pronunciation: 5,
                    overallBand: 5, transcription: 'Audio yozilmadi', feedback: 'Baholash uchun audio talab qilinadi',
                    suggestions: ['Microfonni tekshiring', 'Qayta urinib ko\'ring']
                };
                setScores(fallback);
                onComplete(5, { scores: fallback });
            }
        } catch (e) {
            console.error('Speaking grading error:', e);
            onComplete(5, {});
        }

        setIsGrading(false);
        setPhase('done');
    }, [audioBlobs, currentQuestion, onComplete, isRecording]);

    // Vaqt tugaganda imtihonchi kabi keyingi qismga o'tiladi
    useEffect(() => {
        onTimeUpRef.current = () => {
            if (phase === 'part1') { setPhase('part2-prep'); setCurrentQuestionIdx(0); }
            else if (phase === 'part2-prep') handleStartPart2Speaking();
            else if (phase === 'part2-speak') afterLongTurn();
            else if (phase === 'part2-followup') { setPhase('part3'); setCurrentQuestionIdx(0); }
            else if (phase === 'part3') handleFinalSubmit();
        };
    });

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    // ========== RENDER ==========

    if (!recordingSupported) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] p-10 max-w-md text-center shadow-xl border border-slate-100">
                    <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MicOff size={36} className="text-red-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-3">{t.mic_not_supported || "Mikrofon qo'llab-quvvatlanmaydi"}</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        {t.mic_not_supported_desc || "Bu qurilma yoki brauzer audio yozishni qo'llab-quvvatlamaydi. Chrome yoki Firefox brauzerida urinib ko'ring."}
                    </p>
                    <button onClick={() => onComplete(0, {})} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase">
                        {t.skip || "O'tkazib yuborish"}
                    </button>
                </div>
            </div>
        );
    }

    // Intro screen
    if (phase === 'intro') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-lg w-full">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-sm font-bold">
                        <ArrowLeft size={18} /> {t.back || 'Ortga'}
                    </button>
                    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-200">
                            <Mic size={40} className="text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">IELTS Speaking</h2>
                        <p className="text-slate-500 text-sm mb-8">3 ta qism, 11-14 daqiqa</p>

                        <div className="space-y-3 text-left mb-8">
                            {[
                                { part: 'Part 1', desc: 'Introduction — tanishuv savollari', time: '5 min' },
                                { part: 'Part 2', desc: 'Cue Card — 1 min tayyorlanish, 2 min gapirish, so\'ng qisqa qo\'shimcha savollar', time: '4 min' },
                                { part: 'Part 3', desc: 'Discussion — chuqur muhokama', time: '5 min' },
                            ].map(p => (
                                <div key={p.part} className="flex items-center gap-4 bg-slate-50 rounded-2xl p-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-black text-xs">{p.part}</div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-700">{p.desc}</p>
                                        <p className="text-[10px] text-slate-400 font-bold">{p.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button onClick={handleStartPart1}
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-amber-200 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                            <Mic size={20} /> {t.start || "Boshlash"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Grading
    if (phase === 'grading') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl text-center">
                    <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles size={36} className="text-amber-600 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-2">AI Baholash</h3>
                    <p className="text-sm text-slate-500 mb-4">Speaking natijangiz baholanmoqda...</p>
                    <Loader2 className="animate-spin text-amber-600 mx-auto" size={24} />
                    <p className="text-[10px] text-slate-400 mt-4">15-45 soniya davom etishi mumkin</p>
                </div>
            </div>
        );
    }

    // Main speaking view (Part 1, 2, 3)
    const partLabel = phase === 'part1' ? 'Part 1' : phase.startsWith('part2') ? 'Part 2' : 'Part 3';
    // ⚠️ Klass nomlari TO'LIQ yozilishi shart. Avval `bg-${partColor}-50` kabi
    // yig'ib yasalardi — Tailwind CDN buni ishlayotgan sahifadan ko'rgani uchun
    // ishlardi, build vaqtida esa manbadan qidiriladi va topilmaydi (rang yo'q bo'lib qolardi).
    const PART_TONE = {
        part1: { chip: 'bg-amber-50 text-amber-600', badge: 'bg-amber-100 text-amber-600' },
        part2: { chip: 'bg-orange-50 text-orange-600', badge: 'bg-orange-100 text-orange-600' },
        part3: { chip: 'bg-red-50 text-red-600', badge: 'bg-red-100 text-red-600' },
    } as const;
    const partTone = phase === 'part1' ? PART_TONE.part1 : phase.startsWith('part2') ? PART_TONE.part2 : PART_TONE.part3;
    const phaseHint = phase === 'part2-followup'
        ? (t.rounding_off || 'Qisqa qo\'shimcha savollar')
        : phase === 'part2-speak'
            ? (t.long_turn || '2 daqiqa gapiring')
            : '';

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Top Bar */}
            <div className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Mic size={18} className="text-amber-600" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Speaking — {partLabel}</h2>
                        {phaseHint && <span className="text-[10px] font-black text-slate-400 uppercase">{phaseHint}</span>}
                    </div>
                    {timeLeft > 0 && (
                        <div className={`flex items-center gap-2 px-5 py-2 rounded-2xl font-black text-sm ${timeLeft < 15 ? 'bg-red-50 text-red-600 animate-pulse' : partTone.chip
                            }`}>
                            <Clock size={16} />
                            {formatTime(timeLeft)}
                        </div>
                    )}
                    {isRecording && (
                        <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-xl">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-red-600 uppercase">Recording</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 py-8">
                {/* Part 2 Preparation */}
                {phase === 'part2-prep' && currentQuestion && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 mb-6 text-center">
                        <div className="bg-amber-50 rounded-2xl p-6 mb-6 border border-amber-100">
                            <h3 className="font-black text-lg text-slate-800 mb-4">{currentQuestion.cueCardTopic || currentQuestion.questionText}</h3>
                            {currentQuestion.cueCardPoints && (
                                <div className="text-left space-y-2">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">You should say:</p>
                                    {currentQuestion.cueCardPoints.map((point, i) => (
                                        <p key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                            {point}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-sm font-bold text-amber-600 mb-4">⏳ Tayyorlanish vaqti — {formatTime(timeLeft)}</p>
                        <button onClick={handleStartPart2Speaking}
                            className="bg-amber-600 text-white px-8 py-3 rounded-xl font-black text-xs uppercase shadow-lg hover:bg-amber-700 transition-all">
                            <Mic size={14} className="inline mr-2" /> Gapirish boshlash
                        </button>
                    </div>
                )}

                {/* Question Display */}
                {currentQuestion && phase !== 'part2-prep' && (
                    <div className="bg-white rounded-[2rem] border border-slate-100 p-8 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 ${partTone.badge} rounded-xl flex items-center justify-center font-black text-xs`}>
                                Q{currentQuestionIdx + 1}
                            </div>
                            <h3 className="text-lg font-black text-slate-800">{currentQuestion.questionText}</h3>
                        </div>

                        {/* Part 2 Speaking - Cue card */}
                        {phase === 'part2-speak' && currentQuestion.cueCardPoints && (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 mb-4">
                                {currentQuestion.cueCardPoints.map((point, i) => (
                                    <p key={i} className="text-sm text-slate-600 flex items-start gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                        {point}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Recording Controls */}
                <div className="flex justify-center gap-4">
                    {!isRecording ? (
                        <button onClick={startRecording}
                            className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-red-200 hover:scale-105 transition-all">
                            <Mic size={32} />
                        </button>
                    ) : (
                        <button onClick={stopRecording}
                            className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl hover:scale-105 transition-all animate-pulse">
                            <Square size={28} />
                        </button>
                    )}
                </div>

                {/* Audio recorded indicator */}
                {audioBlobs.length > 0 && (
                    <div className="text-center mt-4">
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                            ✓ {audioBlobs.length} audio yozildi
                        </span>
                    </div>
                )}

                {/* Next / Submit button */}
                <div className="flex justify-center mt-8">
                    <button onClick={handleNextQuestion}
                        className="bg-slate-900 text-white px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-xl">
                        {phase === 'part3' && currentQuestionIdx >= (currentPartQuestions.length - 1)
                            ? <><Sparkles size={16} /> {t.finish || "Yakunlash"}</>
                            : <>{t.next_question || "Keyingi savol"} <ChevronRight size={16} /></>
                        }
                    </button>
                </div>

                {/* Questions list */}
                {currentPartQuestions.length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl border border-slate-100 p-4">
                        <div className="flex flex-wrap gap-2">
                            {currentPartQuestions.map((_, i) => (
                                <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${i === currentQuestionIdx ? 'bg-amber-600 text-white' : i < currentQuestionIdx ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {i + 1}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No questions fallback */}
                {currentPartQuestions.length === 0 && phase !== 'done' && (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 mt-6">
                        <AlertTriangle size={48} className="mx-auto mb-4 text-amber-300" />
                        <p className="font-bold text-slate-600">{partLabel} uchun savollar topilmadi</p>
                        <p className="text-xs text-slate-400 mt-2">Supabase ga ielts_speaking_questions jadvaliga ma'lumot qo'shing</p>
                        <button onClick={handleNextQuestion} className="mt-4 bg-slate-900 text-white px-8 py-2 rounded-xl text-xs font-black uppercase">
                            {t.skip || "O'tkazib yuborish"} →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default IELTSSpeaking;
