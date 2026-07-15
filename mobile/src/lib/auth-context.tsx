import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as auth from './auth';
import { Language, translations } from './i18n';
import { User } from './types';

type AuthState = {
  user: User | null;
  /** Sessiya diskdan o'qilgunicha true — splash ko'rsatiladi */
  loading: boolean;
  lang: Language;
  t: (typeof translations)['uz'];
  signIn: (username: string, pass: string) => Promise<User>;
  signOut: () => Promise<void>;
  setLang: (l: Language) => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

const LANG_KEY = 'edu_lang';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLangState] = useState<Language>('uz');

  useEffect(() => {
    (async () => {
      const [saved, savedLang] = await Promise.all([
        auth.loadSession(),
        AsyncStorage.getItem(LANG_KEY),
      ]);
      if (saved) setUser(saved);
      if (savedLang === 'uz' || savedLang === 'ru' || savedLang === 'en') setLangState(savedLang);
      setLoading(false);
    })();
  }, []);

  const signIn = async (username: string, pass: string) => {
    const u = await auth.login(username, pass);
    setUser(u);
    return u;
  };

  const signOut = async () => {
    await auth.logout();
    setUser(null);
  };

  const setLang = async (l: Language) => {
    setLangState(l);
    await AsyncStorage.setItem(LANG_KEY, l);
  };

  return (
    <Ctx.Provider value={{ user, loading, lang, t: translations[lang], signIn, signOut, setLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth faqat <AuthProvider> ichida ishlatiladi');
  return v;
}
