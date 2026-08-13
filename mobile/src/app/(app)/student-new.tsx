import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Loading } from '@/components/ui';
import { db, newId } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Group, StudentStatus } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

/**
 * Yangi o'quvchi qo'shish.
 *
 * Avval mobilda BU EKRAN YO'Q edi — ya'ni telefondan markazni boshlab
 * bo'lmasdi (o'quvchi ham, guruh ham qo'shilmasdi).
 *
 * Yozilayotgan maydonlar veb'dagi (AuthenticatedApp `case 'students'`) bilan
 * bir xil: `tgConnectionCode` bo'sh yuboriladi — bazadagi trigger uni
 * 12 belgili tasodifiy kod bilan o'zi to'ldiradi.
 */
export default function NewStudentScreen() {
  const { t, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const groups = useCenterData<Group>('groups');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [groupId, setGroupId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSave = name.trim().length > 1 && phone.trim().length > 0 && !saving;

  const save = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    setErr(null);
    try {
      const id = newId();
      await db.insert('students', {
        id,
        centerId: user.centerId,
        name: name.trim(),
        phone: phone.trim(),
        parentName: parentName.trim(),
        parentPhone: parentPhone.trim(),
        balance: 0,
        coins: 0,
        joinedDate: new Date().toISOString().split('T')[0],
        tgEnabled: false,
        tgConnectionCode: '', // trigger to'ldiradi
        status: StudentStatus.ACTIVE,
      });

      // Guruh tanlangan bo'lsa — darrov biriktiramiz
      if (groupId) {
        const g = groups.data.find((x) => x.id === groupId);
        if (g) {
          await db.update('groups', groupId, { studentIds: [...(g.studentIds ?? []), id] });
        }
      }
      router.back();
    } catch (e: any) {
      setErr(e?.message ?? String(e));
      setSaving(false);
    }
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[s.header, { paddingTop: insets.top + space.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.back}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>{t.add_student}</Text>
        <View style={{ width: 30 }} />
      </View>

      {groups.loading ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
          <Text style={s.label}>{t.student_name}</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder={t.student_name}
            placeholderTextColor={brand.textMuted}
            autoFocus
          />

          <Text style={s.label}>{t.phone}</Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+998 90 123 45 67"
            placeholderTextColor={brand.textMuted}
            keyboardType="phone-pad"
          />

          <Text style={s.label}>{t.parent}</Text>
          <TextInput
            style={s.input}
            value={parentName}
            onChangeText={setParentName}
            placeholder={t.full_name}
            placeholderTextColor={brand.textMuted}
          />

          <Text style={s.label}>{t.parent} · {t.phone}</Text>
          <TextInput
            style={s.input}
            value={parentPhone}
            onChangeText={setParentPhone}
            placeholder="+998 90 123 45 67"
            placeholderTextColor={brand.textMuted}
            keyboardType="phone-pad"
          />

          {groups.data.length > 0 && (
            <>
              <Text style={s.label}>{t.groups}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsWrap} contentContainerStyle={s.chips}>
                {groups.data.map((g) => {
                  const on = groupId === g.id;
                  return (
                    <Pressable
                      key={g.id}
                      onPress={() => setGroupId(on ? null : g.id)}
                      style={[s.chip, on && s.chipOn]}
                    >
                      <Text style={[s.chipTxt, on && s.chipTxtOn]}>{g.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          {err && <Text style={s.err}>{err}</Text>}

          <Pressable onPress={save} disabled={!canSave} style={[s.save, !canSave && s.saveOff]}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={s.saveTxt}>{t.save}</Text>
              </>
            )}
          </Pressable>
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
    justifyContent: 'space-between',
    backgroundColor: brand.surface,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
  },
  back: { width: 30 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  form: { padding: space.lg, paddingBottom: space.xl * 2 },
  label: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.lg,
    marginBottom: 6,
  },
  input: {
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: radius.lg,
    paddingHorizontal: space.lg,
    paddingVertical: 13,
    color: brand.text,
    fontSize: 15,
    fontWeight: '600',
  },

  chipsWrap: { flexGrow: 0, flexShrink: 0 },
  chips: { gap: space.sm, alignItems: 'center', paddingVertical: 2 },
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

  err: { color: brand.danger, fontSize: 13, fontWeight: '700', marginTop: space.lg },

  save: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    backgroundColor: brand.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginTop: space.xl,
  },
  saveOff: { opacity: 0.4 },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
