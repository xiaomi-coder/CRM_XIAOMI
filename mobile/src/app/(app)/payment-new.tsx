import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui';
import { db, newId } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { sendTelegramMessage } from '@/lib/telegram';
import { brand, radius, space } from '@/lib/theme';
import { Payment, Student, SystemSettings } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

/** Bugundan N oy keyin — keyingi to'lov sanasi uchun */
const addMonths = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split('T')[0];
};

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

export default function NewPaymentScreen() {
  const { t, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const students = useCenterData<Student>('students');
  const settings = useCenterData<SystemSettings>('settings');

  const [student, setStudent] = useState<Student | null>(null);
  const [q, setQ] = useState('');
  const [amount, setAmount] = useState('');
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [type, setType] = useState<Payment['type']>('CASH');
  // Keyingi to'lov sanasi — veb'dagi kabi standart +1 oy.
  // ⚠️ Busiz serverdagi eslatma tizimi (har kuni 09:00) o'sha o'quvchini
  // umuman ko'rmaydi va u Boshqaruvda qarzdor bo'lib turaveradi.
  const [nextDate, setNextDate] = useState(addMonths(1));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const monthName = String((t as any)[MONTHS[monthIdx]] ?? MONTHS[monthIdx]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = s
      ? students.data.filter((x) => x.name?.toLowerCase().includes(s) || x.phone?.includes(s))
      : students.data;
    return [...rows].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [students.data, q]);

  const amountNum = Number(amount.replace(/\D/g, '')) || 0;
  const canSave = !!student && amountNum > 0 && !saving;

  const save = async () => {
    if (!canSave || !student) return;
    setSaving(true);
    setErr(null);
    try {
      const payment: any = {
        id: newId(),
        centerId: user?.centerId,
        studentId: student.id,
        amount: amountNum,
        date: new Date().toISOString().split('T')[0],
        type,
        forMonth: monthName,
      };
      await db.insert('payments', payment);
      // Balans + keyingi to'lov sanasi (veb AuthenticatedApp.tsx bilan bir xil)
      await db.update('students', student.id, {
        balance: (student.balance || 0) + amountNum,
        nextPaymentDate: nextDate,
      });

      // Ota-onaga chek — veb'dagi matn bilan aynan bir xil
      const cfg = settings.data[0];
      if (cfg?.botToken && student.tgChatId && cfg.notifyPayment !== false) {
        const msg =
          `<b>${t.accept_payment}!</b>\n\n` +
          `👤 ${t.students}: <b>${student.name}</b>\n` +
          `💰 ${t.amount}: <b>${money(amountNum)} UZS</b>\n` +
          `📅 ${t.for_month}: <b>${monthName}</b>\n` +
          `⏳ ${t.next_payment_due}: <b>${nextDate}</b>\n\n` +
          `<i>${cfg.centerName || 'EduControl CRM'}</i>`;
        sendTelegramMessage(cfg.botToken, student.tgChatId, msg);
      }
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
        <Text style={s.headerTitle}>{t.accept_payment}</Text>
        <View style={{ width: 30 }} />
      </View>

      {students.loading ? (
        <Loading />
      ) : !student ? (
        // 1-qadam: o'quvchini tanlash
        <View style={{ flex: 1 }}>
          <View style={s.searchWrap}>
            <Ionicons name="search" size={18} color={brand.textMuted} />
            <TextInput
              style={s.search}
              value={q}
              onChangeText={setQ}
              placeholder={t.select_student}
              placeholderTextColor={brand.textMuted}
              autoFocus
            />
          </View>
          <FlatList
            data={filtered}
            keyExtractor={(i) => i.id}
            contentContainerStyle={s.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable style={({ pressed }) => [s.pick, pressed && { opacity: 0.6 }]} onPress={() => setStudent(item)}>
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{item.name?.charAt(0) ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.pickName}>{item.name}</Text>
                  <Text style={s.pickSub}>{item.phone || '—'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={brand.textMuted} />
              </Pressable>
            )}
          />
        </View>
      ) : (
        // 2-qadam: to'lov ma'lumotlari
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
          <Pressable style={s.chosen} onPress={() => setStudent(null)}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{student.name?.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pickName}>{student.name}</Text>
              <Text style={s.pickSub}>{t.balance}: {money(student.balance)}</Text>
            </View>
            <Text style={s.change}>{t.select}</Text>
          </Pressable>

          <Text style={s.label}>{t.amount || 'Summa'}</Text>
          <TextInput
            style={s.amount}
            value={amount ? money(amountNum) : ''}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor={brand.textMuted}
            keyboardType="number-pad"
            autoFocus
          />

          <Text style={s.label}>{t.for_month}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {MONTHS.map((mk, i) => {
              const active = i === monthIdx;
              return (
                <Pressable key={mk} onPress={() => setMonthIdx(i)} style={[s.chip, active && s.chipActive]}>
                  <Text style={[s.chipTxt, active && s.chipTxtActive]}>{(t as any)[mk] ?? mk}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={s.label}>{t.next_payment_due}</Text>
          <View style={s.typeRow}>
            {[1, 2, 3].map((m) => {
              const d = addMonths(m);
              const active = nextDate === d;
              return (
                <Pressable
                  key={m}
                  onPress={() => setNextDate(d)}
                  style={[s.typeBtn, active && s.typeBtnActive]}
                >
                  <Text style={[s.typeTxt, active && s.typeTxtActive]}>
                    +{m} {t.month || 'oy'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={s.hint}>{nextDate}</Text>

          <Text style={s.label}>{t.payment_method}</Text>
          <View style={s.typeRow}>
            {(['CASH', 'CARD'] as const).map((ty) => {
              const active = type === ty;
              return (
                <Pressable key={ty} onPress={() => setType(ty)} style={[s.typeBtn, active && s.typeBtnActive]}>
                  <Ionicons
                    name={ty === 'CASH' ? 'cash-outline' : 'card-outline'}
                    size={18}
                    color={active ? '#fff' : brand.textMuted}
                  />
                  <Text style={[s.typeTxt, active && s.typeTxtActive]}>{ty === 'CASH' ? t.cash : t.card}</Text>
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
      )}
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

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    margin: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14, color: brand.text },

  list: { paddingHorizontal: space.lg, gap: space.sm },
  pick: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.md,
  },
  avatar: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
  pickName: { color: brand.text, fontSize: 14, fontWeight: '800' },
  pickSub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },

  form: { padding: space.lg, gap: space.sm },
  chosen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.primary,
    padding: space.md,
    marginBottom: space.md,
  },
  change: { color: brand.primary, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  label: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
    marginBottom: space.xs,
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

  chips: { gap: space.sm, paddingVertical: 2 },
  chip: { paddingHorizontal: space.md, paddingVertical: 8, borderRadius: 100, backgroundColor: brand.card, borderWidth: 1, borderColor: brand.border },
  chipActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  chipTxt: { fontSize: 11, fontWeight: '800', color: brand.textMuted },
  chipTxtActive: { color: '#fff' },

  typeRow: { flexDirection: 'row', gap: space.sm },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
  },
  typeBtnActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  typeTxt: { fontSize: 13, fontWeight: '800', color: brand.textMuted },
  typeTxtActive: { color: '#fff' },

  hint: {
    color: brand.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 2,
  },
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
