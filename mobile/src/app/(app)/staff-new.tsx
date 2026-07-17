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

import { db, newId } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { UserRole } from '@/lib/types';

export default function NewStaffScreen() {
  const { t, user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.TEACHER);
  const [percentage, setPercentage] = useState('40');
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isTeacher = role === UserRole.TEACHER;
  const canSave =
    name.trim().length > 0 && username.trim().length > 0 && password.length > 0 && !saving;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setErr(null);
    try {
      const staff: any = {
        id: newId(),
        centerId: user?.centerId,
        name: name.trim(),
        username: username.trim(),
        password,
        role,
      };
      if (isTeacher) staff.salaryPercentage = Number(percentage) || 40;
      await db.insert('users', staff);
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
        <Text style={s.headerTitle}>{t.add_staff}</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        {/* Rol */}
        <Text style={s.label}>{t.role}</Text>
        <View style={s.roleRow}>
          {[UserRole.TEACHER, UserRole.ADMIN].map((r) => {
            const active = role === r;
            return (
              <Pressable key={r} onPress={() => setRole(r)} style={[s.roleBtn, active && s.roleBtnActive]}>
                <Ionicons
                  name={r === UserRole.TEACHER ? 'school-outline' : 'shield-outline'}
                  size={18}
                  color={active ? '#fff' : brand.textMuted}
                />
                <Text style={[s.roleTxt, active && s.roleTxtActive]}>
                  {r === UserRole.TEACHER ? t.role_teacher : t.role_admin}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.label}>{t.full_name}</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          placeholder={t.full_name}
          placeholderTextColor={brand.textMuted}
          autoFocus
        />

        <Text style={s.label}>{t.username}</Text>
        <TextInput
          style={s.input}
          value={username}
          onChangeText={setUsername}
          placeholder={t.login}
          placeholderTextColor={brand.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={s.label}>{t.password}</Text>
        <View style={s.passWrap}>
          <TextInput
            style={s.passInput}
            value={password}
            onChangeText={setPassword}
            placeholder="••••"
            placeholderTextColor={brand.textMuted}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
          <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={10}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={brand.textMuted} />
          </Pressable>
        </View>

        {/* Maosh foizi — faqat o'qituvchi */}
        {isTeacher && (
          <>
            <Text style={s.label}>{t.standard_percentage} (%)</Text>
            <TextInput
              style={s.input}
              value={percentage}
              onChangeText={(v) => setPercentage(v.replace(/\D/g, '').slice(0, 3))}
              placeholder="40"
              placeholderTextColor={brand.textMuted}
              keyboardType="number-pad"
            />
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

  form: { padding: space.lg, gap: space.sm },
  label: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
    marginBottom: space.xs,
  },
  input: {
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: brand.text,
  },
  passWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: space.lg,
  },
  passInput: { flex: 1, paddingVertical: 14, fontSize: 15, fontWeight: '600', color: brand.text },

  roleRow: { flexDirection: 'row', gap: space.sm },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
  },
  roleBtnActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  roleTxt: { fontSize: 13, fontWeight: '800', color: brand.textMuted },
  roleTxtActive: { color: '#fff' },

  err: { color: brand.danger, fontSize: 12, fontWeight: '700', marginTop: space.sm },

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
  saveTxt: { color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
});
