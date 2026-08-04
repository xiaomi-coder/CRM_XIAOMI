
import { createClient } from '@supabase/supabase-js';
import { toast } from './toast';

// Hardcoded fallback for production stability
// VPS backend (PostgreSQL + PostgREST). Eski Supabase o'rnini bosadi.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://api.eduprocrm.uz";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw";

/**
 * Foydalanuvchining shaxsiy propuski (JWT).
 *
 * Oldin har bir so'rov hamma uchun umumiy bo'lgan anon kalit bilan ketardi —
 * ya'ni baza kim so'rayotganini bilmasdi va hamma markazning ma'lumotini
 * berardi. Endi login qilingach shaxsiy propusk olinadi va so'rovlar shu
 * bilan ketadi: propusk ichida `centerId` bor, baza esa shunga qarab
 * faqat o'z markazining qatorlarini qaytaradi.
 */
const TOKEN_KEY = 'edu_token';
let authToken: string | null = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

export const getAuthToken = () => authToken;

/** Propusk bormi va muddati tugamaganmi (imzo bazada tekshiriladi) */
export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

/** Propusk bor bo'lsa, har bir so'rovga o'sha qo'yiladi (anon kalit o'rniga) */
const authFetch: typeof fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);
  return fetch(input, { ...init, headers });
};

// Supabase client initialization
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { global: { fetch: authFetch } })
  : null;

if (!supabase) {
  const missing = [];
  if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    toast.error(`XATO: Quyidagi kalitlar topilmadi: ${missing.join(', ')}. Vercel sozlamalarini tekshiring!`);
  } else if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    toast.error(`XATO: Supabase URL noto'g'ri: ${supabaseUrl}`);
  }

  console.warn("DIQQAT: Supabase ulanishi amalga oshmadi.");
}

export const db = {
  get: async (table: string) => {
    if (!supabase) {
      console.error("Supabase ulanmagan! Environment variablesni tekshiring.");
      return [];
    }
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      return data || [];
    } catch (e: any) {
      console.error(`Ulanish xatosi (${table}):`, e);
      toast.error(`XATO (Yuklash - ${table}): ${e.message || e}`);
      return [];
    }
  },

  getOne: async (table: string, column: string, value: string) => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from(table).select('*').eq(column, value).single();
      if (error) return null;
      return data;
    } catch (e: any) {
      console.error(`GetOne xatosi (${table}):`, e);
      return null;
    }
  },

  insert: async (table: string, item: any) => {
    if (!supabase) {
      const u = import.meta.env.VITE_SUPABASE_URL;
      const k = import.meta.env.VITE_SUPABASE_ANON_KEY;
      toast.error(`XATO: Tizim bazaga ulanmagan! URL: ${u ? 'BOR' : 'YOQ'}, KEY: ${k ? 'BOR' : 'YOQ'}. Qayta urinib ko'ring.`);
      return item;
    }
    try {
      const { data, error } = await supabase.from(table).insert([item]).select();
      if (error) throw error;
      return data ? data[0] : item;
    } catch (e: any) {
      console.error(`Insert xatosi (${table}):`, e);
      toast.error(`XATO (Saqlash - ${table}): ${e.message || e}`);
      throw e;
    }
  },

  update: async (table: string, id: string, updates: any) => {
    const key = table === 'settings' ? 'centerId' : 'id';
    if (!supabase) {
      toast.error("XATO: Tizim bazaga ulanmagan! O'zgarishlar saqlanmadi.");
      return updates;
    }
    try {
      const { data, error } = await supabase.from(table).update(updates).eq(key, id).select();
      if (error) throw error;
      return data ? data[0] : updates;
    } catch (e: any) {
      console.error(`Update xatosi (${table}):`, e);
      toast.error(`XATO (Yangilash - ${table}): ${e.message || e}`);
      throw e;
    }
  },

  delete: async (table: string, id: string) => {
    const key = table === 'settings' ? 'centerId' : 'id';
    if (!supabase) {
      toast.error("XATO: Tizim bazaga ulanmagan! O'chirish amalga oshmadi.");
      return false;
    }
    try {
      const { error } = await supabase.from(table).delete().eq(key, id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error(`Delete xatosi (${table}):`, e);
      toast.error(`XATO (O'chirish - ${table}): ${e.message || e}`);
      return false;
    }
  },

  upsert: async (table: string, item: any, onConflict: string = 'id') => {
    if (!supabase) return item;
    try {
      const { data, error } = await supabase.from(table).upsert(item, { onConflict }).select();
      if (error) throw error;
      return data ? data[0] : item;
    } catch (e: any) {
      console.error(`Upsert xatosi (${table}):`, e);
      toast.error(`XATO (Yangilash/Saqlash - ${table}): ${e.message || e}`);
      throw e;
    }
  },

  /**
   * Login — parol BAZADA tekshiriladi (brauzerda emas) va shaxsiy propusk
   * qaytariladi. Eski ochiq parollar birinchi muvaffaqiyatli kirishda
   * avtomatik bcrypt'ga o'tkaziladi.
   */
  login: async (username: string, password: string): Promise<{
    ok: boolean;
    user?: any;
    reason?: 'invalid' | 'blocked' | 'no_center' | 'network';
  }> => {
    if (!supabase) return { ok: false, reason: 'network' };
    try {
      const { data, error } = await supabase.rpc('login', {
        p_username: username,
        p_password: password,
      });
      if (error) throw error;

      if (!data || data.error) {
        const reason = data?.error === 'center_blocked' ? 'blocked'
          : data?.error === 'center_not_found' ? 'no_center'
            : 'invalid';
        return { ok: false, reason };
      }

      setAuthToken(data.token);
      return { ok: true, user: data.user };
    } catch (e: any) {
      console.error('Login xatosi:', e);
      return { ok: false, reason: 'network' };
    }
  },

  /**
   * PIN bilan kirish (IELTS yoki eski test). Tekshiruv bazada bo'ladi va
   * mehmonga 6 soatlik cheklangan propusk beriladi.
   *
   * Oldin frontend BARCHA markazning lidlarini va PIN'larini yuklab olib,
   * ichidan qidirardi — ya'ni bir markazning PIN ro'yxati boshqasiga ko'rinardi.
   */
  redeemPin: async (pin: string, studentName = ''): Promise<any> => {
    if (!supabase) return { error: 'network' };
    try {
      const { data, error } = await supabase.rpc('redeem_pin', {
        p_pin: pin,
        p_student_name: studentName,
      });
      if (error) throw error;
      if (data?.token) setAuthToken(data.token);
      return data ?? { error: 'invalid_pin' };
    } catch (e: any) {
      console.error('PIN xatosi:', e);
      return { error: 'network' };
    }
  },

  logout: () => setAuthToken(null),
};

