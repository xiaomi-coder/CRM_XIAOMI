import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Expense } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

/** Kategoriya -> yorliq/rang/ikonka (web Expenses.tsx bilan bir xil) */
const CATS: Record<Expense['category'], { key: string; color: string; bg: string; icon: string }> = {
  RENT: { key: 'cat_rent', color: brand.warning, bg: brand.warningBg, icon: 'home-outline' },
  TAX: { key: 'cat_tax', color: brand.info, bg: brand.infoBg, icon: 'document-text-outline' },
  ADVERTISING: { key: 'cat_ad', color: brand.primary, bg: brand.primarySubtle, icon: 'megaphone-outline' },
  OTHER: { key: 'cat_other', color: brand.neutral, bg: brand.neutralBg, icon: 'ellipsis-horizontal' },
};

export default function ExpensesScreen() {
  const { t } = useAuth();
  const router = useRouter();
  const { data, loading, refreshing, error, reload } = useCenterData<Expense>('expenses');
  const [q, setQ] = useState('');

  useFocusEffect(
    useCallback(() => {
      reload();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const total = useMemo(() => data.reduce((sum, e) => sum + (e.amount ?? 0), 0), [data]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = s ? data.filter((e) => e.title?.toLowerCase().includes(s)) : data;
    return [...rows].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [data, q]);

  return (
    <View style={s.root}>
      <AppHeader
        title={t.expenses}
        right={
          <Pressable onPress={() => router.push('/(app)/expense-new')} hitSlop={10} style={s.addBtn}>
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
          <View style={s.totalCard}>
            <View style={s.totalIcon}>
              <Ionicons name="receipt-outline" size={18} color={brand.danger} />
            </View>
            <View>
              <Text style={s.totalLabel}>{t.total}</Text>
              <Text style={s.totalValue}>{money(total)}</Text>
            </View>
          </View>

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
              <Ionicons name="close-circle" size={18} color={brand.textMuted} onPress={() => setQ('')} />
            )}
          </View>

          <FlatList
            data={list}
            keyExtractor={(i) => i.id}
            contentContainerStyle={s.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={brand.primary} />
            }
            ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="receipt-outline" />}
            renderItem={({ item }) => {
              const cat = CATS[item.category] ?? CATS.OTHER;
              return (
                <View style={s.row}>
                  <View style={[s.icon, { backgroundColor: cat.bg }]}>
                    <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={s.sub} numberOfLines={1}>
                      {item.date || '—'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={s.amount}>{money(item.amount)}</Text>
                    <View style={[s.badge, { backgroundColor: cat.bg }]}>
                      <Text style={[s.badgeTxt, { color: cat.color }]}>
                        {(t as any)[cat.key] ?? item.category}
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

  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
    margin: space.lg,
    marginBottom: space.sm,
  },
  totalIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: brand.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalLabel: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: { color: brand.danger, fontSize: 20, fontWeight: '900', marginTop: 2 },

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
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: brand.text, fontSize: 14, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },
  amount: { color: brand.text, fontSize: 14, fontWeight: '900' },

  badge: { paddingHorizontal: space.sm, paddingVertical: 3, borderRadius: 100 },
  badgeTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
});
