import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Student } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

export default function StudentsScreen() {
  const { t } = useAuth();
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
        ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="people-outline" />}
        renderItem={({ item }) => {
          const debt = (item.balance ?? 0) < 0;
          return (
            <View style={s.row}>
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
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },

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
  badgeOk: { backgroundColor: 'rgba(5,150,105,0.1)' },
  badgeDebt: { backgroundColor: 'rgba(220,38,38,0.1)' },
  badgeTxt: { fontSize: 11, fontWeight: '900' },
  badgeTxtOk: { color: brand.primary },
  badgeTxtDebt: { color: brand.danger },
});
