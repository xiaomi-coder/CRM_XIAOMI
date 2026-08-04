import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Rocket, Layers, Users, ClipboardCheck, Wallet,
  Send, ArrowLeft, ArrowRight, Play, LifeBuoy
} from 'lucide-react';

/**
 * Ochiq (login talab qilmaydigan) skrinshotli qo'llanma — /guide.
 * Skrinshotlar public/guide/ ichida; raqamli belgilar rasm USTIGA
 * foizli koordinatalar bilan qo'yiladi (rasmga chizib o'tirilmaydi).
 */

type Marker = { x: number; y: number; label: string };

const Shot: React.FC<{ src: string; alt: string; markers?: Marker[] }> = ({ src, alt, markers = [] }) => (
  <figure className="my-6">
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/60 bg-white">
      <img src={src} alt={alt} className="w-full block" loading="lazy" />
      {markers.map((m, i) => (
        <span
          key={i}
          className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full bg-emerald-600 text-white text-[13px] font-black flex items-center justify-center ring-4 ring-emerald-600/25 shadow-lg"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          {i + 1}
        </span>
      ))}
    </div>
    {markers.length > 0 && (
      <figcaption className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {markers.map((m, i) => (
          <span key={i} className="flex items-start gap-2 text-[13px] text-slate-600 font-medium">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            {m.label}
          </span>
        ))}
      </figcaption>
    )}
  </figure>
);

const Section: React.FC<{
  id: string; icon: React.ReactNode; step: number; title: string;
  children: React.ReactNode;
}> = ({ id, icon, step, title, children }) => (
  <section id={id} className="scroll-mt-24 mb-16">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-600">{step}-qadam</p>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
    </div>
    <div className="text-[15px] leading-relaxed text-slate-600 space-y-3">{children}</div>
  </section>
);

const NAV = [
  { id: 'start', label: "Boshlash" },
  { id: 'groups', label: "Guruhlar" },
  { id: 'students', label: "O'quvchilar" },
  { id: 'attendance', label: "Davomat" },
  { id: 'payments', label: "To'lovlar" },
  { id: 'telegram', label: "Telegram bot" },
];

const GuidePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Sarlavha paneli */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors shrink-0">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Bosh sahifa</span>
          </button>
          <div className="flex items-center gap-2 font-black text-slate-900 tracking-tight">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center"><BrainCircuit size={18} /></span>
            <span>Qo'llanma</span>
          </div>
          <button onClick={() => navigate('/register')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider transition-colors shrink-0">
            Bepul boshlash
          </button>
        </div>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 pb-3 flex gap-2 overflow-x-auto">
          {NAV.map(n => (
            <a key={n.id} href={`#${n.id}`} className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 text-xs font-bold whitespace-nowrap transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Kirish */}
        <div className="mb-14 text-center">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-4">
            EduControl bilan <span className="text-emerald-600">30 daqiqada</span> ishlashni boshlang
          </h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto">
            Bu qo'llanma o'quv markazni noldan sozlashning to'liq yo'lini ko'rsatadi:
            guruh ochishdan Telegram xabarnomalarigacha. Har bir qadamda haqiqiy ekran
            rasmi va unda nimani bosish kerakligi belgilangan.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/')} className="inline-flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors">
              <Play size={14} /> Avval demoda sinab ko'ring
            </button>
            <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors">
              Ro'yxatdan o'tish <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <Section id="start" icon={<Rocket size={22} />} step={1} title="Ro'yxatdan o'tish va kirish">
          <p>
            Bosh sahifadagi <b>«Bepul boshlash»</b> tugmasini bosing. Markaz nomi, telefon
            raqami, rahbar ismi hamda tizimga kirish uchun login va parolni kiriting —
            <b> 14 kunlik bepul sinov</b> avtomatik yoqiladi, karta ma'lumotlari so'ralmaydi.
          </p>
          <Shot src="/guide/register.png" alt="Ro'yxatdan o'tish oynasi" markers={[
            { x: 50, y: 32.5, label: "Markaz nomi va telefon — telefon takrorlanmasligi tekshiriladi" },
            { x: 50, y: 54.3, label: "Login — keyin tizimga shu bilan kirasiz" },
            { x: 50, y: 79.6, label: "«Bepul boshlash» — darrov tizimga kirasiz" },
          ]} />
          <p>
            Ro'yxatdan o'tgach siz <b>Direktor</b> huquqi bilan boshqaruv paneliga tushasiz:
            o'quvchilar soni, tushum, davomat foizi va qarzdorlar bir ekranda.
          </p>
          <Shot src="/guide/dashboard.png" alt="Boshqaruv paneli" markers={[
            { x: 60, y: 52.2, label: "Asosiy ko'rsatkichlar: daromad, davomat foizi" },
            { x: 90.3, y: 52.2, label: "Qarzdorlar soni — bosib ro'yxatini ko'rasiz" },
          ]} />
        </Section>

        <Section id="groups" icon={<Layers size={22} />} step={2} title="Guruh ochish">
          <p>
            Chap menyudan <b>Guruhlar</b> bo'limiga o'ting va <b>«Yangi guruh»</b> tugmasini
            bosing. Guruh nomi, fan, o'qituvchi, dars kunlari, vaqti va oylik to'lovni kiriting.
          </p>
          <Shot src="/guide/groups.png" alt="Guruhlar ekrani" markers={[
            { x: 88.8, y: 27.5, label: "«Yangi guruh ochish» — guruh yaratish oynasi" },
            { x: 29.5, y: 39.2, label: "Guruh kartasi: fan, o'qituvchi, dars vaqti" },
            { x: 34.4, y: 68.2, label: "«Yangi o'quvchi» — guruhga to'g'ridan-to'g'ri qo'shish" },
          ]} />
          <p>
            Oylik to'lov (narx) guruhga bog'lanadi — keyin to'lov qabul qilishda va oylik
            hisob-kitobda avtomatik ishlatiladi.
          </p>
        </Section>

        <Section id="students" icon={<Users size={22} />} step={3} title="O'quvchi qo'shish">
          <p>
            <b>O'quvchilar</b> bo'limida <b>«Yangi o'quvchi»</b> tugmasini bosing: ism,
            telefon, ota-ona kontakti kiritiladi va o'quvchi darrov guruhga biriktiriladi.
          </p>
          <Shot src="/guide/students.png" alt="O'quvchilar ekrani" markers={[
            { x: 90, y: 37.7, label: "«Yangi o'quvchi» qo'shish" },
            { x: 35.3, y: 37.7, label: "Qidiruv — ism yoki telefon bo'yicha" },
            { x: 78.5, y: 51.7, label: "Balans — to'lov holati bir qarashda" },
          ]} />
          <p>
            Qarzdor o'quvchilar (to'lov sanasi o'tib ketganlar) ro'yxatda va boshqaruv
            panelida qizil bilan ajralib turadi.
          </p>
        </Section>

        <Section id="attendance" icon={<ClipboardCheck size={22} />} step={4} title="Davomat olish">
          <p>
            <b>Davomat</b> bo'limida guruhni va sanani tanlang — o'quvchilar ro'yxati chiqadi.
            Har biri uchun <b>Keldi / Kelmadi / Kechikdi</b> ni belgilang.
          </p>
          <Shot src="/guide/attendance.png" alt="Davomat ekrani" markers={[
            { x: 38.3, y: 34.3, label: "Guruhni tanlash" },
            { x: 60, y: 34.2, label: "Sana — o'tgan kunlarni ham belgilash mumkin" },
            { x: 43.6, y: 47, label: "«Hammasini belgilash» — bir bosishda butun guruh" },
            { x: 67.3, y: 70.7, label: "Har bir o'quvchi uchun alohida holat tugmalari" },
          ]} />
          <p>
            Telegram bot ulangan bo'lsa, «Kelmadi» belgilanganda ota-onaga avtomatik
            xabar ketadi.
          </p>
        </Section>

        <Section id="payments" icon={<Wallet size={22} />} step={5} title="To'lov qabul qilish">
          <p>
            <b>To'lovlar</b> bo'limida <b>«To'lov qabul qilish»</b> tugmasini bosing:
            o'quvchini tanlang, summa va qaysi oy uchunligini kiriting. Keyingi to'lov
            sanasi avtomatik suriladi.
          </p>
          <Shot src="/guide/payments.png" alt="To'lovlar ekrani" markers={[
            { x: 62, y: 29.1, label: "«To'lov qabul qilish» oynasini ochish" },
            { x: 30.2, y: 29.1, label: "Naqd va plastik bo'yicha jami tushum" },
            { x: 50, y: 55.2, label: "Tarix: kim, qachon, qancha, qaysi oy uchun" },
          ]} />
          <p>
            To'lov muddati yaqinlashganda (5, 3 va 1 kun qolganda) bot ota-onaga eslatma
            yuboradi — qarzdorlik keskin kamayadi.
          </p>
        </Section>

        <Section id="telegram" icon={<Send size={22} />} step={6} title="Telegram botni ulash">
          <p>
            Har bir markazning O'Z boti bo'ladi. <b>Sozlamalar</b> bo'limida bot tokenini
            kiritasiz (tokenni Telegram'dagi <b>@BotFather</b> dan 2 daqiqada olasiz:
            <code className="mx-1 px-1.5 py-0.5 bg-slate-100 rounded text-[13px]">/newbot</code>
            buyrug'i yetarli).
          </p>
          <Shot src="/guide/settings.png" alt="Sozlamalar ekrani" markers={[
            { x: 40.8, y: 69.5, label: "Markaz nomi — xabarlarda shu nom ko'rinadi" },
            { x: 40.8, y: 84.3, label: "Bot tokeni shu maydonga qo'yiladi (@BotFather ko'rsatmasi ostida)" },
            { x: 36.4, y: 39.6, label: "O'z parolingizni shu yerda o'zgartirasiz" },
          ]} />
          <p>Bot ulangach avtomatik ishlaydigan narsalar:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>To'lov muddatiga 5 / 3 / 1 kun qolganda ota-onaga eslatma;</li>
            <li>«Kelmadi» belgilanganda davomat xabari;</li>
            <li>To'lov qabul qilinganda tasdiq xabari;</li>
            <li>Har kuni kechqurun direktorga kunlik hisobot.</li>
          </ul>
        </Section>

        {/* Yakun */}
        <div className="mt-4 p-8 rounded-[2rem] bg-slate-900 text-white text-center">
          <LifeBuoy className="mx-auto mb-3 text-emerald-400" size={32} />
          <h3 className="text-xl font-black tracking-tight mb-2">Savol qoldimi?</h3>
          <p className="text-slate-400 text-sm font-medium mb-5">
            Telegram orqali yozing — sozlashda bepul yordam beramiz.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="https://t.me/bakoev_me" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors">
              <Send size={14} /> @bakoev_me
            </a>
            <button onClick={() => navigate('/register')} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-colors">
              Bepul boshlash <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 font-bold mt-10 uppercase tracking-widest">
          © {new Date().getFullYear()} EduControl Pro
        </p>
      </main>
    </div>
  );
};

export default GuidePage;
