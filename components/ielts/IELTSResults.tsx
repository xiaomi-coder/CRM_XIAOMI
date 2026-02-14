import React from 'react';
import { Trophy, ArrowLeft, Download, Star, TrendingUp, BookOpen, Headphones, PenTool, Mic, Award, Share2 } from 'lucide-react';
import { IELTSAttempt } from '../../types';
import { bandToCEFR, getBandDescription } from '../../services/ieltsGradingService';

interface IELTSResultsProps {
    t: any;
    attempt: IELTSAttempt;
    onBack: () => void;
}

const IELTSResults: React.FC<IELTSResultsProps> = ({ t, attempt, onBack }) => {
    const overall = attempt.overallScore || 0;
    const cefr = bandToCEFR(overall);
    const description = getBandDescription(overall);

    const sections = [
        { key: 'reading', label: 'Reading', score: attempt.readingScore || 0, icon: BookOpen, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
        { key: 'listening', label: 'Listening', score: attempt.listeningScore || 0, icon: Headphones, color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50' },
        { key: 'writing', label: 'Writing', score: attempt.writingScore || 0, icon: PenTool, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50' },
        { key: 'speaking', label: 'Speaking', score: attempt.speakingScore || 0, icon: Mic, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
    ];

    const getBandColor = (band: number) => {
        if (band >= 7.0) return 'text-emerald-600';
        if (band >= 5.5) return 'text-blue-600';
        if (band >= 4.0) return 'text-amber-600';
        return 'text-red-600';
    };

    const getCEFRColor = (level: string) => {
        if (level === 'C2' || level === 'C1') return 'bg-emerald-100 text-emerald-700';
        if (level === 'B2') return 'bg-blue-100 text-blue-700';
        if (level === 'B1') return 'bg-amber-100 text-amber-700';
        return 'bg-red-100 text-red-700';
    };

    const handleShare = async () => {
        const text = `🎓 IELTS Mock Exam Result\n\n📊 Overall Band: ${overall}\n📖 Reading: ${attempt.readingScore || '-'}\n🎧 Listening: ${attempt.listeningScore || '-'}\n✍️ Writing: ${attempt.writingScore || '-'}\n🎤 Speaking: ${attempt.speakingScore || '-'}\n\n🏆 CEFR: ${cefr}\n📝 ${description}`;

        if (navigator.share) {
            try {
                await navigator.share({ title: 'IELTS Mock Exam Result', text });
            } catch (e) { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(text);
            alert(t.copied || 'Nusxa olindi!');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-sm font-bold">
                    <ArrowLeft size={18} /> {t.back || 'Ortga'}
                </button>

                {/* Hero Score */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[3rem] p-10 md:p-16 text-white text-center relative overflow-hidden mb-8">
                    {/* Decorative elements */}
                    <div className="absolute top-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-60 h-60 bg-purple-500/10 rounded-full translate-x-1/3 translate-y-1/3"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-200">IELTS Mock Exam Result</span>
                        </div>

                        <h1 className="text-4xl font-black mb-2 tracking-tight">{attempt.studentName}</h1>
                        <p className="text-indigo-300 text-sm font-bold mb-8 uppercase">{attempt.examType === 'academic' ? 'Academic' : 'General Training'}</p>

                        {/* Overall Band Circle */}
                        <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 mb-6 relative">
                            <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
                                <div>
                                    <p className="text-5xl font-black tracking-tighter">{overall.toFixed(1)}</p>
                                    <p className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-300">Overall Band</p>
                                </div>
                            </div>
                        </div>

                        {/* CEFR Badge */}
                        <div className="inline-flex items-center gap-3">
                            <span className={`px-5 py-2 rounded-xl text-sm font-black ${getCEFRColor(cefr)}`}>{cefr}</span>
                            <span className="text-indigo-200 text-sm font-bold">{description}</span>
                        </div>
                    </div>
                </div>

                {/* Section Scores Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {sections.map(s => {
                        const Icon = s.icon;
                        return (
                            <div key={s.key} className="bg-white rounded-[2rem] border border-slate-100 p-6 text-center hover:shadow-xl transition-all group">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <Icon size={20} />
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{s.label}</p>
                                <p className={`text-3xl font-black ${getBandColor(s.score)}`}>{s.score.toFixed(1)}</p>
                                <p className="text-[9px] font-bold text-slate-300 mt-1">{bandToCEFR(s.score)}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Radar-style visual (simplified bar chart) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-8">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6">{t.score_breakdown || "Ball taqsimoti"}</h3>
                    <div className="space-y-4">
                        {sections.map(s => (
                            <div key={s.key} className="flex items-center gap-4">
                                <span className="w-24 text-xs font-black text-slate-500 text-right">{s.label}</span>
                                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                    <div className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all duration-1000 ease-out`}
                                        style={{ width: `${(s.score / 9) * 100}%` }}>
                                    </div>
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">
                                        {s.score.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Writing Detailed Feedback */}
                {(attempt.writingTask1Scores || attempt.writingTask2Scores) && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <PenTool size={16} className="text-emerald-600" /> Writing — Batafsil baholash
                        </h3>

                        {[
                            { label: 'Task 1', scores: attempt.writingTask1Scores },
                            { label: 'Task 2', scores: attempt.writingTask2Scores }
                        ].filter(t => t.scores).map(task => (
                            <div key={task.label} className="mb-6 last:mb-0">
                                <h4 className="text-xs font-black text-indigo-600 uppercase mb-3">{task.label} — Band {task.scores!.overallBand}</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    {[
                                        { label: 'Task Achievement', score: task.scores!.taskAchievement },
                                        { label: 'Coherence', score: task.scores!.coherenceCohesion },
                                        { label: 'Lexical Resource', score: task.scores!.lexicalResource },
                                        { label: 'Grammar', score: task.scores!.grammaticalRange }
                                    ].map(c => (
                                        <div key={c.label} className="bg-emerald-50 rounded-xl p-3 text-center">
                                            <p className="text-[8px] font-black text-emerald-600 uppercase mb-1">{c.label}</p>
                                            <p className="text-xl font-black text-emerald-700">{c.score}</p>
                                        </div>
                                    ))}
                                </div>
                                {task.scores!.feedback && (
                                    <div className="bg-slate-50 rounded-xl p-4 mb-3">
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{task.scores!.feedback}</p>
                                    </div>
                                )}
                                {task.scores!.suggestions && task.scores!.suggestions.length > 0 && (
                                    <div className="space-y-1">
                                        {task.scores!.suggestions.map((s, i) => (
                                            <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                                                <TrendingUp size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span>{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Speaking Detailed Feedback */}
                {attempt.speakingScores && (
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 mb-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Mic size={16} className="text-amber-600" /> Speaking — Batafsil baholash
                        </h3>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                            {[
                                { label: 'Fluency & Coherence', score: attempt.speakingScores.fluencyCoherence },
                                { label: 'Lexical Resource', score: attempt.speakingScores.lexicalResource },
                                { label: 'Grammar', score: attempt.speakingScores.grammaticalRange },
                                { label: 'Pronunciation', score: attempt.speakingScores.pronunciation }
                            ].map(c => (
                                <div key={c.label} className="bg-amber-50 rounded-xl p-3 text-center">
                                    <p className="text-[8px] font-black text-amber-600 uppercase mb-1">{c.label}</p>
                                    <p className="text-xl font-black text-amber-700">{c.score}</p>
                                </div>
                            ))}
                        </div>
                        {attempt.speakingScores.feedback && (
                            <div className="bg-slate-50 rounded-xl p-4 mb-3">
                                <p className="text-xs font-bold text-slate-600 leading-relaxed">{attempt.speakingScores.feedback}</p>
                            </div>
                        )}
                        {attempt.speakingScores.transcription && (
                            <div className="bg-indigo-50 rounded-xl p-4">
                                <p className="text-[9px] font-black text-indigo-500 uppercase mb-2">Transkripsiya</p>
                                <p className="text-xs text-slate-600">{attempt.speakingScores.transcription}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4 justify-center mb-12">
                    <button onClick={handleShare}
                        className="flex items-center gap-2 bg-white border border-slate-200 px-8 py-3 rounded-2xl text-xs font-black text-slate-600 uppercase hover:border-indigo-300 transition-all shadow-sm">
                        <Share2 size={16} /> {t.share || "Ulashish"}
                    </button>
                    <button onClick={onBack}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all">
                        <Award size={16} /> {t.done || "Tayyor"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IELTSResults;
