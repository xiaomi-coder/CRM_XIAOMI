import React, { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

interface SpeakingQuestionBuilderProps {
    t: any;
    initial?: any;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const SpeakingQuestionBuilder: React.FC<SpeakingQuestionBuilderProps> = ({ t, initial, onSave, onCancel }) => {
    const [partNumber, setPartNumber] = useState(initial?.partNumber || 1);
    const [questionText, setQuestionText] = useState(initial?.questionText || '');
    const [cueCardTopic, setCueCardTopic] = useState(initial?.cueCardTopic || '');
    const [cueCardPoints, setCueCardPoints] = useState<string[]>(initial?.cueCardPoints || ['', '', '', '']);
    const [preparationTime, setPreparationTime] = useState(initial?.preparationTime || 60);
    const [speakingTime, setSpeakingTime] = useState(initial?.speakingTime || 120);

    const handleSubmit = () => {
        if (!questionText.trim()) {
            alert('Savol matnini yozing!');
            return;
        }
        onSave({
            partNumber,
            questionText: questionText.trim(),
            cueCardTopic: partNumber === 2 && cueCardTopic.trim() ? cueCardTopic.trim() : null,
            cueCardPoints: partNumber === 2 ? cueCardPoints.filter(p => p.trim()) : null,
            preparationTime: partNumber === 2 ? preparationTime : null,
            speakingTime: partNumber === 2 ? speakingTime : null,
        });
    };

    return (
        <div className="space-y-5">
            {/* Part Selection */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Speaking Part</label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { num: 1, label: 'Part 1', desc: 'Introduction & Interview', time: '4-5 min' },
                        { num: 2, label: 'Part 2', desc: 'Individual Long Turn', time: '3-4 min' },
                        { num: 3, label: 'Part 3', desc: 'Two-way Discussion', time: '4-5 min' },
                    ].map(part => (
                        <button key={part.num} onClick={() => setPartNumber(part.num)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all ${partNumber === part.num
                                ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
                            <div className={`text-sm font-black ${partNumber === part.num ? 'text-indigo-700' : 'text-slate-700'}`}>{part.label}</div>
                            <div className={`text-[9px] font-bold mt-1 ${partNumber === part.num ? 'text-indigo-400' : 'text-slate-400'}`}>{part.desc}</div>
                            <div className="text-[9px] font-black bg-white/80 px-2 py-0.5 rounded-md text-slate-400 mt-2 inline-block">{part.time}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Question Text */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Savol matni *</label>
                <textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
                    placeholder={partNumber === 1 ? "Masalan: Where are you from?"
                        : partNumber === 2 ? "Masalan: Describe a place you have visited..."
                            : "Masalan: Why do people like to travel?"}
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-y leading-relaxed" />
            </div>

            {/* Cue Card (Part 2 only) */}
            {partNumber === 2 && (
                <>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cue Card mavzusi</label>
                        <input type="text" value={cueCardTopic} onChange={e => setCueCardTopic(e.target.value)}
                            placeholder="Masalan: An interesting place you visited"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cue Card nuqtalari</label>
                        <div className="space-y-2">
                            {cueCardPoints.map((point, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-500 text-[10px] font-black flex-shrink-0">{i + 1}</span>
                                    <input type="text" value={point} onChange={e => {
                                        const updated = [...cueCardPoints];
                                        updated[i] = e.target.value;
                                        setCueCardPoints(updated);
                                    }}
                                        placeholder={`Nuqta ${i + 1}: Masalan: What the place is`}
                                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
                                    {cueCardPoints.length > 2 && (
                                        <button onClick={() => setCueCardPoints(cueCardPoints.filter((_, j) => j !== i))}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => setCueCardPoints([...cueCardPoints, ''])}
                                className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1">
                                <Plus size={12} /> Nuqta qo'shish
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tayyorlanish vaqti (soniya)</label>
                            <input type="number" value={preparationTime} onChange={e => setPreparationTime(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gapirish vaqti (soniya)</label>
                            <input type="number" value={speakingTime} onChange={e => setSpeakingTime(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
                        </div>
                    </div>
                </>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button onClick={onCancel}
                    className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                    Bekor qilish
                </button>
                <button onClick={handleSubmit}
                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                    <Save size={14} /> Saqlash
                </button>
            </div>
        </div>
    );
};

export default SpeakingQuestionBuilder;
