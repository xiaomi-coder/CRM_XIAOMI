import { User, UserRole } from './types';

/**
 * Rolga qarab navigatsiya — saytdagi MobileSidebar.tsx mantig'ining nusxasi.
 * Bitta manba: drawer (to'liq menyu) ham, pastki tab-bar (eng kerakli 4 ta) ham
 * shu yerdan oziqlanadi.
 */

export type NavItem = {
  /** expo-router yo'li, masalan '/(app)/(tabs)/students' */
  href: string;
  /** i18n kaliti yoki tayyor matn */
  labelKey: string;
  /** @expo/vector-icons — Ionicons nomi */
  icon: string;
};

export function hasPermission(user: User, key: string): boolean {
  const isSuper = user.role === UserRole.SUPER_ADMIN;
  const isDirector = user.role === UserRole.DIRECTOR;
  const isAdmin = user.role === UserRole.ADMIN;
  const isTeacher = user.role === UserRole.TEACHER;

  if (isSuper || isDirector) return true;

  const perms = (user as any).permissions || {};
  if (Object.keys(perms).length > 0) return perms[key] === true;

  if (isAdmin) return key !== 'settings';
  if (isTeacher) {
    return ['students', 'groups', 'attendance', 'salary', 'archive', 'results', 'library'].includes(key);
  }
  return false;
}

/** Drawer (gamburger) — barcha ruxsat etilgan bo'limlar */
export function getDrawerItems(user: User): NavItem[] {
  const T = '/(app)/(tabs)';
  const A = '/(app)';

  if (user.role === UserRole.SUPER_ADMIN) {
    return [
      { href: `${T}/index`, labelKey: 'dashboard', icon: 'grid-outline' },
      { href: `${A}/centers`, labelKey: 'centers', icon: 'business-outline' },
      { href: `${A}/broadcast`, labelKey: 'broadcast', icon: 'megaphone-outline' },
      { href: `${A}/logs`, labelKey: 'logs', icon: 'shield-outline' },
    ];
  }

  const items: NavItem[] = [];
  const add = (perm: string, item: NavItem) => {
    if (hasPermission(user, perm)) items.push(item);
  };

  add('dashboard', { href: `${T}/index`, labelKey: 'dashboard', icon: 'grid-outline' });
  add('students', { href: `${T}/students`, labelKey: 'students', icon: 'people-outline' });
  add('groups', { href: `${T}/groups`, labelKey: 'groups', icon: 'layers-outline' });
  add('attendance', { href: `${T}/attendance`, labelKey: 'attendance', icon: 'calendar-outline' });
  add('payments', { href: `${A}/payments`, labelKey: 'payments', icon: 'wallet-outline' });
  add('salary', { href: `${A}/salary`, labelKey: 'salary', icon: 'cash-outline' });
  add('expenses', { href: `${A}/expenses`, labelKey: 'expenses', icon: 'receipt-outline' });
  add('leads', { href: `${A}/leads`, labelKey: 'leads', icon: 'person-add-outline' });
  add('results', { href: `${A}/results`, labelKey: 'results_section', icon: 'trophy-outline' });
  add('archive', { href: `${A}/archive`, labelKey: 'archive', icon: 'archive-outline' });

  if (user.role === UserRole.DIRECTOR) {
    items.push({ href: `${A}/staff`, labelKey: 'staff', icon: 'person-circle-outline' });
  }
  add('settings', { href: `${A}/settings`, labelKey: 'system_settings', icon: 'settings-outline' });

  return items;
}

/**
 * Pastki tab-bar — kundalik eng ko'p ishlatiladigan 4 ta.
 * O'qituvchi darsda davomat belgilaydi; direktor pul/umumiy holatni kuzatadi.
 */
export function getTabItems(user: User): NavItem[] {
  const T = '/(app)/(tabs)';

  if (user.role === UserRole.TEACHER) {
    return [
      { href: `${T}/attendance`, labelKey: 'attendance', icon: 'calendar-outline' },
      { href: `${T}/students`, labelKey: 'students', icon: 'people-outline' },
      { href: `${T}/groups`, labelKey: 'groups', icon: 'layers-outline' },
    ].filter((i) => hasPermission(user, i.labelKey === 'results_section' ? 'results' : i.labelKey));
  }

  return [
    { href: `${T}/index`, labelKey: 'dashboard', icon: 'grid-outline' },
    { href: `${T}/students`, labelKey: 'students', icon: 'people-outline' },
    { href: `${T}/attendance`, labelKey: 'attendance', icon: 'calendar-outline' },
    { href: `${T}/groups`, labelKey: 'groups', icon: 'layers-outline' },
  ];
}
