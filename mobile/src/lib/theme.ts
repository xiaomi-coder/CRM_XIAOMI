/**
 * Dizayn tizimi tokenlari — veb bilan AYNAN bir xil.
 *
 * Qiymatlar `tailwind.config.js` dan olingan (2026-08-10 da Claude Design'da
 * yasalgan tizim). Ranglar ma'no tashiydi:
 *   success = bajarilgan, warning = e'tibor, danger = kechikkan/muhim.
 *
 * ⚠️ Bu yerdagi qiymat o'zgarsa, veb tomonidagi `tailwind.config.js` ham
 * birga o'zgarishi kerak — aks holda ikki ilova har xil ko'rinadi.
 *
 * Eski zumrad (#059669) tema 2026-08-13 da shu tizimga o'tkazildi.
 */
export const brand = {
  // Brend
  primary: '#3B4FE0',
  primaryHover: '#2F3FC0',
  primaryDark: '#28359E',
  /** Ochiq brend foni — tanlangan chip, yumshoq belgilar uchun */
  primarySubtle: '#EEF1FE',
  primaryLight: '#C9D3FB',
  accent: '#3B4FE0',

  // To'q yuzalar: yon menyu va pastki tab-bar (veb'dagi sidebar bilan bir xil)
  dark: '#101828',
  surface: '#101828',
  surfaceAlt: '#1D2939',
  sidebarLabel: '#5B6478',

  // Kontent yuzalari
  bg: '#F7F8FA',      // sahifa foni (canvas)
  card: '#FFFFFF',    // karta foni
  border: '#E4E7EC',  // chegara (line)
  borderStrong: '#CDD2DA',

  // Matn
  text: '#101828',        // ink
  textSecondary: '#475467', // ink-2
  textMuted: '#98A2B3',   // muted
  textOnDark: '#FFFFFF',
  textMutedOnDark: '#98A2B3',

  // Ma'noli holat ranglari (fg = matn/ikonka, bg = yumshoq fon)
  success: '#157A4F',
  successBg: '#E3F6EC',
  warning: '#A8650A',
  warningBg: '#FCEFDD',
  danger: '#C13B30',
  dangerBg: '#FBE7E5',
  info: '#2563C7',
  infoBg: '#E8F0FC',
  neutral: '#667085',
  neutralBg: '#F0F1F3',
};

/** Veb: 6 / 8 / 12 px. `xl` mobil uchun qoldirildi (katta kartalar). */
export const radius = { sm: 6, md: 8, lg: 12, xl: 16 };

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/** Soyalar — veb'dagi e1/e2/e3 ning React Native ko'rinishi */
export const shadow = {
  e1: {
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  e2: {
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  e3: {
    shadowColor: '#101828',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};
