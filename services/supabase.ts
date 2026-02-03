
import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback for production stability
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://ndrynujcnzxkvhmrlemr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcnludWpjbnp4a3ZobXJsZW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzODM0NDcsImV4cCI6MjA4Mzk1OTQ0N30.DrSYWDTgOVft-LH136GwJeyYdvyKMnZO_NwiegPwDr0";

// Supabase client initialization
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http') && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  const missing = [];
  if (!supabaseUrl) missing.push("VITE_SUPABASE_URL");
  if (!supabaseAnonKey) missing.push("VITE_SUPABASE_ANON_KEY");

  if (missing.length > 0) {
    alert(`XATO: Quyidagi kalitlar topilmadi: ${missing.join(', ')}. Vercel sozlamalarini tekshiring!`);
  } else if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    alert(`XATO: Supabase URL noto'g'ri: ${supabaseUrl}`);
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
      alert(`XATO (Yuklash - ${table}): ${e.message || e}`);
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
      alert(`XATO: Tizim bazaga ulanmagan! URL: ${u ? 'BOR' : 'YOQ'}, KEY: ${k ? 'BOR' : 'YOQ'}. Qayta urinib ko'ring.`);
      return item;
    }
    try {
      const { data, error } = await supabase.from(table).insert([item]).select();
      if (error) throw error;
      return data ? data[0] : item;
    } catch (e: any) {
      console.error(`Insert xatosi (${table}):`, e);
      alert(`XATO (Saqlash - ${table}): ${e.message || e}`);
      throw e;
    }
  },

  update: async (table: string, id: string, updates: any) => {
    const key = table === 'settings' ? 'centerId' : 'id';
    if (!supabase) {
      alert("XATO: Tizim bazaga ulanmagan! O'zgarishlar saqlanmadi.");
      return updates;
    }
    try {
      const { data, error } = await supabase.from(table).update(updates).eq(key, id).select();
      if (error) throw error;
      return data ? data[0] : updates;
    } catch (e: any) {
      console.error(`Update xatosi (${table}):`, e);
      alert(`XATO (Yangilash - ${table}): ${e.message || e}`);
      throw e;
    }
  },

  delete: async (table: string, id: string) => {
    const key = table === 'settings' ? 'centerId' : 'id';
    if (!supabase) {
      alert("XATO: Tizim bazaga ulanmagan! O'chirish amalga oshmadi.");
      return false;
    }
    try {
      const { error } = await supabase.from(table).delete().eq(key, id);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error(`Delete xatosi (${table}):`, e);
      alert(`XATO (O'chirish - ${table}): ${e.message || e}`);
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
      alert(`XATO (Yangilash/Saqlash - ${table}): ${e.message || e}`);
      throw e;
    }
  }
};

