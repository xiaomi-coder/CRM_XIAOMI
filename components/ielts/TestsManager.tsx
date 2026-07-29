import React, { useState, useEffect } from 'react';
import { db } from '../../services/supabase';
import { IELTSTest, IELTSTestPin, IELTSExamType } from '../../types';
import { Plus, Edit3, Play, Archive, Copy, CheckCircle, Hash, Globe, Loader2, Sparkles, Smartphone } from 'lucide-react';
import IELTSAdmin from './IELTSAdmin';
import { seedPlatformTest2, PLATFORM_CENTER_ID } from '../../services/ieltsSeedService';

interface TestsManagerProps {
    t: any;
    centerId: string;
    userRole: string;
}

const TestsManager: React.FC<TestsManagerProps> = ({ t, centerId, userRole }) => {
    const [tests, setTests] = useState<IELTSTest[]>([]);
    const [platformTests, setPlatformTests] = useState<IELTSTest[]>([]);
    const [activeTab, setActiveTab] = useState<'my' | 'platform'>('my');
    const [loading, setLoading] = useState(false);
    const [seedingPlatform, setSeedingPlatform] = useState(false);
    const [viewingTestId, setViewingTestId] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [newTestTitle, setNewTestTitle] = useState('');
    const [newTestType, setNewTestType] = useState<IELTSExamType>(IELTSExamType.ACADEMIC);

    // PIN Modal
    const [pinModalTest, setPinModalTest] = useState<IELTSTest | null>(null);
    const [generatedPin, setGeneratedPin] = useState<IELTSTestPin | null>(null);

    const isSuperAdmin = userRole === 'SUPER_ADMIN' || userRole === 'DIRECTOR';

    useEffect(() => {
        loadTests();
    }, [centerId]);

    const loadTests = async () => {
        setLoading(true);
        try {
            const data = await db.get('ielts_tests');
            if (Array.isArray(data)) {
                // Jadvalda ikkala uslub ham bor (center_id va "centerId") — ikkalasini o'qiymiz
                const ownerOf = (t: any) => t.center_id ?? t.centerId;
                const mapTest = (t: any): IELTSTest => ({
                    id: t.id,
                    centerId: ownerOf(t),
                    title: t.title,
                    examType: t.exam_type ?? t.examType,
                    status: t.status,
                    createdAt: t.created_at ?? t.createdAt
                });

                const centerTests = (data as any[])
                    .filter(t => ownerOf(t) === centerId)
                    .map(mapTest)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                const globalTests = (data as any[])
                    .filter(t => ownerOf(t) === PLATFORM_CENTER_ID)
                    .map(mapTest)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                setTests(centerTests as IELTSTest[]);
                setPlatformTests(globalTests as IELTSTest[]);
            }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleSeedPlatformTest2 = async () => {
        if (!window.confirm('Platform Test 2 ni qo\'shishni tasdiqlaysizmi? Bu bir marta bajariladi.')) return;
        setSeedingPlatform(true);
        const result = await seedPlatformTest2();
        setSeedingPlatform(false);
        if (result.success) {
            alert('✅ Platform Test 2 muvaffaqiyatli qo\'shildi!');
            loadTests();
        } else {
            alert(`⚠️ ${result.error}`);
        }
    };

    const handleCreateTest = async () => {
        if (!newTestTitle.trim()) return alert("Test nomini kiriting!");
        try {
            const newTest = {
                id: crypto.randomUUID(),
                center_id: centerId,
                title: newTestTitle,
                exam_type: newTestType,
                status: 'draft',
                created_at: new Date().toISOString()
            };
            await db.insert('ielts_tests', newTest);
            setModalOpen(false);
            setNewTestTitle('');
            loadTests();
        } catch (e) {
            console.error(e);
            alert("Xatolik!");
        }
    };

    const handleStatusChange = async (test: IELTSTest, status: 'active' | 'archived' | 'draft') => {
        try {
            await db.update('ielts_tests', test.id, { status });
            loadTests();
        } catch (e) { console.error(e); }
    };

    const generatePin = async () => {
        if (!pinModalTest) return;
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        const newPin = {
            id: crypto.randomUUID(),
            test_id: pinModalTest.id,
            pin_code: pin,
            status: 'active',
            used_count: 0,
            created_by: centerId, // Or user ID
            created_at: new Date().toISOString()
        };
        try {
            await db.insert('ielts_test_pins', newPin);
            setGeneratedPin({
                id: newPin.id,
                testId: newPin.test_id,
                pinCode: newPin.pin_code,
                status: 'active',
                usedCount: 0,
                createdBy: centerId,
                createdAt: newPin.created_at
            });
        } catch (e) {
            console.error(e);
            alert("PIN yaratishda xatolik! Qayta urinib ko'ring.");
        }
    };

    const copyPin = (pin: string) => {
        navigator.clipboard.writeText(pin);
        alert("PIN nusxalandi! 📋");
    };

    if (viewingTestId) {
        return (
            <div className="bg-white min-h-screen">
                <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-white sticky top-0 z-50">
                    <button onClick={() => setViewingTestId(null)} className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2">
                        ← Ortga: Testlar ro'yxati
                    </button>
                    <div className="text-sm font-black text-slate-800">
                        {tests.find(t => t.id === viewingTestId)?.title}
                    </div>
                </div>
                {/* Pass testId to IELTSAdmin so it filters questions */}
                <IELTSAdmin t={t} centerId={centerId} userRole={userRole} testId={viewingTestId} />
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#f8f9fc]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">IELTS Testlar</h1>
                    <p className="text-xs font-bold text-slate-400 mt-1">Imtihonlarni boshqarish va PIN kodlar</p>
                </div>
                {activeTab === 'my' && (
                    <button onClick={() => setModalOpen(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.02] flex items-center gap-2">
                        <Plus size={16} /> Yangi Test
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('my')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2
                        ${activeTab === 'my' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'}`}
                >
                    <Edit3 size={14} /> Mening Testlarim
                    {tests.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'my' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{tests.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('platform')}
                    className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2
                        ${activeTab === 'platform' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-300'}`}
                >
                    <Globe size={14} /> Platforma Testlari
                    {platformTests.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${activeTab === 'platform' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-600'}`}>{platformTests.length}</span>}
                </button>
            </div>

            {/* Platform Tests Tab */}
            {activeTab === 'platform' && (
                <div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <Sparkles size={20} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-black text-emerald-800">Platforma tomonidan tayyor testlar</p>
                            <p className="text-xs text-emerald-600 mt-0.5">Bu testlarni yaratmaysiz — faqat PIN olib o'quvchilarga berasiz. Har oy yangi testlar qo'shiladi!</p>
                        </div>
                    </div>

                    {/* Super admin: seed trigger */}
                    {isSuperAdmin && (
                        <div className="mb-6 flex justify-end">
                            <button
                                onClick={handleSeedPlatformTest2}
                                disabled={seedingPlatform}
                                className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-purple-700 disabled:opacity-60"
                            >
                                {seedingPlatform ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                Platform Test 2 qo'shish
                            </button>
                        </div>
                    )}

                    {platformTests.length === 0 ? (
                        <div className="text-center py-16">
                            <Globe size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="font-black text-slate-400">Hozircha platforma testlari yo'q</p>
                            <p className="text-xs text-slate-400 mt-1">Tez orada qo'shiladi!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {platformTests.map(test => (
                                <div key={test.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                    <Globe size={16} className="text-emerald-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-800 leading-tight">{test.title}</h3>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{test.examType}</span>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase">Tayyor</span>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-2.5 mb-4 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                                            <CheckCircle size={13} /> 40 Reading • 40 Listening • 2 Writing • Speaking
                                        </div>
                                        <button
                                            onClick={() => { setPinModalTest(test); setGeneratedPin(null); }}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Hash size={14} /> PIN olish va o'quvchiga berish
                                        </button>
                                    </div>
                                    <div className="bg-emerald-50/60 px-4 py-2 border-t border-emerald-100 text-[10px] font-bold text-emerald-600 text-center">
                                        Barcha markazlar uchun bepul
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* My Tests Tab */}
            {activeTab === 'my' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map(test => (
                    <div key={test.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{test.title}</h3>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                                        {test.examType}
                                    </span>
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider
                                    ${test.status === 'active' ? 'bg-emerald-100 text-emerald-600' :
                                        test.status === 'draft' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-400'}`}>
                                    {test.status}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-500 mb-6">
                                <div className="bg-slate-50 p-2 rounded-lg text-center">
                                    <span className="block text-slate-400 text-[9px] uppercase font-black">Yaratilgan</span>
                                    {new Date(test.createdAt).toLocaleDateString()}
                                </div>
                                <button onClick={() => { setPinModalTest(test); setGeneratedPin(null); }} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-lg flex items-center justify-center gap-1 font-bold transition-all">
                                    <Hash size={14} /> PIN olish
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button onClick={() => setViewingTestId(test.id)} className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all">
                                    <Edit3 size={14} className="inline mr-2" /> Savollar
                                </button>
                                {test.status !== 'active' ? (
                                    <button onClick={() => handleStatusChange(test, 'active')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100" title="Faollashtirish">
                                        <Play size={16} />
                                    </button>
                                ) : (
                                    <button onClick={() => handleStatusChange(test, 'archived')} className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100" title="Arxivlash">
                                        <Archive size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* PIN Overlay if active */}
                        {test.status === 'active' && (
                            <div className="bg-emerald-50/50 p-2 text-center text-[10px] font-bold text-emerald-600 border-t border-emerald-100">
                                Test faol • O'quvchilar PIN orqali kirishi mumkin
                            </div>
                        )}
                    </div>
                ))}
            </div>}

            {/* Create Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-lg font-black text-slate-800 mb-4">Yangi Test Yaratish</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Test Nomi</label>
                                <input type="text" value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)} placeholder="Masalan: Cambridge 18 - Test 1" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">Turi</label>
                                <select value={newTestType} onChange={e => setNewTestType(e.target.value as any)} className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold">
                                    <option value={IELTSExamType.ACADEMIC}>Academic</option>
                                    <option value={IELTSExamType.GENERAL}>General Training</option>
                                </select>
                            </div>
                            <button onClick={handleCreateTest} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700">Yaratish</button>
                            <button onClick={() => setModalOpen(false)} className="w-full text-slate-400 py-2 font-bold text-xs hover:text-slate-600">Bekor qilish</button>
                        </div>
                    </div>
                </div>
            )}

            {/* PIN Generator Modal */}
            {pinModalTest && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
                        <h3 className="text-lg font-black text-slate-800 mb-2">PIN Kod</h3>
                        <p className="text-xs text-slate-500 mb-6">{pinModalTest.title} uchun kirish kodi</p>

                        {generatedPin ? (
                            <div className="bg-slate-100 rounded-xl p-4 mb-6">
                                <div className="text-4xl font-black text-slate-800 tracking-[0.2em]">{generatedPin.pinCode}</div>
                                <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase">Ushbu kodni o'quvchiga bering</p>
                            </div>
                        ) : (
                            <div className="bg-indigo-50 rounded-xl p-8 mb-6 flex flex-col items-center justify-center gap-3">
                                <Smartphone size={32} className="text-indigo-300" />
                                <button onClick={generatePin} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-xs shadow-lg hover:bg-indigo-700">
                                    Generatsiya qilish
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {generatedPin && (
                                <button onClick={() => copyPin(generatedPin.pinCode)} className="bg-emerald-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2">
                                    <Copy size={16} /> Nusxalash
                                </button>
                            )}
                            <button onClick={() => setPinModalTest(null)} className={`bg-slate-100 text-slate-500 py-3 rounded-xl font-bold text-xs hover:bg-slate-200 ${generatedPin ? '' : 'col-span-2'}`}>
                                Yopish
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestsManager;
