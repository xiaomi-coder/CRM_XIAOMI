/**
 * Dizayn tizimi tokenlari.
 *
 * Avval bu sozlama index.html ichida, `cdn.tailwindcss.com` uchun yozilgan edi.
 * CDN CSS'ni FOYDALANUVCHI BRAUZERIDA, sahifa ochilganda kompilyatsiya qilardi
 * (123 KB skript + telefon protsessorida ish). Endi build vaqtida bir marta
 * kompilyatsiya qilinadi.
 *
 * ⚠️ Klass nomlari `content` dagi fayllardan MATN sifatida qidiriladi.
 * Ya'ni `bg-${rang}-50` kabi yig'ma nomlar TOPILMAYDI — to'liq yozing
 * (namuna: components/ui/index.tsx dagi ALIGN xaritasi).
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brend
        primary: {
          DEFAULT: '#3B4FE0', hover: '#2F3FC0', active: '#28359E',
          subtle: '#EEF1FE', 50: '#EEF1FE', 100: '#C9D3FB',
          600: '#3B4FE0', 700: '#2F3FC0', 800: '#28359E',
        },
        // Yuza va matn
        canvas: '#F7F8FA',   // sahifa foni
        surface: '#FFFFFF',  // karta foni
        line: '#E4E7EC',     // chegara
        'line-strong': '#CDD2DA',
        ink: '#101828',      // asosiy matn
        'ink-2': '#475467',  // ikkilamchi matn
        muted: '#98A2B3',    // so'nik matn
        // Ma'noli holat ranglari (fg = matn/ikonka, bg = fon)
        success: { DEFAULT: '#157A4F', bg: '#E3F6EC' },
        warning: { DEFAULT: '#A8650A', bg: '#FCEFDD' },
        danger: { DEFAULT: '#C13B30', bg: '#FBE7E5' },
        info: { DEFAULT: '#2563C7', bg: '#E8F0FC' },
        neutral: { DEFAULT: '#667085', bg: '#F0F1F3' },
        // Yon menyu (to'q)
        sidebar: { DEFAULT: '#101828', label: '#5B6478' },
      },
      borderRadius: { sm: '6px', md: '8px', lg: '12px', card: '12px', field: '8px' },
      boxShadow: {
        e1: '0 1px 2px rgba(16,24,40,.06)',
        e2: '0 1px 3px rgba(16,24,40,.08), 0 1px 2px rgba(16,24,40,.04)',
        e3: '0 4px 8px rgba(16,24,40,.10), 0 2px 4px rgba(16,24,40,.04)',
        card: '0 1px 2px rgba(16,24,40,.06)',
        pop: '0 4px 8px rgba(16,24,40,.10), 0 2px 4px rgba(16,24,40,.04)',
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      fontSize: {
        // Dizayn tizimidagi shkala (o'lcham / qator balandligi)
        display: ['36px', '44px'], 'page-title': ['28px', '36px'],
        'section-title': ['20px', '28px'], 'card-title': ['15px', '22px'],
        body: ['14px', '20px'], secondary: ['13px', '18px'],
        caption: ['12px', '16px'], kpi: ['30px', '36px'],
      },
    },
  },
  plugins: [],
};
