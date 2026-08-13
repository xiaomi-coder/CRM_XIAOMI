import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Student } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

export default function StudentsScreen() {
  const { t } = useAuth();
  const router = useRouter();
  const { data, loading, refreshing, error, reload } = useCenterData<Student>('students');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = s
      ? data.filter((x) => x.name?.toLowerCase().includes(s) || x.phone?.includes(s))
      : data;
    return [...rows].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [data, q]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  return (
    <View style={s.root}>
      <View style={s.topRow}>
        <View style={[s.searchWrap, { flex: 1 }]}>
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
        <Pressable
          onPress={() => router.push('/(app)/student-new')}
          hitSlop={10}
          style={s.addBtn}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={brand.primary} />
        }
        ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="people-outline" />}
        renderItem={({ item }) => {
          const debt = (item.balance ?? 0) < 0;
          return (
            <Pressable
              style={({ pressed }) => [s.row, pressed && s.rowPressed]}
              onPress={() => router.push(`/(app)/student/${item.id}`)}
            >
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{item.name?.charAt(0) ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={s.sub} numberOfLines={1}>
                  {item.phone || '—'}
                  {item.lastGroup ? ` · ${item.lastGroup}` : ''}
                </Text>
              </View>
              <View style={[s.badge, debt ? s.badgeDebt : s.badgeOk]}>
                <Text style={[s.badgeTxt, debt ? s.badgeTxtDebt : s.badgeTxtOk]}>
                  {money(item.balance)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={brand.textMuted} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingRight: space.lg,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  rowPressed: { opacity: 0.6 },
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

  badge: { paddingHorizontal: space.md, paddingVertical: 5, borderRadius: 100 },
  badgeOk: { backgroundColor: brand.primarySubtle },
  badgeDebt: { backgroundColor: brand.dangerBg },
  badgeTxt: { fontSize: 11, fontWeight: '900' },
  badgeTxtOk: { color: brand.primary },
  badgeTxtDebt: { color: brand.danger },
});
