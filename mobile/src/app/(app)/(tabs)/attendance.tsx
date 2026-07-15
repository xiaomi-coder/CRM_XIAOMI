import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { db } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { AttendanceStatus, Group, Student, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const today = () => new Date().toISOString().split('T')[0];

/**
 * Davomat — o'qituvchining kundalik ekrani.
 * Guruh tanlanadi -> o'quvchilar ro'yxati -> bir bosishda belgilanadi.
 */
export default function AttendanceScreen() {
  const { t, user } = useAuth();
  const groups = useCenterData<Group>('groups');
  const students = useCenterData<Student>('students');

  const [groupId, setGroupId] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const myGroups = useMemo(() => {
    if (!user) return [];
    return user.role === UserRole.TEACHER
      ? groups.data.filter((g) => g.teacher === user.name)
      : groups.data;
  }, [groups.data, user]);

  const active = myGroups.find((g) => g.id === groupId) ?? myGroups[0];

  const rows = useMemo(() => {
    if (!active) return [];
    return students.data
      .filter((st) => active.studentIds?.includes(st.id))
      .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }, [students.data, active]);

  const mark = async (studentId: string, status: AttendanceStatus) => {
    if (!user || !active) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMarks((m) => ({ ...m, [studentId]: status }));
    setSaving(studentId);
    try {
      await db.insert('attendance', {
        id: `${active.id}-${studentId}-${today()}`,
        centerId: user.centerId,
        date: today(),
        studentId,
        groupId: active.id,
        status,
      });
    } catch {
      // Xato bo'lsa belgini qaytarish
      setMarks((m) => {
        const n = { ...m };
        delete n[studentId];
        return n;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(null);
    }
  };

  if (groups.loading || students.loading) return <Loading />;
  if (groups.error) return <ErrorBox message={groups.error} />;
  if (myGroups.length === 0) return <Empty text={t.no_data || "Guruh yo'q"} icon="layers-outline" />;

  return (
    <View style={s.root}>
      {/* Guruh tanlash */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {myGroups.map((g) => {
          const on = active?.id === g.id;
          return (
            <Pressable
              key={g.id}
              onPress={() => {
                Haptics.selectionAsync();
                setGroupId(g.id);
              }}
              style={[s.chip, on && s.chipOn]}
            >
              <Text style={[s.chipTxt, on && s.chipTxtOn]}>{g.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={s.date}>
        {t.attendance} · {today()}
      </Text>

      <FlatList
        data={rows}
        keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Empty text={t.no_data || "O'quvchi yo'q"} icon="people-outline" />}
        renderItem={({ item }) => {
          const st = marks[item.id];
          return (
            <View style={s.row}>
              <Text style={s.name} numberOfLines={1}>
                {item.name}
              </Text>

              {saving === item.id ? (
                <ActivityIndicator size="small" color={brand.primary} />
              ) : (
                <View style={s.actions}>
                  <Pressable
                    onPress={() => mark(item.id, AttendanceStatus.PRESENT)}
                    style={[s.btn, st === AttendanceStatus.PRESENT && s.btnPresent]}
                  >
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={st === AttendanceStatus.PRESENT ? '#fff' : brand.primary}
                    />
                  </Pressable>
                  <Pressable
                    onPress={() => mark(item.id, AttendanceStatus.ABSENT)}
                    style={[s.btn, st === AttendanceStatus.ABSENT && s.btnAbsent]}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={st === AttendanceStatus.ABSENT ? '#fff' : brand.danger}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },

  chips: { padding: space.lg, paddingBottom: space.sm, gap: space.sm },
  chip: {
    paddingHorizontal: space.lg,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
  },
  chipOn: { backgroundColor: brand.primary, borderColor: brand.primary },
  chipTxt: { color: brand.textMuted, fontSize: 12, fontWeight: '800' },
  chipTxtOn: { color: '#fff' },

  date: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
  },

  list: { padding: space.lg, paddingTop: 0, gap: space.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  name: { flex: 1, color: brand.text, fontSize: 14, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: space.sm },
  btn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.bg,
    borderWidth: 1,
    borderColor: brand.border,
  },
  btnPresent: { backgroundColor: brand.primary, borderColor: brand.primary },
  btnAbsent: { backgroundColor: brand.danger, borderColor: brand.danger },
});
