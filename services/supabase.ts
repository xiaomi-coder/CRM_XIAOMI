
import { createClient } from '@supabase/supabase-js';
import { toast } from './toast';

// Hardcoded fallback for production stability
// VPS backend (PostgreSQL + PostgREST). Eski Supabase o'rnini bosadi.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://api.eduprocrm.uz";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw";

// Supabase client initialization
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
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
  }
};

