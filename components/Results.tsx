
import React, { useState } from 'react';
import { Result, Student } from '../types';
import { Trophy, Plus, Search, Trash2, GraduationCap, Award, BookOpen, Star, Image, X, Download } from 'lucide-react';

interface ResultsProps {
    t: any;
    results: Result[];
    students: Student[];
    onAdd: (result: Omit<Result, 'id' | 'centerId'>) => void;
    onDelete: (id: string) => void;
}

const RESULT_TYPES = [
    { value: 'IELTS', label: 'IELTS', icon: Award, color: 'bg-red-50 text-red-600 border-red-100' },
    { value: 'CEFR', label: 'CEFR', icon: BookOpen, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { value: 'UNIVERSITY', label: 'Universitet', icon: GraduationCap, color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { value: 'OTHER', label: 'Boshqa', icon: Star, color: 'bg-amber-50 text-amber-600 border-amber-100' },
];

const Results: React.FC<ResultsProps> = ({ t, results, students, onAdd, onDelete }) => {
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('ALL');
    const [viewImage, setViewImage] = useState<string | null>(null);

    const [newResult, setNewResult] = useState<{
        studentId: string;
        type: Result['type'];
        title: string;
        score: string;
        date: string;
        description: string;
        certificateImage: string;
    }>({
        studentId: '',
        type: 'IELTS',
        title: '',
        score: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        certificateImage: '',
    });

    const getStudentName = (id: string) => students.find(s => s.id === id)?.name || 'Unknown';
    const getTypeInfo = (type: string) => RESULT_TYPES.find(t => t.value === type) || RESULT_TYPES[3];

    const filteredResults = results
        .filter(r => filterType === 'ALL' || r.type === filterType)
        .filter(r =>
            r.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.score?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert(t.file_too_large || "Fayl hajmi 2MB dan kichik bo'lishi kerak!");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setNewResult({ ...newResult, certificateImage: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (!newResult.studentId || !newResult.title || !newResult.score) return;

        const student = students.find(s => s.id === newResult.studentId);
        onAdd({
            studentId: newResult.studentId,
            studentName: student?.name || '',
            type: newResult.type,
            title: newResult.title,
            score: newResult.score,
            date: newResult.date,
            description: newResult.description,
            certificateImage: newResult.certificateImage || undefined,
        });

        setShowModal(false);
        setNewResult({
            studentId: '',
            type: 'IELTS',
            title: '',
            score: '',
            date: new Date().toISOString().split('T')[0],
            description: '',
            certificateImage: '',
        });
    };

    // Stats
    const statsByType = RESULT_TYPES.map(type => ({
        ...type,
        count: results.filter(r => r.type === type.value).length
    }));

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statsByType.map(stat => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.value}
                            onClick={() => setFilterType(filterType === stat.value ? 'ALL' : stat.value)}
                            className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${filterType === stat.value ? 'ring-2 ring-indigo-500 scale-[1.02]' : 'border-gray-100'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
                                <Icon size={20} />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-2xl font-bold text-slate-800 mt-1">{stat.count}</p>
                        </div>
                    );
                })}
            </div>

            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder={t.search || "Qidirish..."}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all text-sm"
                >
                    <Plus size={18} />
                    {t.add_result || "Natija qo'shish"}
                </button>
            </div>

            {/* Results Grid */}
            {filteredResults.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                    <Trophy size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold">{t.no_results || "Hali natijalar yo'q"}</p>
                    <p className="text-gray-300 text-sm mt-1">{t.add_first_result || "Birinchi natijani qo'shish uchun tugmani bosing"}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResults.map(result => {
                        const typeInfo = getTypeInfo(result.type);
                        const TypeIcon = typeInfo.icon;
                        return (
                            <div key={result.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden group">
                                {/* Certificate image */}
                                {result.certificateImage && (
                                    <div
                                        className="h-44 bg-gray-100 overflow-hidden cursor-pointer relative"
                                        onClick={() => setViewImage(result.certificateImage!)}
                                    >
                                        <img src={result.certificateImage} alt="Certificate" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                                            <Image size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )}

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${typeInfo.color}`}>
                                            {typeInfo.label}
                                        </span>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(t.delete_confirm || "O'chirmoqchimisiz?")) {
                                                    onDelete(result.id);
                                                }
                                            }}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{result.title}</h3>
                                    <p className="text-indigo-600 font-bold text-xl mb-3">{result.score}</p>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-slate-600">{result.studentName}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{result.date}</p>
                                        </div>
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${typeInfo.color}`}>
                                            <TypeIcon size={16} />
                                        </div>
                                    </div>

                                    {result.description && (
                                        <p className="text-xs text-gray-400 mt-3 line-clamp-2 italic">{result.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-pop p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                            <Trophy className="text-amber-500" />
                            {t.add_result || "Natija qo'shish"}
                        </h3>
                        <div className="space-y-4">
                            {/* Student select */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.students || "O'quvchi"}</label>
                                <select
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                    value={newResult.studentId}
                                    onChange={e => setNewResult({ ...newResult, studentId: e.target.value })}
                                >
                                    <option value="">{t.select_student || "O'quvchini tanlang"}...</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            {/* Type select */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.result_type || "Turi"}</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {RESULT_TYPES.map(type => {
                                        const Icon = type.icon;
                                        return (
                                            <button
                                                key={type.value}
                                                onClick={() => setNewResult({ ...newResult, type: type.value as Result['type'] })}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${newResult.type === type.value ? 'border-indigo-500 bg-indigo-50 scale-105' : 'border-gray-100 hover:border-gray-200'}`}
                                            >
                                                <Icon size={18} className={newResult.type === type.value ? 'text-indigo-600' : 'text-gray-400'} />
                                                <span className={`text-[9px] font-bold ${newResult.type === type.value ? 'text-indigo-600' : 'text-gray-400'}`}>{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Title & Score */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.title || "Nomi"}</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        placeholder={newResult.type === 'IELTS' ? 'IELTS Academic' : newResult.type === 'CEFR' ? 'CEFR Certificate' : newResult.type === 'UNIVERSITY' ? 'Universitet nomi' : 'Sertifikat nomi'}
                                        value={newResult.title}
                                        onChange={e => setNewResult({ ...newResult, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.score || "Ball"} / {t.result || "Natija"}</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                        placeholder={newResult.type === 'IELTS' ? '7.5' : newResult.type === 'CEFR' ? 'B2' : newResult.type === 'UNIVERSITY' ? 'Qabul qilindi' : 'Natija'}
                                        value={newResult.score}
                                        onChange={e => setNewResult({ ...newResult, score: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.date || "Sana"}</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                    value={newResult.date}
                                    onChange={e => setNewResult({ ...newResult, date: e.target.value })}
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.note || "Izoh"}</label>
                                <textarea
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none"
                                    rows={2}
                                    placeholder={t.note_placeholder || "Izoh yozing..."}
                                    value={newResult.description}
                                    onChange={e => setNewResult({ ...newResult, description: e.target.value })}
                                />
                            </div>

                            {/* Certificate Image */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{t.certificate_image || "Sertifikat rasmi"}</label>
                                {newResult.certificateImage ? (
                                    <div className="relative rounded-xl overflow-hidden h-40">
                                        <img src={newResult.certificateImage} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setNewResult({ ...newResult, certificateImage: '' })}
                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                                        <Image size={20} className="text-gray-400" />
                                        <span className="text-sm text-gray-400 font-bold">{t.upload_image || "Rasm yuklash"}</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 flex space-x-3">
                            <button onClick={() => setShowModal(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl">{t.cancel || "Bekor qilish"}</button>
                            <button
                                onClick={handleSave}
                                disabled={!newResult.studentId || !newResult.title || !newResult.score}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {t.save || "Saqlash"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Viewer Modal */}
            {viewImage && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewImage(null)}>
                    <div className="relative max-w-4xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setViewImage(null)} className="absolute -top-3 -right-3 p-2 bg-white rounded-full shadow-lg z-10">
                            <X size={20} />
                        </button>
                        <img src={viewImage} alt="Certificate" className="max-w-full max-h-[85vh] rounded-2xl shadow-pop object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Results;
