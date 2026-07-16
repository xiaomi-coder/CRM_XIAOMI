import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { User, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

/** Rol -> yorliq/rang */
const ROLES: Record<string, { key: string; color: string; bg: string }> = {
  [UserRole.DIRECTOR]: { key: 'role_director', color: brand.primary, bg: 'rgba(5,150,105,0.1)' },
  [UserRole.ADMIN]: { key: 'role_admin', color: '#2563EB', bg: 'rgba(37,99,235,0.1)' },
  [UserRole.TEACHER]: { key: 'role_teacher', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  [UserRole.SUPER_ADMIN]: { key: 'role_creator', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
};

export default function StaffScreen() {
  const { t } = useAuth();
  const { data, loading, refreshing, error, reload } = useCenterData<User>('users');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const rows = s
      ? data.filter((u) => u.name?.toLowerCase().includes(s) || u.username?.toLowerCase().includes(s))
      : data;
    // Direktor tepada, keyin admin, keyin o'qituvchilar
    const order: Record<string, number> = {
      [UserRole.SUPER_ADMIN]: 0,
      [UserRole.DIRECTOR]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.TEACHER]: 3,
    };
    return [...rows].sort(
      (a, b) => (order[a.role] ?? 9) - (order[b.role] ?? 9) || (a.name ?? '').localeCompare(b.name ?? '')
    );
  }, [data, q]);

  return (
    <View style={s.root}>
      <AppHeader title={t.staff} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <>
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
            ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="person-circle-outline" />}
            renderItem={({ item }) => {
              const cfg = ROLES[item.role] ?? ROLES[UserRole.TEACHER];
              const isTeacher = item.role === UserRole.TEACHER;
              return (
                <View style={s.row}>
                  <View style={[s.avatar, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.avatarTxt, { color: cfg.color }]}>{item.name?.charAt(0) ?? '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.name} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={s.sub} numberOfLines={1}>
                      @{item.username}
                      {isTeacher && item.salaryPercentage ? ` · ${item.salaryPercentage}%` : ''}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: cfg.bg }]}>
                    <Text style={[s.badgeTxt, { color: cfg.color }]}>
                      {(t as any)[cfg.key] ?? item.role}
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
  avatar: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontWeight: '900', fontSize: 15 },
  name: { color: brand.text, fontSize: 14, fontWeight: '800' },
  sub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },

  badge: { paddingHorizontal: space.md, paddingVertical: 5, borderRadius: 100 },
  badgeTxt: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
});
