import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db, newId } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Expense } from '@/lib/types';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

const CATS: { id: Expense['category']; key: string; icon: string }[] = [
  { id: 'RENT', key: 'cat_rent', icon: 'home-outline' },
  { id: 'TAX', key: 'cat_tax', icon: 'document-text-outline' },
  { id: 'ADVERTISING', key: 'cat_ad', icon: 'megaphone-outline' },
  { id: 'OTHER', key: 'cat_other', icon: 'ellipsis-horizontal' },
];

export default function NewExpenseScreen() {
  const { t, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Expense['category']>('OTHER');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const amountNum = Number(amount.replace(/\D/g, '')) || 0;
  const canSave = title.trim().length > 0 && amountNum > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      await db.insert('expenses', {
        id: newId(),
        centerId: user?.centerId,
        title: title.trim(),
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        category,
      });
      router.back();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>{t.add_expense}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>{t.title}</Text>
        <TextInput
          style={s.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t.title}
          placeholderTextColor={brand.textMuted}
          autoFocus
        />

        <Text style={s.label}>{t.amount}</Text>
        <TextInput
          style={s.amount}
          value={amount ? money(amountNum) : ''}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor={brand.textMuted}
          keyboardType="number-pad"
        />

        <Text style={s.label}>{t.category}</Text>
        <View style={s.cats}>
          {CATS.map((c) => {
            const active = category === c.id;
            return (
              <Pressable key={c.id} onPress={() => setCategory(c.id)} style={[s.cat, active && s.catActive]}>
                <Ionicons name={c.icon as any} size={18} color={active ? '#fff' : brand.textMuted} />
                <Text style={[s.catTxt, active && s.catTxtActive]}>{(t as any)[c.key] ?? c.id}</Text>
              </Pressable>
            );
          })}
        </View>

        {err && <Text style={s.err}>{err}</Text>}

        <Pressable onPress={save} disabled={!canSave} style={[s.save, !canSave && s.saveOff]}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color="#fff" />
              <Text style={s.saveTxt}>{t.save}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: brand.surface,
  },
  back: { padding: 4 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: space.md },

  form: { padding: space.lg, gap: space.sm },
  label: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
    marginBottom: space.xs,
  },
  input: {
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: brand.text,
  },
  amount: {
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: space.lg,
    paddingVertical: 16,
    fontSize: 26,
    fontWeight: '900',
    color: brand.text,
  },

  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
  },
  catActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  catTxt: { fontSize: 13, fontWeight: '800', color: brand.textMuted },
  catTxtActive: { color: '#fff' },

  err: { color: brand.danger, fontSize: 12, fontWeight: '700', marginTop: space.sm },

  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: brand.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: space.xl,
  },
  saveOff: { opacity: 0.4 },
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});
