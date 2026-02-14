
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { db } from './services/supabase';
import {
  Student, Group, Payment, Attendance, User, UserRole,
  Expense, Lead, SystemSettings, StudentStatus, LeadStatus, LibraryResource, Result
} from './types';
import Layout from './components/Layout';
import MobileLayout from './components/MobileLayout';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Groups from './components/Groups';
import AttendanceManager from './components/Attendance';
import Payments from './components/Payments';
import SalaryCalculation from './components/SalaryCalculation';
import Expenses from './components/Expenses';
import StaffManagement from './components/StaffManagement';
import Leads from './components/Leads';
import Archive from './components/Archive';
import Settings from './components/Settings';
import Login from './components/Login';
import Library from './components/Library';
import Results from './components/Results';
import { CreatorDashboard, CenterControl, BroadcastSystem, SystemLogs } from './components/CreatorComponents';
import TestQuiz from './components/TestQuiz';
import IELTSMain from './components/ielts/IELTSMain';
import IELTSAdmin from './components/ielts/IELTSAdmin';
import TestsManager from './components/ielts/TestsManager';
import { Loader2 } from 'lucide-react';
import { TestTemplate } from './types';
import { translations, Language } from './services/languageContext';
import { sendTelegramMessage } from './services/telegramService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('edu_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const savedRole = localStorage.getItem('edu_user_role');
    return savedRole === UserRole.TEACHER ? 'attendance' : 'dashboard';
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [library, setLibrary] = useState<LibraryResource[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [allSettings, setAllSettings] = useState<SystemSettings[]>([]);
  const [currentSettings, setCurrentSettings] = useState<SystemSettings | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Test topshiruvchi uchun state
  const [testLead, setTestLead] = useState<Lead | null>(null);
  const [testTemplate, setTestTemplate] = useState<TestTemplate | null>(null);
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  const [activeTestPin, setActiveTestPin] = useState<string | null>(null);

  const centerId = currentUser ? (currentUser.centerId || (currentUser as any).centerid || 'GLOBAL') : 'GLOBAL';

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [s, g, p, a, e, u, l, settingsList, lib, res] = await Promise.all([
        db.get('students'),
        db.get('groups'),
        db.get('payments'),
        db.get('attendance'),
        db.get('expenses'),
        db.get('users'),
        db.get('leads'),
        db.get('settings'),
        db.get('library'),
        db.get('results')
      ]);

      const filterByCenter = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        let filtered = list.filter(item => {
          const itemCid = item.centerId || item.centerid;
          return itemCid === centerId || centerId === 'GLOBAL';
        });

        // O'qituvchilar uchun faqat o'ziga tegishli ma'lumotlarni ko'rsatish
        if (currentUser && currentUser.role === UserRole.TEACHER && centerId !== 'GLOBAL') {
          // Baza ma'lumotlaridan yangi o'qituvchi ma'lumotlarini olamiz
          const freshTeacher = Array.isArray(u) ? u.find((usr: any) => usr.id === currentUser.id) : null;
          const userGroupIds = freshTeacher?.groupIds || [];

          // Guruhlar jadvalidan ism bo'yicha ham tekshiramiz (Groups.tsx dagi tayinlovlar uchun)
          const nameMatchedGroupIds = Array.isArray(g)
            ? g.filter((group: any) => group.teacher === currentUser.name).map((group: any) => group.id)
            : [];

          // Ikkala manbani birlashtiramiz
          const myGroupIds = [...new Set([...userGroupIds, ...nameMatchedGroupIds])];

          // O'qituvchining o'quvchilarini aniqlaymiz (Guruhlar ichidagi studentIds orqali)
          const myStudentIds = Array.isArray(g)
            ? g.filter((group: any) => myGroupIds.includes(group.id)).flatMap((group: any) => group.studentIds || [])
            : [];

          if (list === s) return filtered.filter((student: any) => myStudentIds.includes(student.id));
          if (list === g) return filtered.filter((group: any) => myGroupIds.includes(group.id));
          if (list === a) return filtered.filter((att: any) => myGroupIds.includes(att.groupId));
          if (list === p) return filtered.filter((pay: any) => myStudentIds.includes(pay.studentId));
        }
        return filtered;
      };

      setStudents(filterByCenter(s));
      setGroups(filterByCenter(g));
      setPayments(filterByCenter(p));
      setAttendance(filterByCenter(a));
      setExpenses(filterByCenter(e));
      setUsers(filterByCenter(u));
      setLeads(filterByCenter(l));
      setLibrary(filterByCenter(lib));
      setResults(filterByCenter(res));
      setAllSettings(Array.isArray(settingsList) ? settingsList : []);

      if (centerId !== 'GLOBAL' && Array.isArray(settingsList)) {
        const mySettings = settingsList.find((set: any) => set.centerId === centerId);

        // Agar markaz o'chirilgan bo'lsa yoki bloklangan bo'lsa - logout
        if (!mySettings || mySettings.isBlocked) {
          console.warn("Markaz bloklangan yoki o'chirilgan! Logout...");
          setCurrentUser(null);
          localStorage.removeItem('edu_user');
          localStorage.removeItem('edu_user_role');
          setLoginError(mySettings ? "Sizning o'quv markazingiz bloklangan. Creator bilan bog'laning." : "Sizning o'quv markazingiz tizimdan o'chirilgan.");
          return;
        }

        setCurrentSettings(mySettings || null);

        // To'lov eslatmalarini tekshirish va yuborish
        if (mySettings?.botToken && mySettings.notifyPayment) {
          checkAndSendPaymentReminders(filterByCenter(s), mySettings);
        }
      }
    } catch (err) {
      console.error("Ma'lumotlarni yuklashda xatolik:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // To'lov eslatmalarini tekshirish va yuborish funksiyasi
  const checkAndSendPaymentReminders = async (studentsList: Student[], settings: SystemSettings) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().split('T')[0];
    const sentKey = `payment_reminders_${todayKey}`;
    const sentReminders = JSON.parse(localStorage.getItem(sentKey) || '{}');

    for (const student of studentsList) {
      if (!student.nextPaymentDate || !student.tgChatId) continue;

      const dueDate = new Date(student.nextPaymentDate);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Faqat 5, 3, 1 kunlik eslatmalar
      if (![5, 3, 1].includes(daysLeft)) continue;

      const reminderKey = `${student.id}_${daysLeft}`;
      if (sentReminders[reminderKey]) continue; // Allaqachon yuborilgan

      const emoji = daysLeft === 1 ? '⚠️' : '⏰';
      const urgency = daysLeft === 1 ? ' Iltimos, o\'z vaqtida to\'lang!' : '';
      const message = `${emoji} <b>To'lov eslatmasi</b>\n\nHurmatli ota-ona!\nFarzandingiz <b>${student.name}</b> oylik to'loviga <b>${daysLeft} kun</b> qoldi.${urgency}\n\n📅 To'lov sanasi: <b>${student.nextPaymentDate}</b>\n\n<i>${settings.centerName}</i>`;

      try {
        const sent = await sendTelegramMessage(settings.botToken, student.tgChatId, message);
        if (sent) {
          sentReminders[reminderKey] = true;
          console.log(`Eslatma yuborildi: ${student.name} - ${daysLeft} kun qoldi`);
        }
      } catch (err) {
        console.error(`Eslatma yuborishda xatolik (${student.name}):`, err);
      }
    }

    localStorage.setItem(sentKey, JSON.stringify(sentReminders));
  };

  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser, centerId]);

  // Har 30 soniyada markaz holatini tekshirish (blokirovka/o'chirilgan)
  useEffect(() => {
    if (!currentUser || centerId === 'GLOBAL') return;

    const checkCenterStatus = async () => {
      try {
        const centerSettings = await db.getOne('settings', 'centerId', centerId);
        if (!centerSettings || centerSettings.isBlocked) {
          console.warn("Markaz bloklangan yoki o'chirilgan! Avtomatik logout...");
          setCurrentUser(null);
          localStorage.removeItem('edu_user');
          localStorage.removeItem('edu_user_role');
          setLoginError(centerSettings ? "Sizning o'quv markazingiz bloklangan." : "Sizning o'quv markazingiz o'chirilgan.");
        }
      } catch (err) {
        console.error("Status tekshirishda xatolik:", err);
      }
    };

    const interval = setInterval(checkCenterStatus, 30000); // Har 30 soniyada
    return () => clearInterval(interval);
  }, [currentUser, centerId]);

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
      setCurrentUser(superAdmin);
      setActiveTab('creator_dashboard');
      return;
    }

    try {
      // Secure login: Query only the specific user
      const user = await db.getOne('users', 'username', username);

      if (user && user.password === pass) {
        // Markaz holatini tekshirish (GLOBAL bo'lmasa)
        if (user.centerId && user.centerId !== 'GLOBAL') {
          const centerSettings = await db.getOne('settings', 'centerId', user.centerId);
          if (!centerSettings) {
            setLoginError("O'quv markazi topilmadi.");
            return;
          }
          if (centerSettings.isBlocked) {
            setLoginError("Sizning o'quv markazingiz bloklangan. Creator bilan bog'laning.");
            return;
          }
        }

        localStorage.setItem('edu_user_role', user.role);
        localStorage.setItem('edu_user', JSON.stringify(user)); // Save user to local storage
        setCurrentUser(user);
        if (user.role === UserRole.TEACHER) setActiveTab('attendance');
        else setActiveTab(user.role === UserRole.SUPER_ADMIN ? 'creator_dashboard' : 'dashboard');
      } else {
        setLoginError(t.login_error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(t.network_error);
    }
  };

  const handleTestLogin = async (pin: string) => {
    setIsLoading(true);
    try {
      // 1. Check IELTS Test PINs
      const pins = await db.get('ielts_test_pins');
      if (Array.isArray(pins)) {
        const validPin = (pins as any[]).find(p => p.pin_code === pin && p.status === 'active');
        if (validPin) {
          // PIN found!
          const testId = validPin.test_id;

          // Increment usage count
          await db.update('ielts_test_pins', validPin.id, { used_count: (validPin.used_count || 0) + 1 });

          // Log in as guest student
          const guestUser: User = {
            id: 'guest_' + pin,
            centerId: 'GLOBAL', // Tests are global for now or mapped to center via testId
            name: 'Student', // Can be prompts for name later
            username: 'student_' + pin,
            role: UserRole.STUDENT
          };

          setActiveTestId(testId);
          setActiveTestPin(pin);
          setCurrentUser(guestUser);
          setActiveTab('ielts');
          setIsLoading(false);
          return;
        }
      }

      // 2. Legacy: Check Leads (for old test system if still needed)
      const leads = await db.get('leads');
      const lead = leads.find((l: Lead) => l.testPin === pin && l.testStatus === 'PENDING');

      if (lead) {
        const templates = await db.get('test_templates');
        const template = templates.find((t: TestTemplate) => t.id === lead.testId);

        if (template) {
          setTestLead(lead);
          setTestTemplate(template);
        } else {
          setLoginError(t.test_not_found);
        }
      } else {
        setLoginError('PIN kod noto\'g\'ri yoki eskirgan');
      }
    } catch (err) {
      console.error("Test login error:", err);
      setLoginError(t.test_error);
    } finally {
      setIsLoading(false);
    }
  };

  const lang = (localStorage.getItem('edu_lang') as Language) || 'uz';
  const t = translations[lang];

  if (testLead && testTemplate) {
    return (
      <TestQuiz
        t={t}
        lead={testLead}
        template={testTemplate}
        onComplete={() => {
          setTimeout(() => {
            setTestLead(null);
            setTestTemplate(null);
          }, 3000);
        }}
        onLogout={() => {
          setTestLead(null);
          setTestTemplate(null);
        }}
      />
    );
  }

  if (!currentUser) {
    return <Login t={t} onLogin={handleLogin} onTestLogin={handleTestLogin} error={loginError || undefined} />;
  }

  if (isLoading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto" />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">{t.search_loading || "Loading..."}</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard t={t} students={students} groups={groups} payments={payments} attendance={attendance} user={currentUser} expenses={expenses} users={users} leads={leads} />;
      case 'students': return (
        <Students
          t={t}
          students={students}
          groups={groups}
          user={currentUser}
          settings={{ botToken: currentSettings?.botToken || '', centerName: currentSettings?.centerName || "O'quv markazi" }}
          onAdd={(s, gid) => {
            const id = crypto.randomUUID();
            const student = { ...s, id, "centerId": centerId, tgEnabled: false, status: StudentStatus.ACTIVE, tgConnectionCode: '' };
            db.insert('students', student).then(() => {
              if (gid) {
                const group = groups.find(g => g.id === gid);
                if (group) db.update('groups', gid, { studentIds: [...group.studentIds, id] });
              }
              loadAllData();
            });
          }}
          onDelete={id => db.delete('students', id).then(loadAllData)}
          onUpdateStatus={(id, status, lg, lt, note) => db.update('students', id, { status, lastGroup: lg, lastTeacher: lt, exitDate: new Date().toISOString().split('T')[0], exitNote: note }).then(loadAllData)}
          onUpdateStudent={(id, d) => db.update('students', id, d).then(loadAllData)}
        />
      );
      case 'groups': return <Groups t={t} groups={groups} students={students} users={users} user={currentUser} onAddGroup={g => db.insert('groups', { ...g, id: crypto.randomUUID(), "centerId": centerId, studentIds: [] }).then(loadAllData)} onUpdateGroup={(id, d) => db.update('groups', id, d).then(loadAllData)} onAssignStudent={(gid, sid) => { const g = groups.find(x => x.id === gid); if (g) db.update('groups', gid, { studentIds: [...g.studentIds, sid] }).then(loadAllData); }} onRemoveStudent={(gid, sid) => { const g = groups.find(x => x.id === gid); if (g) db.update('groups', gid, { studentIds: g.studentIds.filter(i => i !== sid) }).then(loadAllData); }} onDeleteGroup={id => db.delete('groups', id).then(loadAllData)} />;
      case 'attendance': return <AttendanceManager t={t} settings={currentSettings || ({} as any)} groups={groups} students={students} attendance={attendance} onSave={a => {
        const id = `${a.date}_${a.studentId}_${a.groupId}`;
        db.upsert('attendance', { ...a, id, "centerId": centerId }).then(loadAllData);
      }} />;
      case 'payments': return <Payments t={t} payments={payments} students={students} groups={groups} settings={currentSettings || ({} as any)} onAdd={(p, next) => {
        const student = students.find(s => s.id === p.studentId);
        db.insert('payments', { ...p, id: crypto.randomUUID(), "centerId": centerId }).then(() => {
          // Balance ni oshirish (to'lov qabul qilindi)
          if (student) {
            db.update('students', p.studentId, { balance: (student.balance || 0) + p.amount, ...(next ? { nextPaymentDate: next } : {}) });
          } else if (next) {
            db.update('students', p.studentId, { nextPaymentDate: next });
          }
          loadAllData();
        });
      }} onDelete={(id) => {
        // O'chirishdan oldin to'lov ma'lumotlarini topib, balance ni kamaytirish
        const payment = payments.find(p => p.id === id);
        db.delete('payments', id).then(() => {
          if (payment) {
            const student = students.find(s => s.id === payment.studentId);
            if (student) {
              db.update('students', payment.studentId, { balance: (student.balance || 0) - payment.amount });
            }
          }
          loadAllData();
        });
      }} onEdit={(id, updates) => {
        // To'lovni tahrirlash va balance ni yangilash
        const oldPayment = payments.find(p => p.id === id);
        if (oldPayment) {
          const diff = (updates.amount !== undefined ? updates.amount : oldPayment.amount) - oldPayment.amount;
          db.update('payments', id, updates).then(() => {
            if (diff !== 0) {
              const student = students.find(s => s.id === oldPayment.studentId);
              if (student) {
                db.update('students', oldPayment.studentId, { balance: (student.balance || 0) + diff });
              }
            }
            loadAllData();
          });
        }
      }} />;
      case 'expenses': return <Expenses t={t} expenses={expenses} onAdd={e => db.insert('expenses', { ...e, id: crypto.randomUUID(), "centerId": centerId }).then(loadAllData)} onDelete={id => db.delete('expenses', id).then(loadAllData)} />;
      case 'salary': return <SalaryCalculation t={t} users={users} groups={groups} payments={payments} students={students} currentUser={currentUser} />;
      case 'staff': return <StaffManagement t={t} users={users} groups={groups} onAddUser={u => db.insert('users', { ...u, id: crypto.randomUUID(), "centerId": centerId }).then(loadAllData)} onDeleteUser={id => db.delete('users', id).then(loadAllData)} onUpdateUser={(id, d) => db.update('users', id, d).then(loadAllData)} />;
      case 'leads':
      case 'tests': return <Leads t={t} leads={leads} centerId={centerId} onAdd={l => db.insert('leads', { ...l, id: crypto.randomUUID(), "centerId": centerId }).then(loadAllData)} onDelete={id => db.delete('leads', id).then(loadAllData)} onUpdateStatus={(id, status) => db.update('leads', id, { status }).then(loadAllData)} onRegister={l => db.delete('leads', l.id).then(() => { loadAllData(); setActiveTab('students'); })} onUpdateLead={(id, d) => db.update('leads', id, d).then(loadAllData)} />;
      case 'ielts': return <IELTSMain t={t} centerId={centerId} studentName={currentUser.name} testId={activeTestId} pinCode={activeTestPin} onBack={() => { setActiveTab('dashboard'); setActiveTestId(null); setActiveTestPin(null); }} onComplete={(attempt) => { loadAllData(); }} />;
      case 'ielts_admin': return <IELTSAdmin t={t} centerId={centerId} userRole={currentUser.role} />;
      case 'tests_manager': return <TestsManager t={t} centerId={centerId} userRole={currentUser.role} />;
      case 'archive': return <Archive t={t} students={students} groups={groups} />;
      case 'results': return <Results t={t} results={results} students={students} onAdd={r => db.insert('results', { ...r, id: crypto.randomUUID(), "centerId": centerId }).then(loadAllData)} onDelete={id => db.delete('results', id).then(loadAllData)} />;
      case 'library': return <Library t={t} resources={library} user={currentUser} onAdd={r => db.insert('library', { ...r, id: crypto.randomUUID(), "centerId": centerId, uploadedBy: currentUser.name, uploadedAt: new Date().toISOString() }).then(loadAllData)} onDelete={id => db.delete('library', id).then(loadAllData)} />;
      case 'settings': return <Settings t={t} settings={currentSettings || ({} as any)} onSave={s => db.update('settings', centerId, s).then(loadAllData)} userRole={currentUser.role} />;
      case 'creator_dashboard': return <CreatorDashboard t={t} settings={allSettings} allStudents={students} allPayments={payments} />;
      case 'super_centers': return <CenterControl t={t} settings={allSettings} users={users} onAddCenter={(s, a) => Promise.all([db.insert('settings', s), db.insert('users', a)]).then(loadAllData)} onUpdate={s => db.update('settings', s.centerId, s).then(loadAllData)} onDelete={async (centerId) => {
        try {
          // Database'dan to'g'ridan-to'g'ri barcha foydalanuvchilarni olish
          const allUsers = await db.get('users');
          const centerUsers = allUsers.filter((u: any) => u.centerId === centerId);

          // Barcha foydalanuvchilarni o'chirish
          for (const user of centerUsers) {
            await db.delete('users', user.id);
          }

          // Markaz sozlamalarini o'chirish
          await db.delete('settings', centerId);

          alert("Markaz va barcha foydalanuvchilari o'chirildi!");
          loadAllData();
        } catch (err: any) {
          console.error("O'chirishda xatolik:", err);
          alert("Xatolik: " + (err.message || err));
        }
      }} />;
      case 'broadcast': return <BroadcastSystem t={t} />;
      case 'system_logs': return <SystemLogs t={t} />;
      default: return <Dashboard t={t} students={students} groups={groups} payments={payments} attendance={attendance} user={currentUser} expenses={expenses} users={users} leads={leads} />;
    }
  };

  // Detect if running in native Capacitor app
  const isNativeApp = Capacitor.isNativePlatform();

  // Native APK uses MobileLayout, Web uses regular Layout
  if (isNativeApp) {
    return (
      <MobileLayout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('edu_user');
          localStorage.removeItem('edu_user_role');
        }}
      >
        {renderContent()}
      </MobileLayout>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
    </Layout>
  );
};

export default App;
