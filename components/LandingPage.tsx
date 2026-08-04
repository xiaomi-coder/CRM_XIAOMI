
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

const translations = {
  uz: {
    nav_features: "Imkoniyatlar", nav_how: "Qanday ishlaydi", nav_results: "Natijalar",
    nav_pricing: "Narxlar", nav_reviews: "Fikrlar", nav_partners: "Hamkorlar", nav_login: "Kirish", nav_start: "Boshlash →",
    hero_badge: "🚀 V2.0 — Mock Exam & Natijalar vitrini",
    hero_title: "O'quv markazingizni", hero_title_span: "aqlli boshqaring",
    hero_desc: "O'quvchilar, to'lovlar, davomat, mock examlar, IELTS/CEFR natijalar — barchasini yagona CRM platformasidan boshqaring. Avtomatik to'lov eslatmalari, rol tizimi va natijalar vitrini.",
    hero_cta_free: "Bepul boshlash",
    hero_cta_demo: "Jonli demo",
    nav_guide: "Qo'llanma",
    stat_centers: "O'quv markazlar", stat_students: "O'quvchilar",
    dash_students: "O'quvchilar", dash_groups: "Guruhlar", dash_income: "Oylik tushum",
    float_reminder: "Avto eslatma", float_sent: "✓ Yuborildi",
    trusted_title: "Ishonch bildirgan o'quv markazlar",
    features_label: "Imkoniyatlar",
    features_title: "Boshqaruvning", features_title_span: "barcha vositalari", features_title_end: "bitta joyda",
    features_desc: "O'quv markazingiz faoliyatini to'liq avtomatlashtiring — qo'lda ishlashni to'xtating",
    f1_title: "O'quvchilar bazasi", f1_desc: "Barcha o'quvchilar ma'lumotlari, ota-onalar kontaktlari, bilim darajasi va to'lov tarixi yagona bazada.",
    f2_title: "Avtomatik to'lov eslatma", f2_desc: "To'lov muddati yaqinlashganda o'quvchi va ota-onalarga avtomatik SMS/Telegram eslatma yuboriladi. Qarzdorlikni nazorat qiling.",
    f3_title: "Davomat tizimi", f3_desc: "Elektron davomat, kunlik hisobotlar va ota-onalarga avtomatik xabarnoma. Real vaqtda statistika.",
    f4_title: "Mock Exam tizimi", f4_desc: "IELTS, CEFR, DTM va boshqa formatdagi mock imtihonlarni o'tkazing. Natijalar avtomatik hisoblanadi va tahlil qilinadi.",
    f5_title: "Natijalar vitrini", f5_desc: "O'quvchilarning IELTS/CEFR natijalari, universitetga kirganlik haqida rasm va ma'lumotlarni ko'rsating. Markazingiz reytingini oshiring.",
    f6_title: "Rol tizimi (Admin / O'qituvchi)", f6_desc: "Admin va o'qituvchilarga turli darajadagi ruxsatlar bering. Har bir xodim faqat o'ziga tegishli ma'lumotlarni ko'radi.",
    f7_title: "Testlar va imtihonlar", f7_desc: "Onlayn testlar yarating, natijalarni avtomatik hisoblang. DTM va xalqaro formatlar qo'llab-quvvatlanadi.",
    f8_title: "Shaxsiy Telegram Bot", f8_desc: "Har bir o'quv markazning o'z shaxsiy Telegram boti! Ota-onalarga davomat, to'lov eslatma va to'lov qabul qilinganligi haqida avtomatik xabar yuboriladi.",
    f9_title: "Excel & Word eksport", f9_desc: "O'quvchilar, guruhlar, davomat — barcha bo'limlardan ma'lumotlarni Excel va Word formatda eksport qiling. Hisobotlarni bir klik bilan yuklab oling.",
    f10_title: "Xodimlar boshqaruvi", f10_desc: "O'qituvchilar va xodimlar bazasi, ish grafigi, avtomatik oylik hisoblash va samaradorlik tahlili.",
    stat_support: "Qo'llab-quvvatlash",
    partners_label: "Hamkorlar", partners_title: "Bizning", partners_title_span: "hamkorlarimiz",
    tag_new: "Yangi", tag_popular: "Mashhur",
    how_label: "Qanday ishlaydi", how_title: "4 oddiy qadamda", how_title_span: "boshlang",
    s1_title: "Ro'yxatdan o'ting", s1_desc: "1 daqiqada o'zingiz ro'yxatdan o'tasiz — 14 kun bepul, karta shart emas. Yoki avval jonli demoni sinab ko'ring.",
    s2_title: "Tizimni sozlash", s2_desc: "Guruhlar, o'quvchilar va rollarni kiritasiz. Skrinshotli qo'llanma har qadamda yordam beradi.",
    s3_title: "Xodimlarni o'rgatish", s3_desc: "Admin va o'qituvchilarga tizimdan foydalanishni o'rgatamiz. Savol bo'lsa Telegram'da yordam beramiz.",
    s4_title: "Ishlashni boshlang!", s4_desc: "Hamma narsa avtomatlashtirilgan. To'lov eslatmalar, davomat, natijalar — barchasi ishlaydi.",
    results_label: "Natijalar vitrini", results_title: "O'quvchilaringiz", results_title_span: "muvaffaqiyatlari",
    results_desc: "Har bir o'quv markaz o'z o'quvchilarining natijalarini rasm bilan tizimga joylash imkoniyatiga ega",
    pricing_label: "Narxlar", pricing_title: "O'zingizga mos", pricing_title_span: "tarifni tanlang",
    pricing_desc: "Oddiy va shaffof narxlar. 14 kun bepul sinov davri.",
    plan1_name: "Standart", plan1_desc: "Yangi boshlayotgan o'quv markazlar uchun",
    plan1_f1: "O'quvchilar bazasi", plan1_f2: "Guruhlar boshqaruvi", plan1_f3: "Davomat tizimi",
    plan1_f4: "To'lovlar nazorati", plan1_f5: "SMS eslatmalar", plan1_f6: "Xodimlar boshqaruvi",
    plan1_f7: "Admin / O'qituvchi rollari", plan1_f8: "Excel & Word eksport", plan1_f9: "Shaxsiy Telegram Bot", plan1_f10: "Mock Exam tizimi", plan1_f11: "Natijalar vitrini",
    plan2_name: "Premium", plan2_desc: "To'liq funksional — barcha imkoniyatlar",
    plan2_f1: "Standart tarifning barchasi", plan2_f2: "Shaxsiy Telegram Bot",
    plan2_f3: "Mock Exam (IELTS, CEFR, DTM)",
    plan2_f4: "Natijalar vitrini (rasmli)",
    plan2_f5: "Avto to'lov eslatmalari", plan2_f6: "Kengaytirilgan hisobotlar",
    plan2_f7: "Priority qo'llab-quvvatlash", plan2_f8: "Yangi funksiyalarga birinchi kirish",
    plan_cta_start: "Boshlash", plan_cta_premium: "Premium boshlash →",
    reviews_label: "Mijozlar fikrlari", reviews_title: "Bizga", reviews_title_span: "ishonch bildirishadi",
    review1_text: '"EduControl tizimini ishlatganimizdan keyin qarzdorlik keskin kamaydi. Avtomatik to\'lov eslatma juda qulay — endi qo\'lda qo\'ng\'iroq qilmaymiz."',
    review2_text: '"Mock Exam tizimi juda zo\'r! O\'quvchilarimiz IELTS ga tayyorgarlik ko\'rishda katta yordam berdi. Natijalar vitrini ham motivatsiya uchun ajoyib."',
    review3_text: '"Admin va o\'qituvchi uchun alohida rollar borligini juda yoqtirdim. Har bir xodim faqat o\'ziga kerakli ma\'lumotlarni ko\'radi. Xavfsiz va qulay."',
    cta_title: "O'quv markazingizni", cta_title_span: "yangi bosqichga", cta_title_end: "olib chiqing",
    cta_desc: "14 kun bepul sinov davri. Ro'yxatdan o'tish 1 daqiqa.",
    cta_register: "Bepul boshlash →",
    cta_telegram: "Telegram orqali savol", cta_call: "📞 +998 90 612 71 71",
    footer_desc: "O'quv markazlar uchun zamonaviy CRM tizimi. Boshqaruvni soddalashtiring, samaradorlikni oshiring.",
    footer_product: "Mahsulot", footer_company: "Kompaniya", footer_support: "Qo'llab-quvvatlash",
    tg_tooltip: "Savolingiz bormi? Yozing!"
  },
  ru: {
    nav_features: "Возможности", nav_how: "Как это работает", nav_results: "Результаты",
    nav_pricing: "Цены", nav_reviews: "Отзывы", nav_partners: "Партнёры", nav_login: "Войти", nav_start: "Начать →",
    hero_badge: "🚀 V2.0 — Mock Exam & Витрина результатов",
    hero_title: "Управляйте учебным", hero_title_span: "центром умнее",
    hero_desc: "Ученики, платежи, посещаемость, mock экзамены, результаты IELTS/CEFR — управляйте всем с единой CRM платформы. Автоматические напоминания, система ролей и витрина результатов.",
    hero_cta_free: "Начать бесплатно",
    hero_cta_demo: "Живое демо",
    nav_guide: "Руководство",
    stat_centers: "Учебных центров", stat_students: "Учеников",
    dash_students: "Ученики", dash_groups: "Группы", dash_income: "Доход/мес",
    float_reminder: "Авто напоминание", float_sent: "✓ Отправлено",
    trusted_title: "Нам доверяют учебные центры",
    features_label: "Возможности",
    features_title: "Все инструменты", features_title_span: "управления", features_title_end: "в одном месте",
    features_desc: "Полная автоматизация учебного центра — перестаньте работать вручную",
    f1_title: "База учеников", f1_desc: "Все данные учеников, контакты родителей, уровень знаний и история платежей в единой базе.",
    f2_title: "Авто напоминания об оплате", f2_desc: "При приближении срока оплаты ученикам и родителям автоматически отправляется SMS/Telegram напоминание.",
    f3_title: "Система посещаемости", f3_desc: "Электронная посещаемость, ежедневные отчёты и автоматические уведомления родителям.",
    f4_title: "Система Mock Exam", f4_desc: "Проводите пробные экзамены в форматах IELTS, CEFR, DTM. Результаты автоматически рассчитываются и анализируются.",
    f5_title: "Витрина результатов", f5_desc: "Показывайте результаты IELTS/CEFR учеников, поступление в университеты с фото. Повышайте рейтинг центра.",
    f6_title: "Система ролей (Админ / Учитель)", f6_desc: "Назначайте разные уровни доступа. Каждый сотрудник видит только свои данные.",
    f7_title: "Тесты и экзамены", f7_desc: "Создавайте онлайн тесты, автоматически подсчитывайте результаты. Поддержка форматов DTM и международных.",
    f8_title: "Персональный Telegram Бот", f8_desc: "У каждого учебного центра свой Telegram бот! Родителям автоматически отправляются уведомления о посещаемости, напоминания об оплате и подтверждение платежей.",
    f9_title: "Экспорт в Excel и Word", f9_desc: "Ученики, группы, посещаемость — экспортируйте данные из любого раздела в Excel или Word. Скачайте отчёты в один клик.",
    f10_title: "Управление персоналом", f10_desc: "База учителей и сотрудников, график работы, автоматический расчёт зарплаты и анализ эффективности.",
    stat_support: "Поддержка",
    partners_label: "Партнёры", partners_title: "Наши", partners_title_span: "партнёры",
    tag_new: "Новое", tag_popular: "Популярное",
    how_label: "Как это работает", how_title: "Начните за", how_title_span: "4 простых шага",
    s1_title: "Зарегистрируйтесь", s1_desc: "Сами за 1 минуту — 14 дней бесплатно, карта не нужна. Или сначала попробуйте живое демо.",
    s2_title: "Настройка системы", s2_desc: "Настроим центр, группы, учеников и роли. Мы поможем.",
    s3_title: "Обучение сотрудников", s3_desc: "Обучим админов и учителей работе с системой. Есть видео инструкции.",
    s4_title: "Начинайте работать!", s4_desc: "Всё автоматизировано. Напоминания, посещаемость, результаты — всё работает.",
    results_label: "Витрина результатов", results_title: "Успехи", results_title_span: "ваших учеников",
    results_desc: "Каждый учебный центр может размещать результаты учеников с фото в системе",
    pricing_label: "Цены", pricing_title: "Выберите подходящий", pricing_title_span: "тариф",
    pricing_desc: "Простые и прозрачные цены. 14 дней бесплатного тестирования.",
    plan1_name: "Стандарт", plan1_desc: "Для начинающих учебных центров",
    plan1_f1: "База учеников", plan1_f2: "Управление группами", plan1_f3: "Система посещаемости",
    plan1_f4: "Контроль платежей", plan1_f5: "SMS напоминания", plan1_f6: "Управление персоналом",
    plan1_f7: "Роли Админ / Учитель", plan1_f8: "Экспорт в Excel и Word", plan1_f9: "Персональный Telegram Бот", plan1_f10: "Система Mock Exam", plan1_f11: "Витрина результатов",
    plan2_name: "Премиум", plan2_desc: "Полный функционал — все возможности",
    plan2_f1: "Всё из тарифа Стандарт", plan2_f2: "Персональный Telegram Бот",
    plan2_f3: "Mock Exam (IELTS, CEFR, DTM)",
    plan2_f4: "Витрина результатов (с фото)",
    plan2_f5: "Авто напоминания об оплате", plan2_f6: "Расширенные отчёты",
    plan2_f7: "Приоритетная поддержка", plan2_f8: "Первый доступ к новым функциям",
    plan_cta_start: "Начать", plan_cta_premium: "Начать Премиум →",
    reviews_label: "Отзывы клиентов", reviews_title: "Нам", reviews_title_span: "доверяют",
    review1_text: '"После внедрения EduControl задолженность резко сократилась. Автоматические напоминания — очень удобно, больше не звоним вручную."',
    review2_text: '"Система Mock Exam — супер! Очень помогла ученикам при подготовке к IELTS. Витрина результатов отлично мотивирует."',
    review3_text: '"Очень нравится, что есть отдельные роли для админа и учителя. Каждый видит только нужную информацию. Безопасно и удобно."',
    cta_title: "Выведите учебный центр на", cta_title_span: "новый уровень", cta_title_end: "",
    cta_desc: "14 дней бесплатно. Регистрация занимает 1 минуту.",
    cta_register: "Начать бесплатно →",
    cta_telegram: "Вопрос в Telegram", cta_call: "📞 +998 90 612 71 71",
    footer_desc: "Современная CRM система для учебных центров. Упростите управление, повысьте эффективность.",
    footer_product: "Продукт", footer_company: "Компания", footer_support: "Поддержка",
    tg_tooltip: "Есть вопросы? Напишите!"
  },
  en: {
    nav_features: "Features", nav_how: "How it works", nav_results: "Results",
    nav_pricing: "Pricing", nav_reviews: "Reviews", nav_partners: "Partners", nav_login: "Login", nav_start: "Get Started →",
    hero_badge: "🚀 V2.0 — Mock Exam & Results Showcase",
    hero_title: "Manage your learning", hero_title_span: "center smarter",
    hero_desc: "Students, payments, attendance, mock exams, IELTS/CEFR results — manage everything from a single CRM platform. Auto payment reminders, role system and results showcase.",
    hero_cta_free: "Start for free",
    hero_cta_demo: "Live demo",
    nav_guide: "Guide",
    stat_centers: "Learning centers", stat_students: "Students",
    dash_students: "Students", dash_groups: "Groups", dash_income: "Revenue/mo",
    float_reminder: "Auto reminder", float_sent: "✓ Sent",
    trusted_title: "Trusted by learning centers",
    features_label: "Features",
    features_title: "All management", features_title_span: "tools", features_title_end: "in one place",
    features_desc: "Fully automate your learning center — stop manual work",
    f1_title: "Student database", f1_desc: "All student data, parent contacts, proficiency levels and payment history in a single database.",
    f2_title: "Auto payment reminders", f2_desc: "Automatic SMS/Telegram reminders sent to students and parents when payment deadlines approach.",
    f3_title: "Attendance system", f3_desc: "Electronic attendance, daily reports and automatic notifications to parents. Real-time statistics.",
    f4_title: "Mock Exam system", f4_desc: "Conduct mock exams in IELTS, CEFR, DTM formats. Results are automatically calculated and analyzed.",
    f5_title: "Results showcase", f5_desc: "Display students' IELTS/CEFR results, university admissions with photos. Boost your center's reputation.",
    f6_title: "Role system (Admin / Teacher)", f6_desc: "Assign different access levels to admins and teachers. Each staff member sees only their relevant data.",
    f7_title: "Tests & exams", f7_desc: "Create online tests, auto-calculate results. DTM and international formats supported.",
    f8_title: "Personal Telegram Bot", f8_desc: "Each learning center gets its own Telegram bot! Parents automatically receive notifications about attendance, payment reminders and payment confirmations.",
    f9_title: "Excel & Word export", f9_desc: "Students, groups, attendance — export data from any section to Excel or Word format. Download reports in one click.",
    f10_title: "Staff management", f10_desc: "Teachers and staff database, work schedules, automatic salary calculation and performance analytics.",
    stat_support: "Support",
    partners_label: "Partners", partners_title: "Our", partners_title_span: "partners",
    tag_new: "New", tag_popular: "Popular",
    how_label: "How it works", how_title: "Start in", how_title_span: "4 easy steps",
    s1_title: "Sign up yourself", s1_desc: "Takes 1 minute — 14 days free, no card required. Or try the live demo first.",
    s2_title: "System setup", s2_desc: "We'll set up your center, groups, students and roles. We'll help you.",
    s3_title: "Staff training", s3_desc: "We'll train your admins and teachers to use the system. Video guides available.",
    s4_title: "Start working!", s4_desc: "Everything is automated. Payment reminders, attendance, results — it all works.",
    results_label: "Results showcase", results_title: "Your students'", results_title_span: "achievements",
    results_desc: "Each learning center can post student results with photos in the system",
    pricing_label: "Pricing", pricing_title: "Choose the right", pricing_title_span: "plan for you",
    pricing_desc: "Simple and transparent pricing. 14-day free trial.",
    plan1_name: "Standard", plan1_desc: "For new learning centers",
    plan1_f1: "Student database", plan1_f2: "Group management", plan1_f3: "Attendance system",
    plan1_f4: "Payment control", plan1_f5: "SMS reminders", plan1_f6: "Staff management",
    plan1_f7: "Admin / Teacher roles", plan1_f8: "Excel & Word export", plan1_f9: "Personal Telegram Bot", plan1_f10: "Mock Exam system", plan1_f11: "Results showcase",
    plan2_name: "Premium", plan2_desc: "Full functionality — all features",
    plan2_f1: "Everything in Standard", plan2_f2: "Personal Telegram Bot",
    plan2_f3: "Mock Exam (IELTS, CEFR, DTM)",
    plan2_f4: "Results showcase (with photos)",
    plan2_f5: "Auto payment reminders", plan2_f6: "Extended reports",
    plan2_f7: "Priority support", plan2_f8: "Early access to new features",
    plan_cta_start: "Get Started", plan_cta_premium: "Start Premium →",
    reviews_label: "Client reviews", reviews_title: "They", reviews_title_span: "trust us",
    review1_text: '"After implementing EduControl, overdue payments dropped dramatically. Auto payment reminders are very convenient — no more manual calls."',
    review2_text: '"The Mock Exam system is amazing! It greatly helped our students prepare for IELTS. The results showcase is great for motivation too."',
    review3_text: '"I really like the separate roles for admin and teacher. Each staff member sees only what they need. Secure and convenient."',
    cta_title: "Take your learning center", cta_title_span: "to the next level", cta_title_end: "",
    cta_desc: "14-day free trial. Signing up takes 1 minute.",
    cta_register: "Start for free →",
    cta_telegram: "Ask via Telegram", cta_call: "📞 +998 90 612 71 71",
    footer_desc: "Modern CRM system for learning centers. Simplify management, boost efficiency.",
    footer_product: "Product", footer_company: "Company", footer_support: "Support",
    tg_tooltip: "Have questions? Write us!"
  }
};

