import { lazy, ComponentType } from 'react';

/**
 * Kod bo'laklarga bo'lingandan keyin paydo bo'ladigan muammoni yopadi.
 *
 * Ilova ochiq turganda yangi versiya deploy qilinsa, eski bo'lak fayllari
 * (assets/Students-abc123.js) serverdan yo'q bo'ladi. Foydalanuvchi shu
 * paytda ochmagan ekranga o'tsa, brauzer yo'q faylni so'raydi va ekran
 * umuman ochilmaydi.
 *
 * Yechim: bo'lak yuklanmasa sahifa bir marta qayta yuklanadi — yangi
 * index.html yangi bo'lak nomlarini olib keladi. "Bir marta" sessionStorage
 * bilan kafolatlanadi, aks holda tarmoq uzilganda cheksiz aylanish bo'lardi.
 */
const RELOAD_KEY = 'chunk_reload_at';

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
      // 10 soniya ichida ikkinchi marta qayta yuklamaymiz
      if (Date.now() - last > 10_000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
        // Sahifa yopilguncha kutamiz — bu promise hech qachon hal bo'lmaydi
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
