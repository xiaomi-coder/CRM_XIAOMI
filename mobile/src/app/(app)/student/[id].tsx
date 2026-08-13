import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Attendance, AttendanceStatus, Student, SystemSettings } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(n ?? 0);

const ATT: Record<string, { key: string; color: string; bg: string }> = {
  [AttendanceStatus.PRESENT]: { key: 'status_present', color: brand.primary, bg: 'rgba(5,150,105,0.1)' },
  [AttendanceStatus.LATE]: { key: 'status_late', color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
  [AttendanceStatus.ABSENT]: { key: 'status_absent', color: brand.danger, bg: 'rgba(220,38,38,0.1)' },
  [AttendanceStatus.DISMISSED]: { key: 'dropped', color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const students = useCenterData<Student>('students');
  const attendance = useCenterData<Attendance>('attendance');
  const settings = useCenterData<SystemSettings>('settings');

  const student = useMemo(() => students.data.find((s) => s.id === id), [students.data, id]);

  const myAttendance = useMemo(
    () =>
      attendance.data
        .filter((a) => a.studentId === id)
        .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [attendance.data, id]
  );

  const attStats = useMemo(() => {
    let present = 0,
      absent = 0,
      late = 0;
    myAttendance.forEach((a) => {
      if (a.status === AttendanceStatus.PRESENT) present++;
      else if (a.status === AttendanceStatus.ABSENT) absent++;
      else if (a.status === AttendanceStatus.LATE) late++;
    });
    return { present, absent, late, total: myAttendance.length };
  }, [myAttendance]);

  const loading = students.loading || attendance.loading;
  const call = (phone?: string) => phone && Linking.openURL(`tel:${phone}`);

  // Ota-onaga beriladigan havola — bot username Sozlamalarda saqlanadi
  const botUsername = settings.data[0]?.botUsername;
  const connectLink =
    botUsername && student?.tgConnectionCode
      ? `https://t.me/${botUsername}?start=${student.tgConnectionCode}`
      : '';

  const shareLink = async () => {
    if (!connectLink || !student) return;
    const center = settings.data[0]?.centerName || 'EduControl';
    try {
      await Share.share({
        message:
          `${center}\n\n${student.name} — ` +
          `${t.telegram_connect_hint || "farzandingiz davomati va to'lovlari haqida xabar olish uchun havolani bosing va Start tugmasini bosing"}:\n\n` +
          connectLink,
      });
    } catch (e: any) {
      Alert.alert(String(e?.message ?? e));
    }
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          {student?.name ?? t.student_name}
        </Text>
        <View style={{ width: 30 }} />
      </View>

      {loading ? (
        <Loading />
      ) : !student ? (
        <ErrorBox message={t.search_empty || "O'quvchi topilmadi"} />
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>
          {/* Profil kartasi */}
          <View style={s.profile}>
            <View style={s.avatar}>
              <Text style={s.avatarTxt}>{student.name?.charAt(0) ?? '?'}</Text>
            </View>
            <Text style={s.name}>{student.name}</Text>
            {!!student.lastGroup && <Text style={s.group}>{student.lastGroup}</Text>}
            <View style={[s.balanceBox, (student.balance ?? 0) < 0 ? s.balNeg : s.balPos]}>
              <Text style={[s.balTxt, (student.balance ?? 0) < 0 ? s.balTxtNeg : s.balTxtPos]}>
                {t.balance}: {money(student.balance)}
              </Text>
            </View>
          </View>

          {/* Aloqa */}
          <Text style={s.section}>{t.details}</Text>
          <View style={s.card}>
            <Pressable style={s.row} onPress={() => call(student.phone)}>
              <Ionicons name="call-outline" size={18} color={brand.primary} style={s.rowIcon} />
              <Text style={s.rowLabel}>{student.name}</Text>
              <Text style={[s.rowValue, { color: brand.primary }]}>{student.phone || '—'}</Text>
            </Pressable>
            <Pressable style={s.row} onPress={() => call(student.parentPhone)}>
              <Ionicons name="people-outline" size={18} color={brand.primary} style={s.rowIcon} />
              <Text style={s.rowLabel}>{student.parentName || t.parent}</Text>
              <Text style={[s.rowValue, { color: brand.primary }]}>{student.parentPhone || '—'}</Text>
            </Pressable>
            <View style={[s.row, s.rowLast]}>
              <Ionicons name="calendar-outline" size={18} color={brand.textMuted} style={s.rowIcon} />
              <Text style={s.rowLabel}>{t.joined}</Text>
              <Text style={s.rowValue}>{student.joinedDate || '—'}</Text>
            </View>
          </View>

          {/* Telegram — ota-onani ulash.
              Telefonda bu eng qulay: havola WhatsApp/Telegram orqali
              to'g'ridan-to'g'ri ota-onaga yuboriladi (kompyuterda esa
              nusxalab, keyin qayerdadir yuborish kerak edi). */}
          <Text style={s.section}>Telegram</Text>
          <View style={s.card}>
            {student.tgChatId ? (
              <View style={[s.row, s.rowLast]}>
                <Ionicons name="checkmark-circle" size={18} color={brand.success} style={s.rowIcon} />
                <Text style={s.rowLabel}>{t.parent}</Text>
                <Text style={[s.rowValue, { color: brand.success }]}>{t.connected || 'Ulangan'}</Text>
              </View>
            ) : connectLink ? (
              <Pressable style={[s.row, s.rowLast]} onPress={shareLink}>
                <Ionicons name="share-social-outline" size={18} color={brand.primary} style={s.rowIcon} />
                <Text style={s.rowLabel}>{t.copy_connect_link || 'Ulanish havolasi'}</Text>
                <Ionicons name="chevron-forward" size={16} color={brand.textMuted} />
              </Pressable>
            ) : (
              <View style={[s.row, s.rowLast]}>
                <Ionicons name="alert-circle-outline" size={18} color={brand.warning} style={s.rowIcon} />
                <Text style={[s.rowLabel, { flex: 1 }]}>
                  {t.bot_not_connected_hint || "Avval Sozlamalarda botni ulang"}
                </Text>
              </View>
            )}
          </View>

          {/* Davomat statistikasi */}
          <Text style={s.section}>{t.attendance}</Text>
          <View style={s.attGrid}>
            <View style={s.attStat}>
              <Text style={[s.attNum, { color: brand.primary }]}>{attStats.present}</Text>
              <Text style={s.attLabel}>{t.status_present}</Text>
            </View>
            <View style={s.attStat}>
              <Text style={[s.attNum, { color: '#D97706' }]}>{attStats.late}</Text>
              <Text style={s.attLabel}>{t.status_late}</Text>
            </View>
            <View style={s.attStat}>
              <Text style={[s.attNum, { color: brand.danger }]}>{attStats.absent}</Text>
              <Text style={s.attLabel}>{t.status_absent}</Text>
            </View>
          </View>

          {/* Davomat tarixi */}
          {myAttendance.length === 0 ? (
            <Empty text={t.no_data || "Ma'lumot yo'q"} icon="calendar-outline" />
          ) : (
            <View style={[s.card, { marginTop: space.sm }]}>
              {myAttendance.slice(0, 30).map((a, i, arr) => {
                const cfg = ATT[a.status] ?? ATT[AttendanceStatus.PRESENT];
                return (
                  <View key={a.id} style={[s.row, i === arr.length - 1 && s.rowLast]}>
                    <Ionicons name="ellipse" size={10} color={cfg.color} style={s.rowIcon} />
                    <Text style={s.rowLabel}>{a.date}</Text>
                    <View style={[s.attBadge, { backgroundColor: cfg.bg }]}>
                      <Text style={[s.attBadgeTxt, { color: cfg.color }]}>
                        {(t as any)[cfg.key] ?? a.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
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

  profile: { alignItems: 'center', paddingVertical: space.lg },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: '#fff', fontSize: 34, fontWeight: '900' },
  name: { color: brand.text, fontSize: 20, fontWeight: '900', marginTop: space.md },
  group: { color: brand.textMuted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  balanceBox: { marginTop: space.md, paddingHorizontal: space.lg, paddingVertical: 8, borderRadius: 100 },
  balPos: { backgroundColor: 'rgba(5,150,105,0.1)' },
  balNeg: { backgroundColor: 'rgba(220,38,38,0.1)' },
  balTxt: { fontSize: 13, fontWeight: '900' },
  balTxtPos: { color: brand.primary },
  balTxtNeg: { color: brand.danger },

  section: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.lg,
    marginBottom: space.sm,
  },

  card: {
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brand.border,
    gap: space.md,
  },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 20, textAlign: 'center' },
  rowLabel: { flex: 1, color: brand.text, fontSize: 13, fontWeight: '700' },
  rowValue: { color: brand.textMuted, fontSize: 13, fontWeight: '800' },

  attGrid: { flexDirection: 'row', gap: space.sm },
  attStat: {
    flex: 1,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  attNum: { fontSize: 24, fontWeight: '900' },
  attLabel: {
    color: brand.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 4,
  },

  attBadge: { paddingHorizontal: space.md, paddingVertical: 4, borderRadius: 100 },
  attBadgeTxt: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
});
