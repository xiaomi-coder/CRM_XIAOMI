import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Result } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

/** Natija turi -> rang/ikonka */
const TYPES: Record<Result['type'], { color: string; bg: string; icon: string }> = {
  IELTS: { color: '#DC2626', bg: 'rgba(220,38,38,0.1)', icon: 'ribbon-outline' },
  CEFR: { color: '#2563EB', bg: 'rgba(37,99,235,0.1)', icon: 'language-outline' },
  UNIVERSITY: { color: brand.primary, bg: 'rgba(5,150,105,0.1)', icon: 'school-outline' },
  OTHER: { color: '#64748B', bg: 'rgba(100,116,139,0.1)', icon: 'trophy-outline' },
};

const FILTERS = ['IELTS', 'CEFR', 'UNIVERSITY', 'OTHER'] as const;

export default function ResultsScreen() {
  const { t } = useAuth();
  const { data, loading, refreshing, error, reload } = useCenterData<Result>('results');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    data.forEach((r) => (c[r.type] = (c[r.type] ?? 0) + 1));
    return c;
  }, [data]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    let rows = filter ? data.filter((r) => r.type === filter) : data;
    if (s) {
      rows = rows.filter(
        (r) => r.studentName?.toLowerCase().includes(s) || r.title?.toLowerCase().includes(s)
      );
    }
    return [...rows].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
  }, [data, q, filter]);

  return (
    <View style={s.root}>
      <AppHeader title={t.results_section || 'Natijalar'} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
          <View style={s.filters}>
            {FILTERS.map((ty) => {
              const cfg = TYPES[ty];
              const active = filter === ty;
              return (
                <Pressable
                  key={ty}
                  onPress={() => setFilter(active ? null : ty)}
                  style={[s.chip, { backgroundColor: active ? cfg.color : cfg.bg }]}
                >
                  <Text style={[s.chipTxt, { color: active ? '#fff' : cfg.color }]}>
                    {ty} {counts[ty] ?? 0}
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
            ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="trophy-outline" />}
            renderItem={({ item }) => {
              const cfg = TYPES[item.type] ?? TYPES.OTHER;
              return (
                <View style={s.row}>
                  <View style={[s.icon, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>
                      {item.studentName}
                    </Text>
                    <Text style={s.sub} numberOfLines={1}>
                      {item.title || item.type}
                      {item.date ? ` · ${item.date}` : ''}
                    </Text>
                  </View>
                  <View style={[s.scoreBox, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.scoreTxt, { color: cfg.color }]}>{item.score || '—'}</Text>
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

  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
  },
  chip: { paddingHorizontal: space.md, paddingVertical: 7, borderRadius: 100 },
  chipTxt: { fontSize: 10, fontWeight: '900' },

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
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: brand.text, fontSize: 14, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },

  scoreBox: { paddingHorizontal: space.md, paddingVertical: 6, borderRadius: radius.sm, minWidth: 46, alignItems: 'center' },
  scoreTxt: { fontSize: 14, fontWeight: '900' },
});
