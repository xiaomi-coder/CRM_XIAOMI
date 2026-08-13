import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const [sending, setSending] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

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

      // ⚠️ Belgilashning O'ZI xabar yubormaydi — veb ham shunday.
      // Aks holda har bosishda ota-onaga xabar ketib, spam bo'lardi.
      // FAQAT "uyga ketdi" avtomatik ketadi (bola yo'lga chiqqani muhim xabar).
      if (status === AttendanceStatus.DISMISSED) {
        const botToken = settings.data[0]?.botToken;
        if (botToken && student.tgChatId) {
          const d = today().split('-').reverse().join('.');
          const center = settings.data[0]?.centerName || 'EduControl CRM';
          const msg =
            `🏠 <b>${t.dismissed_title || 'Dars tugadi'}</b>\n\n` +
            `👤 ${t.student}: <b>${student.name}</b>\n` +
            `📅 ${t.date}: ${d}\n\n` +
            `✅ ${t.dismissed_message || "Farzandingiz darsi tugadi va u uyiga jo'nadi."}\n\n` +
            `<i>${center}</i>`;
          sendTelegramMessage(botToken, student.tgChatId, msg);
        }
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

  /** Bitta o'quvchiga hozirgi holati haqida xabar (veb'dagi tugma kabi) */
  const sendOne = async (student: Student) => {
    const status = marks[student.id];
    if (!status) return;
    const botToken = settings.data[0]?.botToken;
    if (!botToken) return Alert.alert(t.bot_not_configured || 'Bot sozlanmagan');
    if (!student.tgChatId) return Alert.alert(t.parent_not_linked || "Ota-ona ulanmagan");

    setSending(student.id);
    const ok = await sendTelegramMessage(botToken, student.tgChatId, buildMessage(student, status));
    setSending(null);
    Haptics.notificationAsync(
      ok ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
    if (!ok) Alert.alert(t.message_failed || 'Xabar yuborilmadi');
  };

  /** Belgilangan hammaga o'z holati bo'yicha xabar — holatlarga TEGMAYDI */
  const sendAll = async () => {
    const botToken = settings.data[0]?.botToken;
    if (!botToken) return Alert.alert(t.bot_not_configured || 'Bot sozlanmagan');

    const eligible = rows.filter((r) => marks[r.id] && r.tgChatId);
    const skipped = rows.filter((r) => marks[r.id] && !r.tgChatId).length;
    if (eligible.length === 0) return Alert.alert(t.no_data || "Yuborish uchun hech kim yo'q");

    setSendingAll(true);
    let sent = 0;
    for (const st of eligible) {
      const ok = await sendTelegramMessage(botToken, st.tgChatId!, buildMessage(st, marks[st.id]));
      if (ok) sent++;
    }
    setSendingAll(false);
    Alert.alert(`${sent} / ${skipped} ${t.sent_skipped || "yuborildi / o'tkazib yuborildi"}`);
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

      <View style={s.bar}>
        <Text style={s.date}>
          {t.attendance} · {today()}
        </Text>
        <Pressable
          onPress={sendAll}
          disabled={sendingAll}
          style={[s.sendAll, sendingAll && { opacity: 0.5 }]}
        >
          {sendingAll ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="paper-plane-outline" size={14} color="#fff" />
              <Text style={s.sendAllTxt}>{t.send_all_message || 'Barchasiga xabar'}</Text>
            </>
          )}
        </Pressable>
      </View>

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
                        <Ionicons name={sv.icon} size={16} color={on ? '#fff' : sv.color} />
                      </Pressable>
                    );
                  })}
                  {/* Xabar yuborish — faqat belgilangan o'quvchida ko'rinadi */}
                  {st &&
                    (sending === item.id ? (
                      <View style={s.btn}>
                        <ActivityIndicator size="small" color={brand.primary} />
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => sendOne(item)}
                        style={[s.btn, !item.tgChatId && { opacity: 0.35 }]}
                      >
                        <Ionicons name="paper-plane-outline" size={15} color={brand.primary} />
                      </Pressable>
                    ))}
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

  // paddingHorizontal olib tashlandi — endi u `bar` konteynerida turibdi
  date: {
    flex: 1,
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
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
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  sendAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: brand.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.md,
  },
  sendAllTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },

  // Qatorda 4 ta holat + 1 ta yuborish tugmasi bo'lishi mumkin:
  // 32*5 + 5*4 = 180px, qolgani ismga (flex:1, bir qatorga qisqaradi)
  actions: { flexDirection: 'row', gap: 5 },
  btn: {
    width: 32,
    height: 32,
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
