import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

/**
 * VPS backend (PostgreSQL + PostgREST) — sayt bilan AYNAN bir xil API.
 * Eslatma: loyihada Supabase Auth ishlatilmaydi (auth `users` jadvali orqali),
 * shuning uchun persistSession o'chirilgan.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_API_URL || 'https://api.eduprocrm.uz';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

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
};
