import React from 'react';

/**
 * EduCenter CRM — umumiy UI komponentlari.
 *
 * Barcha o'lchamlar va ranglar dizayn tizimidan AYNAN olingan
 * (arxiv: "EduCenter CRM Design System"). Yangi ekran qilayotganda
 * shu yerdagi komponentlardan foydalaning — shunda butun ilova
 * bir xil ko'rinadi va keyin bir joydan o'zgartirsa bo'ladi.
 */

// ---------------------------------------------------------------------------
// Holat ranglari — ma'no tashiydi. Dizayndagi toneColors bilan bir xil.
// ---------------------------------------------------------------------------
export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export const TONE: Record<Tone, { bg: string; fg: string; dot: string }> = {
  brand: { bg: '#EEF1FE', fg: '#3B4FE0', dot: '#3B4FE0' },
  success: { bg: '#E3F6EC', fg: '#157A4F', dot: '#157A4F' },
  warning: { bg: '#FCEFDD', fg: '#A8650A', dot: '#A8650A' },
  danger: { bg: '#FBE7E5', fg: '#C13B30', dot: '#C13B30' },
  info: { bg: '#E8F0FC', fg: '#2563C7', dot: '#2563C7' },
  muted: { bg: '#F0F1F3', fg: '#667085', dot: '#98A2B3' },
};

