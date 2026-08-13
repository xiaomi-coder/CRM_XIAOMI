import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { db } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { sendTelegramMessage } from '@/lib/telegram';
import { brand, radius, space } from '@/lib/theme';
import { AttendanceStatus, Group, Student, SystemSettings, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const today = () => new Date().toISOString().split('T')[0];

/**
 * To'rtta holat — veb bilan AYNAN bir xil.
 * Avval mobilda faqat ikkitasi (keldi/kelmadi) bor edi.
 */
const STATUSES = [
  { key: AttendanceStatus.PRESENT,   icon: 'checkmark' as const,     color: brand.success, labelKey: 'status_present' },
  { key: AttendanceStatus.LATE,      icon: 'time-outline' as const,  color: brand.warning, labelKey: 'status_late' },
  { key: AttendanceStatus.ABSENT,    icon: 'close' as const,         color: brand.danger,  labelKey: 'status_absent' },
  { key: AttendanceStatus.DISMISSED, icon: 'home-outline' as const,  color: '#2563C7',     labelKey: 'status_dismissed' },
];

/**
 * Davomat — o'qituvchining kundalik ekrani.
 * Guruh tanlanadi -> o'quvchilar ro'yxati -> bir bosishda belgilanadi.
 */
export default function AttendanceScreen() {
  const { t, user } = useAuth();
  const groups = useCenterData<Group>('groups');
  const students = useCenterData<Student>('students');
  const settings = useCenterData<SystemSettings>('settings');

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

  /** Ota-onaga boradigan xabar — veb'dagi buildStatusMessage bilan bir xil */
  const buildMessage = (student: Student, status: AttendanceStatus) => {
    const icons: Record<string, string> = {
      [AttendanceStatus.PRESENT]: `✅ ${t.status_present}`,
      [AttendanceStatus.LATE]: `⏳ ${t.status_late}`,
      [AttendanceStatus.ABSENT]: `❌ ${t.status_absent}`,
      [AttendanceStatus.DISMISSED]: `🏠 ${t.status_dismissed || 'Dars tugadi'}`,
    };
    const d = today().split('-').reverse().join('.');
    const center = settings.data[0]?.centerName || 'EduControl CRM';
    return `🔔 <b>${t.notification_title}</b>\n\n👤 ${t.student}: <b>${student.name}</b>\n📅 ${t.date}: ${d}\n📊 ${t.status}: ${icons[status]}\n🏢 ${t.settings}: ${center}`;
  };

  const mark = async (student: Student, status: AttendanceStatus) => {
    if (!user || !active) return;
    const studentId = student.id;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMarks((m) => ({ ...m, [studentId]: status }));
    setSaving(studentId);
    try {
      await db.upsert('attendance', {
        id: `${today()}_${studentId}_${active.id}`,
        centerId: user.centerId,
        date: today(),
        studentId,
        groupId: active.id,
        status,
      });

      // Ota-onaga xabar — bot ulangan va o'quvchi bog'langan bo'lsagina
      const botToken = settings.data[0]?.botToken;
      if (botToken && student.tgChatId) {
        sendTelegramMessage(botToken, student.tgChatId, buildMessage(student, status));
      }
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
      {/* flexGrow:0 SHART — aks holda gorizontal ScrollView bo'sh joyni to'ldirib,
          chip butun ekran balandligiga cho'zilib ketadi */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipsWrap}
        contentContainerStyle={s.chips}
      >
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
                  {STATUSES.map((sv) => {
                    const on = st === sv.key;
                    return (
                      <Pressable
                        key={sv.key}
                        onPress={() => mark(item, sv.key)}
                        style={[s.btn, on && { backgroundColor: sv.color, borderColor: sv.color }]}
                      >
                        <Ionicons name={sv.icon} size={17} color={on ? '#fff' : sv.color} />
                      </Pressable>
                    );
                  })}
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

  chipsWrap: { flexGrow: 0, flexShrink: 0 },
  chips: { padding: space.lg, paddingBottom: space.sm, gap: space.sm, alignItems: 'center' },
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
  // 4 ta tugma + ism bitta qatorga sig'ishi kerak (tor telefonlarda ham):
  // 34*4 + 6*3 = 154px, qolgani ismga (u flex:1 va bir qatorga qisqaradi)
  actions: { flexDirection: 'row', gap: 6 },
  btn: {
    width: 34,
    height: 34,
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
