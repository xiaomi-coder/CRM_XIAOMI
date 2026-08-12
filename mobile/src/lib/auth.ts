import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, setAuthToken, restoreAuthToken, isTokenValid, getAuthToken } from './api';
import { User } from './types';

const USER_KEY = 'edu_user';
const ROLE_KEY = 'edu_user_role';

/** Login xatolari — ekran o'zi tarjima qilib ko'rsatadi */
export type LoginError =
  | 'BAD_CREDENTIALS'
  | 'CENTER_NOT_FOUND'
  | 'CENTER_BLOCKED'
  | 'LICENSE_EXPIRED'
  | 'NETWORK';

export class AuthError extends Error {
  constructor(public code: LoginError, public detail?: string) {
    super(code);
  }
}

/**
 * Login — parol BAZADA tekshiriladi va shaxsiy propusk (JWT) qaytadi.
 *
 * ⚠️ Avval bu yerda ikkita jiddiy kamchilik bor edi (2026-08-12 da tuzatildi):
 *  1. `creator` / `xiaomicoder` to'g'ridan-to'g'ri kodga yozilgan edi — APK'ni
 *     ochgan har kim super admin bo'la olardi. Endi creator ham bazadagi
 *     oddiy foydalanuvchi, u ham shu RPC orqali kiradi.
 *  2. Parol brauzerda solishtirilardi (`user.password !== pass`), ya'ni
 *     `users` qatori paroli bilan birga yuklab olinardi. Endi parol umuman
 *     qaytmaydi — bcrypt bilan bazada tekshiriladi.
 *
 * Sayt tomonidagi aynan shu mantiq: services/supabase.ts → db.login
 */
export async function login(username: string, pass: string): Promise<User> {
  let data: any;
  try {
    data = await db.rpc('login', { p_username: username, p_password: pass });
  } catch {
    throw new AuthError('NETWORK');
  }

  if (!data || data.error) {
    const code = data?.error;
    if (code === 'center_blocked') throw new AuthError('CENTER_BLOCKED');
    if (code === 'center_not_found') throw new AuthError('CENTER_NOT_FOUND');
    if (code === 'license_expired') throw new AuthError('LICENSE_EXPIRED', data?.expiredAt);
    throw new AuthError('BAD_CREDENTIALS');
  }

  await setAuthToken(data.token);
  await saveSession(data.user);
  return data.user as User;
}

export async function saveSession(user: User) {
  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(user)],
    [ROLE_KEY, String(user.role)],
  ]);
}

/**
 * Ilova ochilganda sessiyani tiklaydi.
 * Propusk muddati tugagan bo'lsa (12 soat) sessiya tozalanadi va
 * foydalanuvchi qayta kirishi so'raladi — aks holda ekranlar bo'sh chiqardi.
 */
export async function loadSession(): Promise<User | null> {
  try {
    await restoreAuthToken();
    if (!isTokenValid(getAuthToken())) {
      await logout();
      return null;
    }
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export async function logout() {
  await setAuthToken(null);
  await AsyncStorage.multiRemove([USER_KEY, ROLE_KEY]);
}