// ---------------------------------------------------------------------------
// Sahifa sarlavhasi
// ---------------------------------------------------------------------------
export const PageHeader: React.FC<{
  title: string; subtitle?: string; actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
    <div>
      <h1 className="text-[28px] leading-9 font-bold text-ink tracking-[-0.01em]">{title}</h1>
      {subtitle && <p className="text-[14px] leading-5 text-ink-2 mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Karta — barcha bloklar uchun asos
// ---------------------------------------------------------------------------
export const Card: React.FC<{
  children: React.ReactNode; className?: string; padded?: boolean;
}> = ({ children, className = '', padded = true }) => (
  <div className={`bg-surface border border-line rounded-lg shadow-e1 ${padded ? 'p-5' : ''} ${className}`}>
    {children}
  </div>
);

export const CardHeader: React.FC<{
  title: string; subtitle?: string; actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex items-start justify-between gap-4 mb-4">
    <div>
      <h3 className="text-[15px] leading-[22px] font-semibold text-ink">{title}</h3>
      {subtitle && <p className="text-[13px] leading-[18px] text-muted mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Tugmalar
// ---------------------------------------------------------------------------
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-primary text-white border border-transparent hover:bg-primary-hover active:bg-primary-active',
  secondary: 'bg-surface text-[#344054] border border-line hover:bg-[#F7F8FA] hover:border-line-strong',
  ghost: 'bg-transparent text-ink-2 border border-transparent hover:bg-[#F0F2FE] hover:text-primary',
  danger: 'bg-danger text-white border border-transparent hover:brightness-95',
};

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }
> = ({ variant = 'primary', size = 'md', className = '', children, ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center gap-1.5 rounded-field font-semibold transition-colors
      disabled:opacity-45 disabled:cursor-not-allowed
      ${size === 'sm' ? 'text-[12.5px] px-2.5 py-1.5' : 'text-[13.5px] px-3.5 py-2'}
      ${BTN[variant]} ${className}`}
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// Holat belgisi (nuqta + matn)
// ---------------------------------------------------------------------------
export const StatusBadge: React.FC<{ label: string; tone?: Tone; dot?: boolean }> = ({
  label, tone = 'muted', dot = true,
}) => {
  const c = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[12px] leading-4 font-semibold whitespace-nowrap"
      style={{ background: c.bg, color: c.fg }}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.dot }} />}
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// KPI karta — raqamlar tabular-nums bilan (jadvalda tekis turadi)
// ---------------------------------------------------------------------------
export const KpiCard: React.FC<{
  label: string; value: React.ReactNode; delta?: string; deltaTone?: Tone;
  hint?: string; onClick?: () => void;
}> = ({ label, value, delta, deltaTone = 'success', hint, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-surface border border-line rounded-lg shadow-e1 p-4 ${onClick ? 'cursor-pointer hover:border-line-strong transition-colors' : ''}`}
  >
    <div className="text-[13px] leading-[18px] text-ink-2 font-medium">{label}</div>
    <div className="flex items-baseline gap-2 mt-1.5">
      <span className="text-[30px] leading-9 font-bold text-ink tabular-nums tracking-[-0.01em]">{value}</span>
      {delta && (
        <span className="text-[12px] font-semibold" style={{ color: TONE[deltaTone].fg }}>{delta}</span>
      )}
    </div>
    {hint && <div className="text-[12px] text-muted mt-1">{hint}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Forma maydonlari — yorliq HAR DOIM maydon USTIDA
// (ichiga qo'yilsa maydonning o'z matni bilan ustma-ust tushadi)
// ---------------------------------------------------------------------------
export const Field: React.FC<{
  label?: string; children: React.ReactNode; className?: string; hint?: string;
}> = ({ label, children, className = '', hint }) => (
  <div className={`space-y-1.5 ${className}`}>
    {label && <label className="block text-[12px] leading-4 font-semibold text-ink-2">{label}</label>}
    {children}
    {hint && <p className="text-[12px] text-muted">{hint}</p>}
  </div>
);

export const inputClass =
  'w-full text-[13.5px] px-3 py-2.5 border border-line rounded-field bg-surface text-ink ' +
  'outline-none transition-colors placeholder:text-muted ' +
  'focus:border-primary focus:ring-2 focus:ring-primary/15';

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...rest }) => (
  <input {...rest} className={`${inputClass} ${className}`} />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', children, ...rest }) => (
  <select {...rest} className={`${inputClass} ${className}`}>{children}</select>
);

// ---------------------------------------------------------------------------
// Bo'limlar (tab) — o'quvchi profili kabi ekranlarda
// ---------------------------------------------------------------------------
export const Tabs: React.FC<{
  tabs: { id: string; label: string; badge?: number }[];
  active: string;
  onChange: (id: string) => void;
}> = ({ tabs, active, onChange }) => (
  <div className="flex items-center gap-5 border-b border-line overflow-x-auto">
    {tabs.map(tab => {
      const on = tab.id === active;
      return (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`relative py-2.5 text-[13.5px] font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px
            ${on ? 'text-primary border-primary' : 'text-ink-2 border-transparent hover:text-ink'}`}
        >
          {tab.label}
          {tab.badge !== undefined && tab.badge > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-primary-subtle text-primary text-[11px] font-bold">
              {tab.badge}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// ---------------------------------------------------------------------------
// Jadval — bir xil ko'rinish uchun tayyor uslublar
// ---------------------------------------------------------------------------
export const Table: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="w-full text-left border-collapse">{children}</table>
  </div>
);

// Klass nomlari to'liq yozilgan — `text-${align}` kabi yig'ma nomlarni
// Tailwind ishonchli topa olmaydi
const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export const Th: React.FC<{ children?: React.ReactNode; align?: keyof typeof ALIGN; className?: string }> = ({
  children, align = 'left', className = '',
}) => (
  <th className={`px-4 py-2.5 text-[12px] leading-4 font-semibold text-muted uppercase tracking-[0.04em]
    bg-[#FAFAFB] border-b border-line ${ALIGN[align]} ${className}`}>
    {children}
  </th>
);

export const Td: React.FC<{ children?: React.ReactNode; align?: keyof typeof ALIGN; className?: string }> = ({
  children, align = 'left', className = '',
}) => (
  <td className={`px-4 py-3 text-[13.5px] text-ink border-b border-[#F0F1F3] ${ALIGN[align]} ${className}`}>
    {children}
  </td>
);

// ---------------------------------------------------------------------------
// Avatar — ism bosh harflaridan
// ---------------------------------------------------------------------------
const AVATAR_TONES: Tone[] = ['brand', 'success', 'warning', 'info', 'danger', 'muted'];

export const Avatar: React.FC<{ name: string; size?: number }> = ({ name, size = 36 }) => {
  const initials = name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  // Bir xil ism doim bir xil rangda bo'lsin
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length;
  const c = TONE[AVATAR_TONES[idx]];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold shrink-0"
      style={{ width: size, height: size, background: c.bg, color: c.fg, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Bo'sh holat
// ---------------------------------------------------------------------------
export const EmptyState: React.FC<{
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="py-14 text-center">
    {icon && (
      <div className="w-12 h-12 rounded-full bg-[#F0F1F3] text-muted flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
    )}
    <p className="text-[14px] font-semibold text-ink">{title}</p>
    {description && <p className="text-[13px] text-muted mt-1 max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);