interface LandingPageProps {
  /** "Jonli demo" tugmasi — App demo propusk olib /app ga o'tkazadi */
  onDemo?: () => Promise<void>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onDemo }) => {
  const [lang, setLang] = useState<'uz' | 'ru' | 'en'>('uz');
  const [demoLoading, setDemoLoading] = useState(false);
  const navigate = useNavigate();
  const t = translations[lang];

  const startDemo = async () => {
    if (!onDemo || demoLoading) return;
    setDemoLoading(true);
    try { await onDemo(); } finally { setDemoLoading(false); }
  };

  // Izchil chiziqli ikonka to'plami (emoji o'rniga — professional ko'rinish)
  const svgP = {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  const featureIcons: React.ReactNode[] = [
    // 0 — O'quvchilar bazasi
    <svg {...svgP}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    // 1 — To'lov eslatma (hamyon)
    <svg {...svgP}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>,
    // 2 — Davomat (clipboard-check)
    <svg {...svgP}><path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1Z" /><path d="m9 14 2 2 4-4" /></svg>,
    // 3 — Mock Exam (target)
    <svg {...svgP}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></svg>,
    // 4 — Natijalar vitrini (award)
    <svg {...svgP}><circle cx="12" cy="8" r="6" /><path d="M8.5 13.5 7 22l5-3 5 3-1.5-8.5" /></svg>,
    // 5 — Rol tizimi (shield)
    <svg {...svgP}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-4" /></svg>,
    // 6 — Testlar (file-text)
    <svg {...svgP}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 13h6" /><path d="M9 17h4" /></svg>,
    // 7 — Telegram Bot (chat)
    <svg {...svgP}><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2Z" /><circle cx="9" cy="10" r="1" /><circle cx="15" cy="10" r="1" /></svg>,
    // 8 — Excel/Word eksport (download)
    <svg {...svgP}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>,
    // 9 — Xodimlar (briefcase)
    <svg {...svgP}><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><path d="M2 13h20" /></svg>,
  ];

  useEffect(() => {
    // Add specific class to body for landing page isolation
    document.body.classList.add('landing-page-body');

    return () => {
      // Remove class when leaving landing page
      document.body.classList.remove('landing-page-body');
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.landing-reveal').forEach(el => observer.observe(el));

    const handleScroll = () => {
      const navbar = document.getElementById('navbar');
      if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Raqamlarni 0'dan sanab chiqarish (count-up) — element ko'ringanda ishga tushadi
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
    const format = (el: HTMLElement, val: number) => {
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      return (el.dataset.prefix || '') + val.toFixed(decimals) + (el.dataset.suffix || '');
    };
    const run = (el: HTMLElement) => {
      const target = parseFloat(el.dataset.countup || '0');
      if (reduce) { el.textContent = format(el, target); return; }
      const duration = 1400;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        el.textContent = format(el, target * easeOut(p));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = format(el, target);
      };
      requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          run(e.target as HTMLElement);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    document.querySelectorAll<HTMLElement>('[data-countup]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobile = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const openLogin = () => {
    navigate('/login');
  };

  return (
    <div className="landing-page">
      <nav className="landing-navbar" id="navbar">
        <div className="landing-container">
          <a href="#" className="landing-logo">
            <div className="landing-logo-icon">E</div>
            <div className="landing-logo-text">Edu<span>Control</span></div>
          </a>
          <ul className="landing-nav-links" style={{ display: mobileMenuOpen ? 'flex' : '' }}>
            <li><a href="#features">{t.nav_features}</a></li>
            <li><a href="#how">{t.nav_how}</a></li>
            <li><a href="#results">{t.nav_results}</a></li>
            <li><a href="#pricing">{t.nav_pricing}</a></li>
            <li><a href="#reviews">{t.nav_reviews}</a></li>
            <li><a href="#partners">{t.nav_partners}</a></li>
            <li><a href="/guide" onClick={(e) => { e.preventDefault(); navigate('/guide'); }}>{t.nav_guide}</a></li>
          </ul>
          <div className="landing-nav-right">
            <div className="landing-lang-switcher">
              <button className={`landing-lang-btn ${lang === 'uz' ? 'active' : ''}`} onClick={() => setLang('uz')}>UZ</button>
              <button className={`landing-lang-btn ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</button>
              <button className={`landing-lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</button>
            </div>
            <button className="landing-btn-ghost" onClick={openLogin}>{t.nav_login}</button>
            <button className="landing-btn-primary-sm" onClick={() => navigate('/register')}>{t.nav_start}</button>
            <button className="landing-mobile-toggle" onClick={toggleMobile}>☰</button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="landing-hero">
        <div className="landing-grid-bg"></div>
        <div className="landing-container">
          <div className="landing-hero-grid">
            <div className="landing-hero-content">
              <div className="landing-badge">{t.hero_badge}</div>
              <h1>
                {t.hero_title}<br />
                <span className="landing-gradient-text">{t.hero_title_span}</span>
              </h1>
              <p>{t.hero_desc}</p>
              <div className="landing-hero-actions">
                <button className="landing-btn-large primary" onClick={() => navigate('/register')}>
                  {t.hero_cta_free}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </button>
                <button className="landing-btn-large secondary" onClick={startDemo} disabled={demoLoading}>
                  {demoLoading ? '...' : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                      {t.hero_cta_demo}
                    </>
                  )}
                </button>
              </div>
              <div className="landing-hero-stats">
                <div className="landing-hero-stat">
                  <h3 data-countup="3" data-suffix="+">3+</h3>
                  <p>{t.stat_centers}</p>
                </div>
                <div className="landing-hero-stat">
                  <h3 data-countup="150" data-suffix="+">150+</h3>
                  <p>{t.stat_students}</p>
                </div>
                <div className="landing-hero-stat">
                  <h3>16/7</h3>
                  <p>{t.stat_support}</p>
                </div>
              </div>
            </div>
            <div className="landing-hero-visual">
              <div className="landing-dashboard-preview">
                <div className="landing-dashboard-header">
                  <div className="landing-dot red"></div><div className="landing-dot yellow"></div><div className="landing-dot green"></div>
                  <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>EduControl Dashboard</span>
                </div>
                <div className="landing-dashboard-shell">
                  <aside className="landing-dash-sidebar">
                    <span className="landing-dash-logo">E</span>
                    <span className="landing-dash-nav active" aria-label="Boshqaruv"><svg {...svgP}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg></span>
                    <span className="landing-dash-nav" aria-label="O'quvchilar"><svg {...svgP}><circle cx="9" cy="7" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0" /><path d="M16 4.2a3.2 3.2 0 0 1 0 5.6" /></svg></span>
                    <span className="landing-dash-nav" aria-label="Guruhlar"><svg {...svgP}><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></svg></span>
                    <span className="landing-dash-nav" aria-label="To'lovlar"><svg {...svgP}><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /></svg></span>
                    <span className="landing-dash-nav" aria-label="Natijalar"><svg {...svgP}><circle cx="12" cy="9" r="5" /><path d="m8.5 13-1 8 4.5-3 4.5 3-1-8" /></svg></span>
                  </aside>
                  <div className="landing-dashboard-body">
                    <div className="landing-dash-titlerow">
                      <span className="landing-dash-title">Boshqaruv paneli</span>
                      <span className="landing-dash-chip">Iyul 2026</span>
                    </div>
                    <div className="landing-dash-row">
                      <div className="landing-dash-card">
                        <div className="landing-dash-card-label">{t.dash_students}</div>
                        <div className="landing-dash-card-value green" data-countup="152">152</div>
                      </div>
                      <div className="landing-dash-card">
                        <div className="landing-dash-card-label">{t.dash_groups}</div>
                        <div className="landing-dash-card-value purple" data-countup="12">12</div>
                      </div>
                      <div className="landing-dash-card">
                        <div className="landing-dash-card-label">{t.dash_income}</div>
                        <div className="landing-dash-card-value pink" data-countup="38.8" data-decimals="1" data-suffix="M">38.8M</div>
                      </div>
                    </div>
                    <div className="landing-dash-chart">
                      <div className="landing-chart-bar" style={{ height: '40%', animationDelay: '0.1s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '65%', animationDelay: '0.2s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '45%', animationDelay: '0.3s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '80%', animationDelay: '0.4s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '55%', animationDelay: '0.5s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '90%', animationDelay: '0.6s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '70%', animationDelay: '0.7s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '95%', animationDelay: '0.8s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '60%', animationDelay: '0.9s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '85%', animationDelay: '1.0s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '75%', animationDelay: '1.1s' }}></div>
                      <div className="landing-chart-bar" style={{ height: '100%', animationDelay: '1.2s' }}></div>
                    </div>
                    <div className="landing-dash-list">
                      <div className="landing-dash-listrow">
                        <span className="landing-dash-ava">AV</span>
                        <span className="landing-dash-listname">Ali Valiyev</span>
                        <span className="landing-dash-listgroup">IELTS-1</span>
                        <span className="landing-dash-pill paid">To'landi</span>
                      </div>
                      <div className="landing-dash-listrow">
                        <span className="landing-dash-ava alt">MN</span>
                        <span className="landing-dash-listname">Malika Nur</span>
                        <span className="landing-dash-listgroup">CEFR-2</span>
                        <span className="landing-dash-pill due">Kutilmoqda</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="landing-float-card card-1">
                <div className="landing-float-icon">🎯</div>
                <div className="landing-float-label">Mock Exam</div>
                <div className="landing-float-value">IELTS 7.0</div>
              </div>
              <div className="landing-float-card card-2">
                <div className="landing-float-icon">💬</div>
                <div className="landing-float-label">{t.float_reminder}</div>
                <div className="landing-float-value" style={{ fontSize: '13px', color: 'var(--primary-light)' }}>{t.float_sent}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED */}
      <section className="landing-trusted">
        <div className="landing-container">
          <div className="landing-trusted-text">{t.trusted_title}</div>
          <div className="landing-trusted-logos">
            <span className="landing-trusted-logo">EMPIRESCHOOL</span>
            <span className="landing-trusted-logo">IELTS +</span>
            <span className="landing-trusted-logo">BUYUK KELAJAK</span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="landing-section" id="features">
        <div className="landing-container">
          <div className="landing-reveal" style={{ textAlign: 'center' }}>
            <div className="landing-section-label">{t.features_label}</div>
            <div className="landing-section-title" style={{ margin: '0 auto 16px' }}>
              {t.features_title} <span className="landing-gradient-text">{t.features_title_span}</span> {t.features_title_end}
            </div>
            <div className="landing-section-desc" style={{ margin: '0 auto' }}>{t.features_desc}</div>
          </div>
          <div className="landing-features-grid">
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[0]}</div>
              <h3>{t.f1_title}</h3>
              <p>{t.f1_desc}</p>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[1]}</div>
              <h3>{t.f2_title}</h3>
              <p>{t.f2_desc}</p>
              <span className="landing-feature-tag popular">{t.tag_popular}</span>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[2]}</div>
              <h3>{t.f3_title}</h3>
              <p>{t.f3_desc}</p>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[3]}</div>
              <h3>{t.f4_title}</h3>
              <p>{t.f4_desc}</p>
              <span className="landing-feature-tag new">{t.tag_new}</span>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[4]}</div>
              <h3>{t.f5_title}</h3>
              <p>{t.f5_desc}</p>
              <span className="landing-feature-tag new">{t.tag_new}</span>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[5]}</div>
              <h3>{t.f6_title}</h3>
              <p>{t.f6_desc}</p>
              <span className="landing-feature-tag new">{t.tag_new}</span>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[6]}</div>
              <h3>{t.f7_title}</h3>
              <p>{t.f7_desc}</p>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[7]}</div>
              <h3>{t.f8_title}</h3>
              <p>{t.f8_desc}</p>
              <span className="landing-feature-tag new">{t.tag_new}</span>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[8]}</div>
              <h3>{t.f9_title}</h3>
              <p>{t.f9_desc}</p>
              <span className="landing-feature-tag new">{t.tag_new}</span>
            </div>
            <div className="landing-feature-card landing-reveal">
              <div className="landing-feature-icon">{featureIcons[9]}</div>
              <h3>{t.f10_title}</h3>
              <p>{t.f10_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="landing-section" id="how" style={{ background: 'var(--dark-surface)' }}>
        <div className="landing-container">
          <div className="landing-reveal" style={{ textAlign: 'center' }}>
            <div className="landing-section-label">{t.how_label}</div>
            <div className="landing-section-title">
              {t.how_title} <span className="landing-gradient-text">{t.how_title_span}</span>
            </div>
          </div>
          <div className="landing-steps-grid">
            <div className="landing-step landing-reveal">
              <div className="landing-step-number">1</div>
              <h4>{t.s1_title}</h4>
              <p>{t.s1_desc}</p>
            </div>
            <div className="landing-step landing-reveal">
              <div className="landing-step-number">2</div>
              <h4>{t.s2_title}</h4>
              <p>{t.s2_desc}</p>
            </div>
            <div className="landing-step landing-reveal">
              <div className="landing-step-number">3</div>
              <h4>{t.s3_title}</h4>
              <p>{t.s3_desc}</p>
            </div>
            <div className="landing-step landing-reveal">
              <div className="landing-step-number">4</div>
              <h4>{t.s4_title}</h4>
              <p>{t.s4_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS SHOWCASE */}
      <section className="landing-section landing-results-section" id="results">
        <div className="landing-container">
          <div className="landing-reveal" style={{ textAlign: 'center' }}>
            <div className="landing-section-label">{t.results_label}</div>
            <div className="landing-section-title">
              {t.results_title} <span className="landing-gradient-text">{t.results_title_span}</span>
            </div>
            <div className="landing-section-desc" style={{ margin: '0 auto' }}>{t.results_desc}</div>
          </div>
          <div className="landing-results-grid">
            <div className="landing-result-card landing-reveal">
              <div className="landing-result-img" style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)' }}>
                🎓
                <div className="landing-result-badge-type ielts">IELTS</div>
              </div>
              <div className="landing-result-info">
                <div className="landing-result-name">Jasurbek Alimov</div>
                <div className="landing-result-detail">IELTS Academic</div>
                <div className="landing-result-score" style={{ color: 'var(--accent)' }}>Band 7.5</div>
              </div>
            </div>
            <div className="landing-result-card landing-reveal">
              <div className="landing-result-img" style={{ background: 'linear-gradient(135deg, #0d1b2a, #1b263b)' }}>
                🏅
                <div className="landing-result-badge-type cefr">CEFR</div>
              </div>
              <div className="landing-result-info">
                <div className="landing-result-name">Madina Karimova</div>
                <div className="landing-result-detail">CEFR English</div>
                <div className="landing-result-score" style={{ color: 'var(--primary-light)' }}>B2 Level</div>
              </div>
            </div>
            <div className="landing-result-card landing-reveal">
              <div className="landing-result-img" style={{ background: 'linear-gradient(135deg, #12211c, #163a30)' }}>
                🎓
                <div className="landing-result-badge-type uni">Universitet</div>
              </div>
              <div className="landing-result-info">
                <div className="landing-result-name">Shaxzod Raximov</div>
                <div className="landing-result-detail">Inha University, Korea</div>
                <div className="landing-result-score" style={{ color: '#FCD34D' }}>✓ Qabul qilindi</div>
              </div>
            </div>
            <div className="landing-result-card landing-reveal">
              <div className="landing-result-img" style={{ background: 'linear-gradient(135deg, #1a2332, #1b3a4b)' }}>
                📋
                <div className="landing-result-badge-type dtm">DTM</div>
              </div>
              <div className="landing-result-info">
                <div className="landing-result-name">Nilufar Saidova</div>
                <div className="landing-result-detail">DTM — Ingliz tili</div>
                <div className="landing-result-score" style={{ color: 'var(--accent)' }}>189.5 ball</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="landing-section" id="pricing">
        <div className="landing-container">
          <div className="landing-reveal" style={{ textAlign: 'center' }}>
            <div className="landing-section-label">{t.pricing_label}</div>
            <div className="landing-section-title">
              {t.pricing_title} <span className="landing-gradient-text">{t.pricing_title_span}</span>
            </div>
            <div className="landing-section-desc" style={{ margin: '0 auto' }}>{t.pricing_desc}</div>
          </div>
          <div className="landing-pricing-grid">
            {/* Standart */}
            <div className="landing-price-card landing-reveal">
              <div className="landing-price-name">{t.plan1_name}</div>
              <div className="landing-price-amount">149K <span>so'm/oy</span></div>
              <div className="landing-price-desc">{t.plan1_desc}</div>
              <ul className="landing-price-features">
                <li>{t.plan1_f1}</li>
                <li>{t.plan1_f2}</li>
                <li>{t.plan1_f3}</li>
                <li>{t.plan1_f4}</li>
                <li>{t.plan1_f5}</li>
                <li>{t.plan1_f6}</li>
                <li>{t.plan1_f7}</li>
                <li>{t.plan1_f8}</li>
                <li className="disabled">{t.plan1_f9}</li>
                <li className="disabled">{t.plan1_f10}</li>
                <li className="disabled">{t.plan1_f11}</li>
              </ul>
              <button className="landing-btn-price outline" onClick={() => navigate('/register')}>{t.plan_cta_start}</button>
            </div>
            {/* Premium */}
            <div className="landing-price-card featured landing-reveal">
              <div className="landing-popular-badge">⭐ PREMIUM</div>
              <div className="landing-price-name">{t.plan2_name}</div>
              <div className="landing-price-amount">199K <span>so'm/oy</span></div>
              <div className="landing-price-desc">{t.plan2_desc}</div>
              <ul className="landing-price-features">
                <li>{t.plan2_f1}</li>
                <li>{t.plan2_f2}</li>
                <li>{t.plan2_f3}</li>
                <li>{t.plan2_f4}</li>
                <li>{t.plan2_f5}</li>
                <li>{t.plan2_f6}</li>
                <li>{t.plan2_f7}</li>
                <li>{t.plan2_f8}</li>
              </ul>
              <button className="landing-btn-price filled" onClick={() => navigate('/register')}>{t.plan_cta_premium}</button>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="landing-section" id="reviews" style={{ background: 'var(--dark-surface)' }}>
        <div className="landing-container">
          <div className="landing-reveal" style={{ textAlign: 'center' }}>
            <div className="landing-section-label">{t.reviews_label}</div>
            <div className="landing-section-title">
              {t.reviews_title} <span className="landing-gradient-text">{t.reviews_title_span}</span>
            </div>
          </div>
          <div className="landing-testimonials-grid">
            <div className="landing-testimonial-card landing-reveal">
              <div className="landing-testimonial-stars">★★★★★</div>
              <div className="landing-testimonial-text">{t.review1_text}</div>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar" style={{ background: 'var(--gradient-1)' }}>A</div>
                <div>
                  <div className="landing-testimonial-name">Aziz Karimov</div>
                  <div className="landing-testimonial-role">O'quv markaz direktori</div>
                </div>
              </div>
            </div>
            <div className="landing-testimonial-card landing-reveal">
              <div className="landing-testimonial-stars">★★★★★</div>
              <div className="landing-testimonial-text">{t.review2_text}</div>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar" style={{ background: 'linear-gradient(135deg, #2DD4BF, #059669)' }}>M</div>
                <div>
                  <div className="landing-testimonial-name">Malika Toshmatova</div>
                  <div className="landing-testimonial-role">O'qituvchi</div>
                </div>
              </div>
            </div>
            <div className="landing-testimonial-card landing-reveal">
              <div className="landing-testimonial-stars">★★★★★</div>
              <div className="landing-testimonial-text">{t.review3_text}</div>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar" style={{ background: 'linear-gradient(135deg, #34D399, #047857)' }}>S</div>
                <div>
                  <div className="landing-testimonial-name">Sardor Aliyev</div>
                  <div className="landing-testimonial-role">Administrator</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section className="landing-section landing-partners-section" id="partners">
        <div className="landing-container">
          <div className="landing-reveal" style={{ textAlign: 'center' }}>
            <div className="landing-section-label">{t.partners_label}</div>
            <div className="landing-section-title">
              {t.partners_title} <span className="landing-gradient-text">{t.partners_title_span}</span>
            </div>
          </div>
          <div className="landing-partners-grid">
            <div className="landing-partner-card landing-reveal">
              <img src="/icons/qayta_tugilish_oq.png" alt="Partner" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="landing-cta-box landing-reveal">
            <h2>
              {t.cta_title} <span className="landing-gradient-text">{t.cta_title_span}</span> {t.cta_title_end}
            </h2>
            <p>{t.cta_desc}</p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
              <button className="landing-btn-large primary" onClick={() => navigate('/register')}>
                {t.cta_register}
              </button>
              <a className="landing-btn-large telegram" href="https://t.me/bakoev_71" target="_blank">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                {t.cta_telegram}
              </a>
              <a className="landing-btn-large secondary" href="tel:+998906127171">
                {t.cta_call}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-grid">
            <div className="landing-footer-brand">
              <a href="#" className="landing-logo">
                <div className="landing-logo-icon">E</div>
                <div className="landing-logo-text">Edu<span>Control</span></div>
              </a>
              <p>{t.footer_desc}</p>
            </div>
            <div className="landing-footer-col">
              <h4>{t.footer_product}</h4>
              <ul>
                <li><a href="#features">{t.nav_features}</a></li>
                <li><a href="#pricing">{t.nav_pricing}</a></li>
                <li><a href="#results">{t.nav_results}</a></li>
                <li><a href="/guide" onClick={(e) => { e.preventDefault(); navigate('/guide'); }}>{t.nav_guide}</a></li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>{t.footer_company}</h4>
              <ul>
                <li><a href="#">Biz haqimizda</a></li>
                <li><a href="#">Hamkorlik</a></li>
              </ul>
            </div>
            <div className="landing-footer-col">
              <h4>{t.footer_support}</h4>
              <ul>
                <li><a href="https://t.me/bakoev_71" target="_blank">Telegram: @bakoev_71</a></li>
                <li><a href="tel:+998906127171">+998 90 612 71 71</a></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer-bottom">
            <div>© 2026 EduControl Pro. Barcha huquqlar himoyalangan.</div>
            <div className="landing-footer-socials">
              <a href="https://t.me/bakoev_71" target="_blank" title="Telegram">✈</a>
              <a href="#" title="Instagram">📷</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Telegram Float Button */}
      <a className="landing-telegram-float" href="https://t.me/bakoev_71" target="_blank">
        <svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
        <span className="landing-telegram-tooltip">{t.tg_tooltip}</span>
      </a>
    </div>
  );
};

export default LandingPage;
