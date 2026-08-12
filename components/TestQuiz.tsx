
import React, { useState, useEffect } from 'react';
import { Lead, TestTemplate, Question } from '../types';
import { Clock, CheckCircle, BrainCircuit, AlertCircle, ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { db } from '../services/supabase';

interface TestQuizProps {
  t: any;
  lead: Lead;
  template: TestTemplate;
  onComplete: (score: number) => void;
  onLogout: () => void;
}

const TestQuiz: React.FC<TestQuizProps> = ({ t, lead, template, onComplete, onLogout }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeLeft, setTimeLeft] = useState(template.durationMinutes * 60);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleFinish = async () => {
    let correct = 0;
    template.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) correct++;
    });
    const score = Math.round((correct / template.questions.length) * 100);

    // Bazada lid statusini yangilash
    await db.update('leads', lead.id, {
      testScore: score,
      testStatus: 'COMPLETED'
    });

    setIsFinished(true);
    onComplete(score);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-center">
        <div className="bg-white/95 backdrop-blur-2xl p-12 rounded-[3.5rem] shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase italic tracking-tighter leading-none">{t.test_completed || 'Test Completed!'}</h2>
          <p className="text-slate-500 font-bold mb-8 uppercase text-[10px] tracking-widest">{t.test_result_sent || 'Your result has been sent to staff'}</p>

          <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] mb-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 rotate-12"><BrainCircuit size={100} /></div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">{t.score || 'Score'}</p>
            <h3 className="text-6xl font-black italic tracking-tighter text-emerald-400">{Math.round((Object.values(answers).filter((v, i) => v === template.questions[i].correctAnswer).length / template.questions.length) * 100)}%</h3>
          </div>

          <button onClick={onLogout} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all">
            {t.uz === "Kutubxona" ? "Chiqish" : (t.ru === "Библиотека" ? "Выйти" : "Logout")}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = template.questions[currentQuestionIdx];
  const optionLetters = ['a', 'b', 'c', 'd'];

  return (
    <div className="min-h-screen bg-[#f8f9fc] p-6 lg:p-12">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg"><BrainCircuit className="text-white" size={28} /></div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{template.title}</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{lead.name} • Online Test</p>
            </div>
          </div>

          <div className={`px-8 py-4 rounded-3xl flex items-center gap-4 shadow-inner transition-colors ${timeLeft < 60 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-900 text-white'}`}>
            <Clock size={24} className={timeLeft < 60 ? 'text-red-500' : 'text-amber-400'} />
            <span className="text-3xl font-black font-mono tracking-widest leading-none">{formatTime(timeLeft)}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 min-h-[400px] flex flex-col justify-between animate-in slide-in-from-bottom-6">
              <div>
                <div className="flex items-center gap-3 mb-8">
                  <span className="bg-indigo-600 text-white px-5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100">{t.uz === "Kutubxona" ? "Savol" : "Question"} {currentQuestionIdx + 1} / {template.questions.length}</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-800 leading-snug mb-10">{currentQuestion.text}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setAnswers({ ...answers, [currentQuestion.id]: i })}
                      className={`p-6 rounded-[2rem] border-2 text-left transition-all flex items-center gap-4 ${answers[currentQuestion.id] === i ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-indigo-100 hover:bg-white text-slate-600'}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] uppercase ${answers[currentQuestion.id] === i ? 'bg-white/20' : 'bg-white shadow-sm text-slate-400'}`}>
                        {optionLetters[i]}
                      </div>
                      <span className="font-bold text-sm">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-50">
                <button
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx(p => p - 1)}
                  className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-slate-200 disabled:opacity-30 transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                {currentQuestionIdx === template.questions.length - 1 ? (
                  <button onClick={handleFinish} className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all">
                    {t.uz === "Kutubxona" ? "Testni yakunlash" : "Finish Test"}
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentQuestionIdx(p => p + 1)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center gap-2"
                  >
                    {t.uz === "Kutubxona" ? "Keyingisi" : "Next"} <ChevronRight size={20} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">{t.uz === "Kutubxona" ? "Navigatsiya" : "Navigation"}</h4>
              <div className="grid grid-cols-5 gap-2">
                {template.questions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestionIdx(i)}
                    className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all ${currentQuestionIdx === i ? 'ring-2 ring-indigo-500 ring-offset-2' : ''} ${answers[template.questions[i].id] !== undefined ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-[2.5rem] border border-amber-100 border-dashed">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <AlertCircle size={18} />
                <span className="text-[9px] font-black uppercase tracking-widest">{t.note || 'Note'}</span>
              </div>
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed italic">
                {t.uz === "Kutubxona" ? "Test vaqti tugashi bilan natijangiz avtomatik saqlanadi." : "Your results will be saved automatically when time expires."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestQuiz;
