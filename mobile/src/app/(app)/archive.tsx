import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Student, StudentStatus } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

/**
 * Arxiv — alohida jadval emas: `students` ning GRADUATED/DROPPED holatdagilari
 * (web Archive.tsx bilan bir xil mantiq).
 */
const ARCHIVED = [StudentStatus.GRADUATED, StudentStatus.DROPPED];

export default function ArchiveScreen() {
  const { t } = useAuth();
  const { data, loading, refreshing, error, reload } = useCenterData<Student>('students');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const archived = useMemo(() => data.filter((s) => ARCHIVED.includes(s.status)), [data]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    archived.forEach((s) => (c[s.status] = (c[s.status] ?? 0) + 1));
    return c;
  }, [archived]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = filter ? archived.filter((x) => x.status === filter) : archived;
    if (s) rows = rows.filter((x) => x.name?.toLowerCase().includes(s) || x.phone?.includes(s));
    return [...rows].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [archived, q, filter]);

  const cfgOf = (st: string) =>
    st === StudentStatus.GRADUATED
      ? { key: 'graduated', color: brand.primary, bg: brand.primarySubtle, icon: 'school-outline' }
      : { key: 'dropped', color: brand.danger, bg: brand.dangerBg, icon: 'exit-outline' };

  return (
    <View style={s.root}>
      <AppHeader title={t.archive} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          <View style={s.filters}>
            {ARCHIVED.map((st) => {
              const cfg = cfgOf(st);
              const active = filter === st;
              return (
                <Pressable
                  key={st}
                  onPress={() => setFilter(active ? null : st)}
                  style={[s.chip, { backgroundColor: active ? cfg.color : cfg.bg }]}
                >
                  <Text style={[s.chipTxt, { color: active ? '#fff' : cfg.color }]}>
                    {(t as any)[cfg.key] ?? st} {counts[st] ?? 0}
                  </Text>
                </Pressable>
              );
            })}
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
            ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="archive-outline" />}
            renderItem={({ item }) => {
              const cfg = cfgOf(item.status);
              return (
                <View style={s.row}>
                  <View style={[s.icon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
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
                  <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeTxt, { color: cfg.color }]}>
                      {(t as any)[cfg.key] ?? item.status}
                    </Text>
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

  filters: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.lg },
  chip: { paddingHorizontal: space.md, paddingVertical: 7, borderRadius: 100 },
  chipTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },

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
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  name: { color: brand.text, fontSize: 14, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },

  badge: { paddingHorizontal: space.md, paddingVertical: 5, borderRadius: 100 },
  badgeTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
});
