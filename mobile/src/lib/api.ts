import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * VPS backend (PostgreSQL + PostgREST) — sayt bilan AYNAN bir xil API.
 * Supabase Auth ishlatilmaydi (o'zimizning `login` RPC'imiz bor).
 */
const supabaseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.eduprocrm.uz';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw';

/**
 * Foydalanuvchining shaxsiy propuski (JWT).
 *
 * ⚠️ 2026-08-05 da bazada RLS yoqilgan: anon kalit bilan HECH BIR jadvaldan
 * qator qaytmaydi. Ilova avval faqat anon kalit bilan ishlardi — shuning
 * uchun login ham, ro'yxatlar ham bo'sh qaytardi. Endi login'dan keyin
 * olingan propusk har so'rovga qo'yiladi; uning ichida `centerId` bor va
 * baza shunga qarab faqat o'z markazining qatorlarini beradi.
 *
 * Sayt tomonidagi aynan shu mantiq: services/supabase.ts
 */
const TOKEN_KEY = 'edu_token';
let authToken: string | null = null;

export const setAuthToken = async (token: string | null) => {
  authToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => authToken;

/** Ilova ochilganda diskdagi propuskni xotiraga tiklaydi */
export const restoreAuthToken = async () => {
  authToken = await AsyncStorage.getItem(TOKEN_KEY);
  return authToken;
};

/** Propusk bor va muddati tugamaganmi (imzo baribir bazada tekshiriladi) */
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeBase64(part));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/** RN'da atob yo'q — JWT payload'ini o'qish uchun kichik dekoder */
function decodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = input.replace(/=+$/, '');
  let out = '';
  let bc = 0, bs = 0;
  for (let i = 0; i < str.length; i++) {
    const idx = chars.indexOf(str[i]);
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    if (bc++ % 4) out += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
  }
  return out;
}

/** Propusk bo'lsa har so'rovga o'sha qo'yiladi (anon kalit o'rniga) */
const authFetch: typeof fetch = (input, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  return fetch(input as any, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: { fetch: authFetch },
});

/** UUID v4 — web'dagi crypto.randomUUID() o'rnini bosadi (RN'da mavjud emas) */
export function newId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * `db` — web'dagi services/supabase.ts bilan bir xil interfeys.
 * Farqi: toast o'rniga xatoni otadi (ekran o'zi ko'rsatadi).
 */
export const db = {
  get: async (table: string) => {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw new Error(`${table}: ${error.message}`);
    return data || [];
  },

  getOne: async (table: string, column: string, value: string) => {
    const { data, error } = await supabase.from(table).select('*').eq(column, value).single();
    if (error) return null;
    return data;
  },

  /** Ustun bo'yicha filtrlangan ro'yxat (mobil ekranlarda ko'p kerak) */
  getWhere: async (table: string, column: string, value: string) => {
    const { data, error } = await supabase.from(table).select('*').eq(column, value);
    if (error) throw new Error(`${table}: ${error.message}`);
    return data || [];
  },

  insert: async (table: string, item: any) => {
    const { data, error } = await supabase.from(table).insert([item]).select();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data ? data[0] : item;
  },

  update: async (table: string, id: string, updates: any) => {
    const key = table === 'settings' ? 'centerId' : 'id';
    const { data, error } = await supabase.from(table).update(updates).eq(key, id).select();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data ? data[0] : updates;
  },

  delete: async (table: string, id: string) => {
    const key = table === 'settings' ? 'centerId' : 'id';
    const { error } = await supabase.from(table).delete().eq(key, id);
    if (error) throw new Error(`${table}: ${error.message}`);
    return true;
  },

  upsert: async (table: string, item: any, onConflict: string = 'id') => {
    const { data, error } = await supabase.from(table).upsert(item, { onConflict }).select();
    if (error) throw new Error(`${table}: ${error.message}`);
    return data ? data[0] : item;
  },

  /** Bazadagi funksiyani chaqirish (login, parol o'zgartirish va h.k.) */
  rpc: async (fn: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.rpc(fn, params);
    if (error) throw new Error(`${fn}: ${error.message}`);
    return data;
  },
};
