
import React, { useState } from 'react';
import { Result, Student } from '../types';
import { Trophy, Plus, Search, Trash2, GraduationCap, Award, BookOpen, Star, Image, X, Download } from 'lucide-react';
import { PageHeader, Card, Button, Field, Input, StatusBadge, Avatar, EmptyState } from './ui';

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
        <div className="animate-in fade-in duration-300">
            <PageHeader
                title={t.results_section || 'Natijalar'}
                subtitle={`${filteredResults.length} / ${results.length}`}
                actions={
                    <Button onClick={() => setShowModal(true)}>
                        <Plus size={16} /> {t.add_result || "Natija qo'shish"}
                    </Button>
                }
            />

            {/* Turlar bo'yicha — bosilsa filtrlaydi */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                {statsByType.map(stat => (
                    <div
                        key={stat.value}
                        onClick={() => setFilterType(filterType === stat.value ? 'ALL' : stat.value)}
                        className={`bg-surface border rounded-lg shadow-e1 p-4 cursor-pointer transition-colors
                            ${filterType === stat.value ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-line-strong'}`}
                    >
                        <div className="text-[13px] leading-[18px] text-ink-2 font-medium">{stat.label}</div>
                        <div className="text-[30px] leading-9 font-bold text-ink tabular-nums mt-1.5">{stat.count}</div>
                    </div>
                ))}
            </div>

            <Card className="mb-5">
                <Field label={t.search_label || 'Qidirish'}>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={15} />
                        <Input
                            className="pl-9"
                            placeholder={t.search}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Field>
            </Card>

            {filteredResults.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<Trophy size={22} />}
                        title={t.no_results || "Hali natijalar yo'q"}
                        description={t.add_first_result || "Birinchi natijani qo'shish uchun tugmani bosing"}
                    />
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredResults.map(result => {
                        const typeInfo = getTypeInfo(result.type);
                        return (
                            <Card key={result.id} padded={false} className="overflow-hidden group">
                                {result.certificateImage && (
                                    <div
                                        className="h-40 bg-[#F0F1F3] overflow-hidden cursor-pointer"
                                        onClick={() => setViewImage(result.certificateImage!)}
                                    >
                                        <img src={result.certificateImage} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <StatusBadge label={typeInfo.label} tone="brand" dot={false} />
                                        <button
                                            onClick={() => {
                                                if (window.confirm(t.delete_confirm || "O'chirmoqchimisiz?")) onDelete(result.id);
                                            }}
                                            title={t.delete_action || "O'chirish"}
                                            className="p-1.5 text-muted hover:text-danger hover:bg-danger-bg rounded-md transition-colors"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>

                                    <h3 className="text-[15px] font-semibold text-ink leading-tight">{result.title}</h3>
                                    <p className="text-[22px] font-bold text-primary tabular-nums mt-1">{result.score}</p>

                                    <div className="flex items-center gap-2.5 pt-3 mt-3 border-t border-line">
                                        <Avatar name={result.studentName} size={30} />
                                        <div className="min-w-0">
                                            <div className="text-[13px] font-medium text-ink truncate">{result.studentName}</div>
                                            <div className="text-[12px] text-muted tabular-nums">{result.date}</div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}


            {/* Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
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
                                                <span className={`text-[9px] font-black ${newResult.type === type.value ? 'text-indigo-600' : 'text-gray-400'}`}>{type.label}</span>
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
                        <img src={viewImage} alt="Certificate" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Results;
