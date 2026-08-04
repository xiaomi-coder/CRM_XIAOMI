import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { db, getAuthToken, isTokenValid } from './services/supabase';
import { User, UserRole, Lead, TestTemplate } from './types';
import LandingPage from './components/LandingPage';
import Login from './components/Login';
import AuthenticatedApp from './components/AuthenticatedApp';
import ProtectedRoute from './components/ProtectedRoute';
import TestQuiz from './components/TestQuiz';
import Toaster from './components/Toaster';
import { translations, Language } from './services/languageContext';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('edu_user');
        if (!saved) return null;
        const user: User = JSON.parse(saved);
        // Super admin propusksiz ishlaydi; qolganlarga propusk shart va u
        // 12 soatdan keyin tugaydi — tugagan bo'lsa qayta login qilinadi.
        if (user.role !== UserRole.SUPER_ADMIN && !isTokenValid(getAuthToken())) {
            localStorage.removeItem('edu_user');
            localStorage.removeItem('edu_user_role');
            return null;
        }
        return user;
    });

    const [loginError, setLoginError] = useState<string | null>(null);
    const [testLead, setTestLead] = useState<Lead | null>(null);
    const [testTemplate, setTestTemplate] = useState<TestTemplate | null>(null);
    const [ieltsTestData, setIeltsTestData] = useState<{ id: string | null; pin: string | null } | undefined>(undefined);

    const navigate = useNavigate();
    const location = useLocation();

    const lang = (localStorage.getItem('edu_lang') as Language) || 'uz';
    const t = translations[lang];

    useEffect(() => {
        // Redirect to app if logged in and accessing root or login (unless specifically going to landing)
        // Actually, root is landing page now.
        // If user is logged in, accessing /login should redirect to /app
        if (currentUser && location.pathname === '/login') {
            navigate('/app', { replace: true });
        }
    }, [currentUser, location.pathname, navigate]);

    const handleLogin = async (username: string, pass: string) => {
        setLoginError(null);

        // Hardcoded Super Admin access
        if (username === 'creator' && pass === 'xiaomicoder') {
            const superAdmin: User = {
                id: 'SUPER_ADMIN_ID',
                centerId: 'GLOBAL',
                name: 'Super Admin',
                username: 'creator',
                role: UserRole.SUPER_ADMIN
            };
            localStorage.setItem('edu_user_role', superAdmin.role);
            localStorage.setItem('edu_user', JSON.stringify(superAdmin));
            setCurrentUser(superAdmin);
            navigate('/app');
            return;
        }

        // Parol endi BAZADA tekshiriladi. Avval brauzer `users` jadvalidan
        // parolni o'qib o'zi solishtirardi — ya'ni parollar ochiq kelardi.
        try {
            const res = await db.login(username, pass);

            if (!res.ok) {
                if (res.reason === 'blocked') setLoginError("Sizning o'quv markazingiz bloklangan. Creator bilan bog'laning.");
                else if (res.reason === 'no_center') setLoginError("O'quv markazi topilmadi.");
                else if (res.reason === 'network') setLoginError(t.network_error);
                else setLoginError(t.login_error);
                return;
            }

            localStorage.setItem('edu_user_role', res.user.role);
            localStorage.setItem('edu_user', JSON.stringify(res.user));
            setCurrentUser(res.user);
            navigate('/app');
        } catch (err) {
            console.error("Login error:", err);
            setLoginError(t.network_error);
        }
    };

    const handleTestLogin = async (pin: string, studentName: string) => {
        try {
            // 1. Check IELTS Test PINs
            const pins = await db.get('ielts_test_pins');
            if (Array.isArray(pins)) {
                const validPin = (pins as any[]).find(p => p.pin_code === pin && p.status === 'active');
                if (validPin) {
                    const testId = validPin.test_id;
                    await db.update('ielts_test_pins', validPin.id, { used_count: (validPin.used_count || 0) + 1 });

                    const guestUser: User = {
                        id: 'guest_' + pin + '_' + Date.now(),
                        centerId: 'GLOBAL',
                        name: studentName,
                        username: 'student_' + pin,
                        role: UserRole.STUDENT
                    };

                    setIeltsTestData({ id: testId, pin: pin });
                    setCurrentUser(guestUser);
                    navigate('/app');
                    return;
                }
            }

            // 2. Legacy: Check Leads
            const leads = await db.get('leads');
            const lead = leads.find((l: Lead) => l.testPin === pin && l.testStatus === 'PENDING');

            if (lead) {
                const templates = await db.get('test_templates');
                const template = templates.find((t: TestTemplate) => t.id === lead.testId);

                if (template) {
                    setTestLead(lead);
                    setTestTemplate(template);
                    navigate('/quiz');
                } else {
                    setLoginError(t.test_not_found);
                }
            } else {
                setLoginError('PIN kod noto\'g\'ri yoki eskirgan');
            }
        } catch (err) {
            console.error("Test login error:", err);
            setLoginError(t.test_error);
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        db.logout(); // shaxsiy propuskni ham o'chirish
        localStorage.removeItem('edu_user');
        localStorage.removeItem('edu_user_role');
        navigate('/login');
    };

    return (
        <>
        <Toaster />
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
                path="/login"
                element={
                    !currentUser ? (
                        <Login
                            t={t}
                            onLogin={handleLogin}
                            onTestLogin={handleTestLogin}
                            error={loginError || undefined}
                        />
                    ) : (
                        <Navigate to="/app" replace />
                    )
                }
            />
            <Route
                path="/quiz"
                element={
                    testLead && testTemplate ? (
                        <TestQuiz
                            t={t}
                            lead={testLead}
                            template={testTemplate}
                            onComplete={() => {
                                setTimeout(() => {
                                    setTestLead(null);
                                    setTestTemplate(null);
                                    navigate('/login');
                                }, 3000);
                            }}
                            onLogout={() => {
                                setTestLead(null);
                                setTestTemplate(null);
                                navigate('/login');
                            }}
                        />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />
            <Route
                path="/app/*"
                element={
                    <ProtectedRoute user={currentUser}>
                        {currentUser && (
                            <AuthenticatedApp
                                user={currentUser}
                                onLogout={handleLogout}
                                initialTab={ieltsTestData ? 'ielts' : undefined}
                                testData={ieltsTestData}
                            />
                        )}
                    </ProtectedRoute>
                }
            />
            {/* Catch all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </>
    );
};

export default App;
