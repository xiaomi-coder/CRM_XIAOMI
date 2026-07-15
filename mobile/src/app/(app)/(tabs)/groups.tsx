import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Group, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

export default function GroupsScreen() {
  const { t, user } = useAuth();
  const { data, loading, refreshing, error, reload } = useCenterData<Group>('groups');

  /** O'qituvchi faqat o'z guruhlarini ko'radi */
  const list = useMemo(() => {
    if (!user) return [];
    const rows =
      user.role === UserRole.TEACHER ? data.filter((g) => g.teacher === user.name) : data;
    return [...rows].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [data, user]);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} />;

  return (
    <FlatList
      style={{ backgroundColor: brand.bg }}
      data={list}
      keyExtractor={(i) => i.id}
      contentContainerStyle={s.list}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={brand.primary} />
      }
      ListEmptyComponent={<Empty text={t.no_data || "Guruh yo'q"} icon="layers-outline" />}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.head}>
            <View style={s.icon}>
              <Ionicons name="layers" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={s.sub} numberOfLines={1}>
                {item.subject || '—'} · {item.teacher || '—'}
              </Text>
            </View>
            <View style={s.countBadge}>
              <Ionicons name="people" size={12} color={brand.primary} />
              <Text style={s.countTxt}>{item.studentIds?.length ?? 0}</Text>
            </View>
          </View>

          <View style={s.meta}>
            <View style={s.metaItem}>
              <Ionicons name="time-outline" size={13} color={brand.textMuted} />
              <Text style={s.metaTxt}>{item.time || '—'}</Text>
            </View>
            <View style={s.metaItem}>
              <Ionicons name="calendar-outline" size={13} color={brand.textMuted} />
              <Text style={s.metaTxt} numberOfLines={1}>
                {item.days?.join(', ') || '—'}
              </Text>
            </View>
          </View>
        </View>
      )}
    />
  );
}

const s = StyleSheet.create({
  list: { padding: space.lg, gap: space.md, flexGrow: 1 },
  card: {
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: brand.text, fontSize: 15, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5,150,105,0.1)',
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: 100,
  },
  countTxt: { color: brand.primary, fontSize: 12, fontWeight: '900' },

  meta: {
    flexDirection: 'row',
    gap: space.xl,
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: brand.border,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  metaTxt: { color: brand.textMuted, fontSize: 12, fontWeight: '600' },
});
