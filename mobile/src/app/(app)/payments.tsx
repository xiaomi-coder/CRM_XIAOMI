import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Payment, Student } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

export default function PaymentsScreen() {
  const { t } = useAuth();
  const router = useRouter();
  const payments = useCenterData<Payment>('payments');
  const students = useCenterData<Student>('students');
  const [q, setQ] = useState('');

  // Formadan qaytganda ro'yxatni yangilash (yangi to'lov ko'rinishi uchun)
  useFocusEffect(
    useCallback(() => {
      payments.reload();
      students.reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  /** studentId -> ism (ro'yxatda ko'rsatish uchun) */
  const nameById = useMemo(() => {
    const m: Record<string, string> = {};
    students.data.forEach((s) => (m[s.id] = s.name));
    return m;
  }, [students.data]);

  const totals = useMemo(() => {
    let cash = 0;
    let card = 0;
    payments.data.forEach((p) => {
      if (p.type === 'CASH') cash += p.amount ?? 0;
      else card += p.amount ?? 0;
    });
    return { cash, card };
  }, [payments.data]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = s
      ? payments.data.filter(
          (p) =>
            (nameById[p.studentId] ?? '').toLowerCase().includes(s) ||
            (p.forMonth ?? '').toLowerCase().includes(s)
        )
      : payments.data;
    // Eng yangisi tepada
    return [...rows].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [payments.data, nameById, q]);

  const loading = payments.loading || students.loading;
  const error = payments.error || students.error;
  const reload = () => {
    payments.reload();
    students.reload();
  };

  return (
    <View style={s.root}>
      <AppHeader
        title={t.payments}
        right={
          <Pressable onPress={() => router.push('/(app)/payment-new')} hitSlop={10} style={s.addBtn}>
            <Ionicons name="add" size={22} color="#fff" />
          </Pressable>
        }
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          {/* Naqd / Plastik jami */}
          <View style={s.stats}>
            <View style={s.stat}>
              <View style={s.statIcon}>
                <Ionicons name="cash-outline" size={16} color={brand.primary} />
              </View>
              <Text style={s.statLabel}>{t.cash}</Text>
              <Text style={s.statValue}>{money(totals.cash)}</Text>
            </View>
            <View style={s.stat}>
              <View style={s.statIcon}>
                <Ionicons name="card-outline" size={16} color={brand.primary} />
              </View>
              <Text style={s.statLabel}>{t.card}</Text>
              <Text style={s.statValue}>{money(totals.card)}</Text>
            </View>
          </View>

          {/* Qidiruv */}
          <View style={s.searchWrap}>
            <Ionicons name="search" size={18} color={brand.textMuted} />
            <TextInput
              style={s.search}
              value={q}
              onChangeText={setQ}
              placeholder={t.search || 'Qidirish...'}
              placeholderTextColor={brand.textMuted}
            />
            {q.length > 0 && (
              <Ionicons
                name="close-circle"
                size={18}
                color={brand.textMuted}
                onPress={() => setQ('')}
              />
            )}
          </View>

          <FlatList
            data={list}
            keyExtractor={(i) => i.id}
            contentContainerStyle={s.list}
            refreshControl={
              <RefreshControl
                refreshing={payments.refreshing}
                onRefresh={reload}
                tintColor={brand.primary}
              />
            }
            ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="wallet-outline" />}
            renderItem={({ item }) => {
              const name = nameById[item.studentId] ?? '—';
              const isCash = item.type === 'CASH';
              return (
                <View style={s.row}>
                  <View style={s.avatar}>
                    <Text style={s.avatarTxt}>{name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>
                      {name}
                    </Text>
                    <Text style={s.sub} numberOfLines={1}>
                      {item.forMonth || '—'}
                      {item.date ? ` · ${item.date}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={s.amount}>{money(item.amount)}</Text>
                    <View style={[s.badge, isCash ? s.badgeCash : s.badgeCard]}>
                      <Text style={[s.badgeTxt, isCash ? s.badgeTxtCash : s.badgeTxtCard]}>
                        {isCash ? t.cash : t.card}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },

  addBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stats: { flexDirection: 'row', gap: space.md, padding: space.lg, paddingBottom: space.sm },
  stat: {
    flex: 1,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(5,150,105,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  statLabel: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { color: brand.primary, fontSize: 18, fontWeight: '900', marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    marginHorizontal: space.lg,
    marginBottom: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14, color: brand.text },

  list: { padding: space.lg, paddingTop: space.sm, gap: space.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
  name: { color: brand.text, fontSize: 14, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },
  amount: { color: brand.text, fontSize: 14, fontWeight: '900' },

  badge: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: 100 },
  badgeCash: { backgroundColor: 'rgba(5,150,105,0.1)' },
  badgeCard: { backgroundColor: 'rgba(45,212,191,0.12)' },
  badgeTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  badgeTxtCash: { color: brand.primary },
  badgeTxtCard: { color: '#0D9488' },
});
