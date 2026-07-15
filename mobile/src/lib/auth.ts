import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './api';
import { User, UserRole } from './types';

const USER_KEY = 'edu_user';
const ROLE_KEY = 'edu_user_role';

/** Login xatolari — ekran o'zi tarjima qilib ko'rsatadi */
export type LoginError = 'BAD_CREDENTIALS' | 'CENTER_NOT_FOUND' | 'CENTER_BLOCKED' | 'NETWORK';

export class AuthError extends Error {
  constructor(public code: LoginError) {
    super(code);
  }
}

/**
 * Saytdagi (App.tsx) login mantig'ining aynan nusxasi:
 * 1) creator/xiaomicoder — super admin
 * 2) users jadvalidan qidirish + parol tekshirish
 * 3) markaz mavjudmi va bloklanmaganmi
 */
export async function login(username: string, pass: string): Promise<User> {
  if (username === 'creator' && pass === 'xiaomicoder') {
    const superAdmin: User = {
      id: 'SUPER_ADMIN_ID',
      centerId: 'GLOBAL',
      name: 'Super Admin',
      username: 'creator',
      role: UserRole.SUPER_ADMIN,
    } as User;
    await saveSession(superAdmin);
    return superAdmin;
  }

  let user: any;
  try {
    user = await db.getOne('users', 'username', username);
  } catch {
    throw new AuthError('NETWORK');
  }

  if (!user || user.password !== pass) throw new AuthError('BAD_CREDENTIALS');

  if (user.centerId && user.centerId !== 'GLOBAL') {
    const center = await db.getOne('settings', 'centerId', user.centerId);
    if (!center) throw new AuthError('CENTER_NOT_FOUND');
    if (center.isBlocked) throw new AuthError('CENTER_BLOCKED');
  }

  await saveSession(user);
  return user;
}

export async function saveSession(user: User) {
  await AsyncStorage.multiSet([
    [USER_KEY, JSON.stringify(user)],
    [ROLE_KEY, String(user.role)],
  ]);
}

export async function loadSession(): Promise<User | null> {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export async function logout() {
  await AsyncStorage.multiRemove([USER_KEY, ROLE_KEY]);
}
