import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Payment, Student, StudentStatus } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);
const today = () => new Date().toISOString().split('T')[0];

/**
 * Qarzdorlar — direktorning kunlik eng muhim savoli: kim pul to'lamagan.
 *
 * Telefonda qiymati shundaki, ism yonidagi tugma darrov QO'NG'IROQ qiladi —
 * ko'rdi, bosdi, gaplashdi. Kompyuterda bu raqamni ko'chirib, telefonga
 * terish kerak edi.
 *
 * ⚠️ Qarzdorlik mezoni veb'dagi Dashboard bilan bir xil bo'lishi SHART
 * (`components/Dashboard.tsx` → debtorStudents), aks holda ikki joyda
 * har xil son chiqadi.
 */
export default function DebtorsScreen() {
  const { t } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const students = useCenterData<Student>('students');
  const payments = useCenterData<Payment>('payments');

  const rows = useMemo(() => {
    const d = today();
    return students.data
      .filter((s) => (s.status ?? StudentStatus.ACTIVE) === StudentStatus.ACTIVE)
      .filter((s) => {
        // 1) To'lov sanasi o'tib ketgan
        if (s.nextPaymentDate && s.nextPaymentDate < d) return true;
        // 2) Sana yo'q, lekin 30 kundan beri to'lov qilmagan
        if (!s.nextPaymentDate) {
          const mine = payments.data.filter((p) => p.studentId === s.id);
          if (mine.length === 0) return false; // hech qachon to'lamagan — yangi o'quvchi bo'lishi mumkin
          const last = [...mine].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
          const days = Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000);
          return days > 30;
        }
        return false;
      })
      .map((s) => {
        const overdue = s.nextPaymentDate
          ? Math.floor((Date.now() - new Date(s.nextPaymentDate).getTime()) / 86400000)
          : null;
        return { ...s, overdue };
      })
      .sort((a, b) => (b.overdue ?? 0) - (a.overdue ?? 0));
  }, [students.data, payments.data]);

  const call = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>{t.debtors || 'Qarzdorlar'}</Text>
        <View style={{ width: 30 }} />
      </View>

      {students.loading || payments.loading ? (
        <Loading />
      ) : students.error ? (
        <ErrorBox message={students.error} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => i.id}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            rows.length > 0 ? (
              <Text style={s.count}>
                {rows.length} {t.students?.toLowerCase()}
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <Empty text={t.no_debtors || "Qarzdor yo'q"} icon="checkmark-circle-outline" />
          }
          renderItem={({ item }) => (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={s.sub} numberOfLines={1}>
                  {item.parentName || t.parent} · {item.parentPhone || item.phone || '—'}
                </Text>
                <View style={s.meta}>
                  {item.overdue !== null && item.overdue > 0 && (
                    <Text style={s.days}>
                      {item.overdue} {t.days_overdue || 'kun kechikkan'}
                    </Text>
                  )}
                  {(item.balance ?? 0) < 0 && (
                    <Text style={s.debt}>{money(item.balance)} UZS</Text>
                  )}
                </View>
              </View>

              <Pressable
                onPress={() => call(item.parentPhone || item.phone)}
                style={s.callBtn}
                hitSlop={8}
              >
                <Ionicons name="call" size={20} color="#fff" />
              </Pressable>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: brand.surface,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  back: { width: 30 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  list: { padding: space.lg, gap: space.sm },
  count: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
  },
  name: { color: brand.text, fontSize: 15, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  meta: { flexDirection: 'row', gap: space.sm, marginTop: 6, flexWrap: 'wrap' },
  days: {
    color: brand.danger,
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: brand.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  debt: {
    color: brand.warning,
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: brand.warningBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
