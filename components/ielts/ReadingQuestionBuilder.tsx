import React, { useState } from 'react';
import { Save, X, Plus, Trash2, ChevronDown } from 'lucide-react';
import { IELTSExamType } from '../../types';

interface ReadingQuestionBuilderProps {
    t: any;
    initial?: any;
    examType: IELTSExamType;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const QUESTION_TYPES = [
    { value: 'multiple_choice', label: 'Multiple Choice (MCQ)' },
    { value: 'true_false_not_given', label: 'True / False / Not Given' },
    { value: 'sentence_completion', label: 'Gap Fill / Sentence Completion' },
    { value: 'matching', label: 'Matching Headings' },
    { value: 'short_answer', label: 'Short Answer' },
];

const ReadingQuestionBuilder: React.FC<ReadingQuestionBuilderProps> = ({ t, initial, examType, onSave, onCancel }) => {
    const [passageNumber, setPassageNumber] = useState(initial?.passageNumber || 1);
    const [passageTitle, setPassageTitle] = useState(initial?.passageTitle || '');
    const [passageText, setPassageText] = useState(initial?.passageText || '');
    const [questionNumber, setQuestionNumber] = useState(initial?.questionNumber || 1);
    const [questionType, setQuestionType] = useState(initial?.questionType || 'multiple_choice');
    const [questionText, setQuestionText] = useState(initial?.questionText || '');
    const [options, setOptions] = useState<string[]>(initial?.options || ['A) ', 'B) ', 'C) ', 'D) ']);
    const [correctAnswer, setCorrectAnswer] = useState(initial?.correctAnswer || '');

    const wordCount = passageText.split(/\s+/).filter(Boolean).length;

    const handleSubmit = () => {
        if (!passageTitle.trim() || !questionText.trim() || !correctAnswer.trim()) {
            alert('Barcha kerakli maydonlarni to\'ldiring!');
            return;
        }
        onSave({
            examType,
            passageNumber,
            passageTitle: passageTitle.trim(),
            passageText: passageText.trim(),
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
            {/* Row: Passage # and Exam Type */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Passage №</label>
                    <select value={passageNumber} onChange={e => setPassageNumber(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none">
                        <option value={1}>Passage 1</option>
                        <option value={2}>Passage 2</option>
                        <option value={3}>Passage 3</option>
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

            {/* Passage Title */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Passage sarlavhasi *</label>
                <input type="text" value={passageTitle} onChange={e => setPassageTitle(e.target.value)}
                    placeholder="Masalan: The History of Chocolate"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
            </div>

            {/* Passage Text */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passage matni</label>
                    <span className={`text-[10px] font-black ${wordCount >= 500 && wordCount <= 900 ? 'text-emerald-500' : wordCount > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {wordCount} so'z {wordCount >= 500 && wordCount <= 900 && '✓'}
                    </span>
                </div>
                <textarea value={passageText} onChange={e => setPassageText(e.target.value)}
                    placeholder="Bu yerga passage matnini kiriting (500-900 so'z tavsiya etiladi)..."
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-y leading-relaxed" />
            </div>

            {/* Question Text */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Savol matni *</label>
                <input type="text" value={questionText} onChange={e => setQuestionText(e.target.value)}
                    placeholder="Masalan: The Aztecs used cacao seeds as money."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
            </div>

            {/* Options (MCQ / Matching only) */}
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

            {/* T/F/NG quick buttons */}
            {questionType === 'true_false_not_given' && (
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">To'g'ri javob *</label>
                    <div className="flex gap-2">
                        {['TRUE', 'FALSE', 'NOT GIVEN'].map(v => (
                            <button key={v} onClick={() => setCorrectAnswer(v)}
                                className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase transition-all ${correctAnswer === v
                                    ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {v}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Correct Answer (non T/F/NG) */}
            {questionType !== 'true_false_not_given' && (
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">To'g'ri javob *</label>
                    <input type="text" value={correctAnswer} onChange={e => setCorrectAnswer(e.target.value)}
                        placeholder={questionType === 'multiple_choice' ? "Masalan: B" : "To'g'ri javob yozing"}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                </div>
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

export default ReadingQuestionBuilder;
