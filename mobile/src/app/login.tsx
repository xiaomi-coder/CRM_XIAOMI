import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthError } from '../lib/auth';
import { useAuth } from '../lib/auth-context';
import { brand, radius, space } from '../lib/theme';

export default function LoginScreen() {
  const { signIn, t, lang, setLang } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!username.trim() || !password) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(username.trim(), password);
      router.replace('/(app)/(tabs)');
    } catch (e) {
      if (e instanceof AuthError) {
        const map: Record<string, string> = {
          BAD_CREDENTIALS: t.login_error,
          CENTER_NOT_FOUND: "O'quv markazi topilmadi.",
          CENTER_BLOCKED: "O'quv markazingiz bloklangan. Creator bilan bog'laning.",
          NETWORK: t.network_error,
        };
        setError(map[e.code] ?? t.login_error);
      } else {
        setError(t.network_error);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Zumrad aurona fon */}
      <View style={[s.blob, s.blobTop]} />
      <View style={[s.blob, s.blobBottom]} />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {/* Til tanlash */}
          <View style={s.langRow}>
            {(['uz', 'ru', 'en'] as const).map((l) => (
              <Pressable
                key={l}
                onPress={() => setLang(l)}
                style={[s.langBtn, lang === l && s.langBtnActive]}
              >
                <Text style={[s.langTxt, lang === l && s.langTxtActive]}>{l.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          {/* Logo */}
          <View style={s.logoWrap}>
            <View style={s.logo}>
              <Text style={s.logoTxt}>E</Text>
            </View>
            <Text style={s.brandName}>EduControl</Text>
            <Text style={s.brandSub}>ONLINE CRM SYSTEM</Text>
          </View>

          {/* Karta */}
          <View style={s.card}>
            {error && (
              <View style={s.errBox}>
                <Ionicons name="alert-circle" size={18} color="#FCA5A5" />
                <Text style={s.errTxt}>{error}</Text>
              </View>
            )}

            <Text style={s.label}>{t.username}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={18} color={brand.textMutedOnDark} />
              <TextInput
                style={s.input}
                value={username}
                onChangeText={setUsername}
                placeholder={t.login}
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            <Text style={[s.label, { marginTop: space.lg }]}>{t.password}</Text>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={brand.textMutedOnDark} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••"
                placeholderTextColor="rgba(255,255,255,0.3)"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                onSubmitEditing={onSubmit}
                returnKeyType="go"
              />
              <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={10}>
                <Ionicons
                  name={showPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={brand.textMutedOnDark}
                />
              </Pressable>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={busy}
              style={({ pressed }) => [s.btn, (pressed || busy) && s.btnPressed]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.btnTxt}>{t.login_button}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
          </View>

          <Text style={s.footer}>EduControl v2.0 • Online CRM</Text>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.dark },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: space.xl },

  blob: { position: 'absolute', borderRadius: 9999, opacity: 0.18 },
  blobTop: { width: 320, height: 320, top: -80, left: -60, backgroundColor: brand.primary },
  blobBottom: { width: 320, height: 320, bottom: -80, right: -60, backgroundColor: brand.accent },

  langRow: { flexDirection: 'row', justifyContent: 'center', gap: space.sm, marginBottom: space.xl },
  langBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.sm },
  langBtnActive: { backgroundColor: 'rgba(5,150,105,0.25)' },
  langTxt: { color: brand.textMutedOnDark, fontSize: 12, fontWeight: '800' },
  langTxtActive: { color: brand.primaryLight },

  logoWrap: { alignItems: 'center', marginBottom: space.xl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: radius.xl,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  logoTxt: { color: '#fff', fontSize: 38, fontWeight: '900' },
  brandName: { color: '#fff', fontSize: 26, fontWeight: '900', fontStyle: 'italic' },
  brandSub: {
    color: 'rgba(52,211,153,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 4,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.055)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: space.xl,
  },

  errBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.25)',
    borderRadius: radius.lg,
    padding: space.md,
    marginBottom: space.lg,
  },
  errTxt: { color: '#FCA5A5', fontSize: 12, fontWeight: '700', flex: 1 },

  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
  },
  input: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600', paddingVertical: 14 },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    backgroundColor: brand.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: space.xl,
  },
  btnPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  btnTxt: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  footer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: space.xl,
    textTransform: 'uppercase',
  },
});
