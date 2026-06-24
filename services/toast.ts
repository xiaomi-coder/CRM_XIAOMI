// Global toast emitter — React'dan TASHQARIDA ham chaqirsa bo'ladi (masalan services/supabase.ts).
// Toaster komponenti mount bo'lganda handler ro'yxatdan o'tadi.

export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

type Listener = (toast: ToastItem) => void;

interface ToastFn {
  (message: string, type?: ToastType): void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

let listener: Listener | null = null;
let counter = 0;

export function _registerToastListener(fn: Listener | null) {
  listener = fn;
}

const base = (message: string, type: ToastType = 'info') => {
  const item: ToastItem = { id: ++counter, message, type };
  if (listener) {
    listener(item);
  } else {
    // Hali Toaster mount bo'lmagan bo'lsa — konsolga
    console.log(`[toast:${type}] ${message}`);
  }
};

export const toast = base as ToastFn;
toast.success = (message: string) => base(message, 'success');
toast.error = (message: string) => base(message, 'error');
toast.info = (message: string) => base(message, 'info');
