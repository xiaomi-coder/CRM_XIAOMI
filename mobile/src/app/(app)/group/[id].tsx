import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { db } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Group, Student, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const groups = useCenterData<Group>('groups');
  const students = useCenterData<Student>('students');

  const group = useMemo(() => groups.data.find((g) => g.id === id), [groups.data, id]);
  const canEdit = user?.role !== UserRole.TEACHER; // o'qituvchi faqat ko'radi

  const [picker, setPicker] = useState(false);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const members = useMemo(() => {
    if (!group) return [];
    const ids = new Set(group.studentIds ?? []);
    return students.data.filter((s) => ids.has(s.id)).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [group, students.data]);

  const notMembers = useMemo(() => {
    if (!group) return [];
    const ids = new Set(group.studentIds ?? []);
    const s = q.trim().toLowerCase();
    return students.data
      .filter((x) => !ids.has(x.id) && (!s || x.name?.toLowerCase().includes(s) || x.phone?.includes(s)))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [group, students.data, q]);

  const setIds = async (ids: string[], student?: Student) => {
    if (!group) return;
    setBusy(true);
    setErr(null);
    try {
      await db.update('groups', group.id, { studentIds: ids });
      // O'quvchining "oxirgi guruh"ini yangilash (qo'shilganda)
      if (student) await db.update('students', student.id, { lastGroup: group.name });
      await groups.reload();
      await students.reload();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  const addStudent = (st: Student) => {
    if (!group) return;
    setPicker(false);
    setIds([...(group.studentIds ?? []), st.id], st);
  };
  const removeStudent = (st: Student) => {
    if (!group) return;
    setIds((group.studentIds ?? []).filter((x) => x !== st.id));
  };

  const loading = groups.loading || students.loading;

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          {group?.name ?? t.groups}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <Loading />
      ) : !group ? (
        <ErrorBox message={t.search_empty || "Guruh topilmadi"} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Guruh ma'lumoti */}
          <View style={s.info}>
            <View style={s.gIcon}>
              <Ionicons name="layers" size={22} color="#fff" />
            </View>
            <Text style={s.gName}>{group.name}</Text>
            <Text style={s.gSub}>
              {group.subject || '—'} · {group.teacher || t.not_assigned}
            </Text>
            <View style={s.chips}>
              <View style={s.metaChip}>
                <Ionicons name="time-outline" size={13} color={brand.textMuted} />
                <Text style={s.metaTxt}>{group.time || '—'}</Text>
              </View>
              <View style={s.metaChip}>
                <Ionicons name="calendar-outline" size={13} color={brand.textMuted} />
                <Text style={s.metaTxt}>{group.days?.join(', ') || '—'}</Text>
              </View>
              <View style={s.metaChip}>
                <Ionicons name="pricetag-outline" size={13} color={brand.textMuted} />
                <Text style={s.metaTxt}>{money(group.fee)}</Text>
              </View>
            </View>
          </View>

          {/* O'quvchilar sarlavhasi + qo'shish */}
          <View style={s.sectionRow}>
            <Text style={s.section}>
              {t.students} · {members.length}
            </Text>
            {canEdit && (
              <Pressable onPress={() => { setQ(''); setPicker(true); }} style={s.addBtn} disabled={busy}>
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={s.addTxt}>{t.add_student}</Text>
              </Pressable>
            )}
          </View>

          {err && <Text style={s.err}>{err}</Text>}

          {members.length === 0 ? (
            <Empty text={t.no_data || "Ma'lumot yo'q"} icon="people-outline" />
          ) : (
            <View style={{ gap: space.sm }}>
              {members.map((st) => (
                <View key={st.id} style={s.row}>
                  <Pressable style={s.rowMain} onPress={() => router.push(`/(app)/student/${st.id}`)}>
                    <View style={s.avatar}>
                      <Text style={s.avatarTxt}>{st.name?.charAt(0) ?? '?'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {st.name}
                      </Text>
                      <Text style={s.rowSub} numberOfLines={1}>
                        {st.phone || '—'}
                      </Text>
                    </View>
                  </Pressable>
                  {canEdit && (
                    <Pressable onPress={() => removeStudent(st)} hitSlop={8} style={s.rmBtn} disabled={busy}>
                      <Ionicons name="close" size={16} color={brand.danger} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {/* O'quvchi qo'shish oynasi */}
      <Modal visible={picker} animationType="slide" onRequestClose={() => setPicker(false)}>
        <View style={[s.root, { paddingTop: insets.top }]}>
          <View style={s.mHeader}>
            <Text style={s.mTitle}>{t.add_student}</Text>
            <Pressable onPress={() => setPicker(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color={brand.text} />
            </Pressable>
          </View>
          <View style={s.searchWrap}>
            <Ionicons name="search" size={18} color={brand.textMuted} />
            <TextInput
              style={s.search}
              value={q}
              onChangeText={setQ}
              placeholder={t.search || 'Qidirish...'}
              placeholderTextColor={brand.textMuted}
              autoFocus
            />
          </View>
          <FlatList
            data={notMembers}
            keyExtractor={(i) => i.id}
            contentContainerStyle={s.pickList}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Empty text={t.no_data || "Ma'lumot yo'q"} icon="people-outline" />}
            renderItem={({ item }) => (
              <Pressable style={({ pressed }) => [s.row, pressed && { opacity: 0.6 }]} onPress={() => addStudent(item)}>
                <View style={s.avatar}>
                  <Text style={s.avatarTxt}>{item.name?.charAt(0) ?? '?'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowName}>{item.name}</Text>
                  <Text style={s.rowSub}>{item.phone || '—'}</Text>
                </View>
                <Ionicons name="add-circle" size={22} color={brand.primary} />
              </Pressable>
            )}
          />
        </View>
      </Modal>

      {busy && (
        <View style={s.busy}>
          <ActivityIndicator color={brand.primary} size="large" />
        </View>
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

  scroll: { padding: space.lg, paddingBottom: space.xl },

  info: { alignItems: 'center', paddingVertical: space.lg },
  gIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gName: { color: brand.text, fontSize: 19, fontWeight: '900', marginTop: space.md },
  gSub: { color: brand.textMuted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md, justifyContent: 'center' },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 100,
    paddingHorizontal: space.md,
    paddingVertical: 6,
  },
  metaTxt: { color: brand.textMuted, fontSize: 12, fontWeight: '700' },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  section: { color: brand.textMuted, fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: brand.primary,
    borderRadius: 100,
    paddingHorizontal: space.md,
    paddingVertical: 7,
  },
  addTxt: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },

  err: { color: brand.danger, fontSize: 12, fontWeight: '700', marginBottom: space.sm },

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
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontWeight: '900', fontSize: 15 },
  rowName: { color: brand.text, fontSize: 14, fontWeight: '800' },
  rowSub: { color: brand.textMuted, fontSize: 12, marginTop: 2 },
  rmBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(220,38,38,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  mTitle: { color: brand.text, fontSize: 18, fontWeight: '900' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    marginHorizontal: space.lg,
    paddingHorizontal: space.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
  },
  search: { flex: 1, paddingVertical: 12, fontSize: 14, color: brand.text },
  pickList: { padding: space.lg, gap: space.sm, flexGrow: 1 },

  busy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
