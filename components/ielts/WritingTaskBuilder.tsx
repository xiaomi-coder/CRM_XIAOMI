import React, { useState } from 'react';
import { Save, Image as ImageIcon } from 'lucide-react';
import { IELTSExamType } from '../../types';

interface WritingTaskBuilderProps {
    t: any;
    initial?: any;
    examType: IELTSExamType;
    onSave: (data: any) => void;
    onCancel: () => void;
}

const WritingTaskBuilder: React.FC<WritingTaskBuilderProps> = ({ t, initial, examType, onSave, onCancel }) => {
    const [taskNumber, setTaskNumber] = useState(initial?.taskNumber || 1);
    const [taskPrompt, setTaskPrompt] = useState(initial?.taskPrompt || '');
    const [taskImageUrl, setTaskImageUrl] = useState(initial?.taskImageUrl || '');
    const [wordLimitMin, setWordLimitMin] = useState(initial?.wordLimitMin || (taskNumber === 1 ? 150 : 250));
    const [timeMinutes, setTimeMinutes] = useState(initial?.timeMinutes || (taskNumber === 1 ? 20 : 40));

    const handleTaskChange = (num: number) => {
        setTaskNumber(num);
        setWordLimitMin(num === 1 ? 150 : 250);
        setTimeMinutes(num === 1 ? 20 : 40);
    };

    const handleSubmit = () => {
        if (!taskPrompt.trim()) {
            alert('Task prompt yozing!');
            return;
        }
        onSave({
            examType,
            taskNumber,
            taskPrompt: taskPrompt.trim(),
            taskImageUrl: taskImageUrl.trim() || null,
            wordLimitMin,
            timeMinutes,
        });
    };

    return (
        <div className="space-y-5">
            {/* Task Type Toggle */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Task turi</label>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { num: 1, label: 'Task 1', desc: examType === 'academic' ? 'Graph/Chart/Diagram' : 'Letter', words: '150+', time: '20 min' },
                        { num: 2, label: 'Task 2', desc: 'Essay', words: '250+', time: '40 min' },
                    ].map(task => (
                        <button key={task.num} onClick={() => handleTaskChange(task.num)}
                            className={`p-5 rounded-2xl border-2 text-left transition-all ${taskNumber === task.num
                                ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100' : 'border-slate-200 bg-white hover:border-indigo-200'}`}>
                            <div className={`text-sm font-black ${taskNumber === task.num ? 'text-indigo-700' : 'text-slate-700'}`}>{task.label}</div>
                            <div className={`text-[10px] font-bold mt-1 ${taskNumber === task.num ? 'text-indigo-400' : 'text-slate-400'}`}>{task.desc}</div>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] font-black bg-white/80 px-2 py-0.5 rounded-md text-slate-500">{task.words} so'z</span>
                                <span className="text-[9px] font-black bg-white/80 px-2 py-0.5 rounded-md text-slate-500">{task.time}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Task Prompt */}
            <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Task prompt *</label>
                <textarea value={taskPrompt} onChange={e => setTaskPrompt(e.target.value)}
                    placeholder={taskNumber === 1
                        ? "Masalan: The chart below shows the percentage of households..."
                        : "Masalan: Some people believe that universities should focus on..."}
                    rows={6}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none resize-y leading-relaxed" />
            </div>

            {/* Image URL (Task 1) */}
            {taskNumber === 1 && (
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <ImageIcon size={12} className="inline mr-1" /> Graph/Chart rasm URL
                    </label>
                    <input type="text" value={taskImageUrl} onChange={e => setTaskImageUrl(e.target.value)}
                        placeholder="https://example.com/chart.png (ixtiyoriy)"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                    {taskImageUrl && (
                        <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                            <img src={taskImageUrl} alt="Preview" className="max-h-40 rounded-lg mx-auto"
                                onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                    )}
                </div>
            )}

            {/* Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Minimum so'z</label>
                    <input type="number" value={wordLimitMin} onChange={e => setWordLimitMin(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vaqt (daqiqa)</label>
                    <input type="number" value={timeMinutes} onChange={e => setTimeMinutes(Number(e.target.value))}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-200 outline-none" />
                </div>
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

export default WritingTaskBuilder;
