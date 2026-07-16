import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { Language } from '@/lib/i18n';
import { brand, radius, space } from '@/lib/theme';
import { useCenterData } from '@/lib/use-center-data';

/**
 * Markaz sozlamalari — ko'rish uchun (v1).
 * DIQQAT: botToken / geminiApiKey maxfiy — hech qachon ko'rsatilmaydi,
 * faqat "ulangan / ulanmagan" holati.
 */
type CenterSettings = {
  centerId: string;
  centerName?: string;
  address?: string;
  phone?: string;
  botToken?: string | null;
  geminiApiKey?: string | null;
  notifyAttendance?: boolean;
  notifyPayment?: boolean;
  standardTeacherPercentage?: number;
  licenseExpiry?: string | null;
  isBlocked?: boolean;
};

function Row({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <View style={s.row}>
      <View style={s.rowIcon}>
        <Ionicons name={icon as any} size={17} color={brand.textMuted} />
      </View>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, color ? { color } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export default function SettingsScreen() {
  const { t, lang, setLang, signOut, user } = useAuth();
  const { data, loading, refreshing, error, reload } = useCenterData<CenterSettings>('settings');

  const cfg = data[0];
  const on = (b?: boolean) => (b ? t.active : t.deleted || "O'chirilgan");

  return (
    <View style={s.root}>
      <AppHeader title={t.system_settings} />

      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorBox message={error} />
      ) : (
        <ScrollView
          contentContainerStyle={s.scroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={brand.primary} />
          }
        >
          {/* Markaz kartasi */}
          <View style={s.hero}>
            <Text style={s.heroLabel}>{t.center_name}</Text>
            <Text style={s.heroName}>{cfg?.centerName ?? '—'}</Text>
            <Text style={s.heroSub}>{cfg?.centerId ?? ''}</Text>
          </View>

          {/* Markaz ma'lumotlari */}
          <Text style={s.section}>{t.main}</Text>
          <View style={s.card}>
            <Row icon="location-outline" label={t.address || 'Manzil'} value={cfg?.address || '—'} />
            <Row icon="call-outline" label={t.phone} value={cfg?.phone || '—'} />
            <Row
              icon="pie-chart-outline"
              label={t.standard_percentage}
              value={cfg?.standardTeacherPercentage != null ? `${cfg.standardTeacherPercentage}%` : '—'}
            />
            <Row
              icon="shield-checkmark-outline"
              label={t.status}
              value={cfg?.isBlocked ? t.blocked : t.active}
              color={cfg?.isBlocked ? brand.danger : brand.primary}
            />
          </View>

          {/* Integratsiyalar — token KO'RSATILMAYDI */}
          <Text style={s.section}>Telegram</Text>
          <View style={s.card}>
            <Row
              icon="paper-plane-outline"
              label="Bot"
              value={cfg?.botToken ? t.active : t.not_assigned}
              color={cfg?.botToken ? brand.primary : brand.textMuted}
            />
            <Row
              icon="notifications-outline"
              label={t.attendance}
              value={on(cfg?.notifyAttendance)}
              color={cfg?.notifyAttendance ? brand.primary : brand.textMuted}
            />
            <Row
              icon="wallet-outline"
              label={t.payments}
              value={on(cfg?.notifyPayment)}
              color={cfg?.notifyPayment ? brand.primary : brand.textMuted}
            />
          </View>

          {/* Til */}
          <Text style={s.section}>{t.select || 'Til'}</Text>
          <View style={s.langRow}>
            {(['uz', 'ru', 'en'] as Language[]).map((l) => {
              const active = lang === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setLang(l)}
                  style={[s.langBtn, active && s.langBtnActive]}
                >
                  <Text style={[s.langTxt, active && s.langTxtActive]}>{l.toUpperCase()}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Foydalanuvchi + chiqish */}
          <Text style={s.section}>{t.login_data}</Text>
          <View style={s.card}>
            <Row icon="person-outline" label={t.full_name} value={user?.name ?? '—'} />
            <Row icon="at-outline" label={t.username} value={user?.username ?? '—'} />
          </View>

          <Pressable onPress={signOut} style={s.logout}>
            <Ionicons name="log-out-outline" size={18} color={brand.danger} />
            <Text style={s.logoutTxt}>{t.logout}</Text>
          </Pressable>

          <Text style={s.version}>EduControl v2.0 • Online CRM</Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  scroll: { padding: space.lg, paddingBottom: space.xl },

  hero: { backgroundColor: brand.primary, borderRadius: radius.xl, padding: space.xl },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroName: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  heroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700', marginTop: 2 },

  section: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.xl,
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
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brand.border,
  },
  rowIcon: { width: 22, alignItems: 'center' },
  rowLabel: { flex: 1, color: brand.text, fontSize: 13, fontWeight: '700' },
  rowValue: { color: brand.textMuted, fontSize: 13, fontWeight: '800', maxWidth: '45%' },

  langRow: { flexDirection: 'row', gap: space.sm },
  langBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.lg,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  langTxt: { fontSize: 12, fontWeight: '900', color: brand.textMuted },
  langTxtActive: { color: '#fff' },

  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    marginTop: space.xl,
    paddingVertical: 15,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(220,38,38,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
  },
  logoutTxt: {
    color: brand.danger,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  version: {
    color: brand.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: space.xl,
    textTransform: 'uppercase',
  },
});
