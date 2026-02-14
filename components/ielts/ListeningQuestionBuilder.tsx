import React, { useState } from 'react';
import { Save, Plus, Trash2, Music } from 'lucide-react';
import { IELTSExamType } from '../../types';

interface ListeningQuestionBuilderProps {
    t: any;
    initial?: any;
    examType: IELTSExamType;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'form_completion', label: 'Form/Note Completion' },
    { value: 'sentence_completion', label: 'Sentence Completion' },
    { value: 'matching', label: 'Matching' },
    { value: 'map_labelling', label: 'Map/Plan Labelling' },
];

const ListeningQuestionBuilder: React.FC<ListeningQuestionBuilderProps> = ({ t, initial, examType, onSave, onCancel }) => {
    const [sectionNumber, setSectionNumber] = useState(initial?.sectionNumber || 1);
    const [sectionTitle, setSectionTitle] = useState(initial?.sectionTitle || '');
    const [audioUrl, setAudioUrl] = useState(initial?.audioUrl || '');
    const [questionNumber, setQuestionNumber] = useState(initial?.questionNumber || 1);
    const [questionType, setQuestionType] = useState(initial?.questionType || 'multiple_choice');
    const [questionText, setQuestionText] = useState(initial?.questionText || '');
    const [options, setOptions] = useState<string[]>(initial?.options || ['A) ', 'B) ', 'C) ', 'D) ']);
    const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer || '');

    const handleSubmit = () => {
        if (!sectionTitle.trim() || !questionText.trim() || !correctAnswer.trim()) {
            alert('Barcha kerakli maydonlarni to\'ldiring!');
            return;
        }
        onSave({
            examType,
            sectionNumber,
            sectionTitle: sectionTitle.trim(),
            audioUrl: audioUrl.trim() || 'placeholder',
            questionNumber,
            questionType,
            questionText: questionText.trim(),
            options: questionType === 'multiple_choice' || questionType === 'matching' ? options.filter(o => o.trim()) : null,
            correctAnswer: correctAnswer.trim(),
            points: 1,
        });
    };

    return (
        <div className="space-y-5">
            {/* Section & Question Number */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section №</label>
                    <select value={sectionNumber} onChange={e => setSectionNumber(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none">
                        <option value={1}>Section 1 — Kundalik suhbat</option>
                        <option value={2}>Section 2 — Monolog</option>
                        <option value={3}>Section 3 — Ilmiy muhokama</option>
                        <option value={4}>Section 4 — Ma'ruza</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Savol №</label>
                    <input type="number" min={1} max={40} value={questionNumber} onChange={e => setQuestionNumber(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Savol turi</label>
                    <select value={questionType} onChange={e => setQuestionType(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none">
                        {QUESTION_TYPES.map(qt => (
                            <option key={qt.value} value={qt.value}>{qt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Section Title */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section sarlavhasi *</label>
                <input type="text" value={sectionTitle} onChange={e => setSectionTitle(e.target.value)}
                    placeholder="Masalan: Hotel Reservation Conversation"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
            </div>

            {/* Audio URL */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                    <Music size={12} className="inline mr-1" /> Audio URL
                </label>
                <input type="text" value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                    placeholder="https://example.com/audio.mp3 (yoki bo'sh qoldiring)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                <p className="text-[10px] text-slate-400 mt-1">Bo'sh qoldirilsa "placeholder" ishlatiladi</p>
            </div>

            {/* Question Text */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Savol matni *</label>
                <input type="text" value={questionText} onChange={e => setQuestionText(e.target.value)}
                    placeholder="Masalan: Guest name: _____"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
            </div>

            {/* Options (MCQ / Matching) */}
            {(questionType === 'multiple_choice' || questionType === 'matching') && (
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Variantlar</label>
                    <div className="space-y-2">
                        {options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <input type="text" value={opt} onChange={e => {
                                    const newOpts = [...options];
                                    newOpts[i] = e.target.value;
                                    setOptions(newOpts);
                                }}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
                                {options.length > 2 && (
                                    <button onClick={() => setOptions(options.filter((_, j) => j !== i))}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button onClick={() => setOptions([...options, `${String.fromCharCode(65 + options.length)}) `])}
                            className="text-xs font-bold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1">
                            <Plus size={12} /> Variant qo'shish
                        </button>
                    </div>
                </div>
            )}

            {/* Correct Answer */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">To'g'ri javob *</label>
                <input type="text" value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)}
                    placeholder={questionType === 'multiple_choice' ? "Masalan: B" : "To'g'ri javobni yozing"}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
            </div>

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

export default ListeningQuestionBuilder;
