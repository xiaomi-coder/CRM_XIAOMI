import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { brand, radius, space } from '@/lib/theme';

export function Loading() {
  return (
    <View style={s.center}>
      <ActivityIndicator size="large" color={brand.primary} />
    </View>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={s.center}>
      <Ionicons name="cloud-offline-outline" size={40} color={brand.danger} />
      <Text style={s.errTxt}>{message}</Text>
    </View>
  );
}

export function Empty({ text, icon = 'file-tray-outline' }: { text: string; icon?: string }) {
  return (
    <View style={s.center}>
      <Ionicons name={icon as any} size={40} color={brand.textMuted} />
      <Text style={s.emptyTxt}>{text}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[s.card, style]}>{children}</View>;
}

/** Dashboard raqam kartasi */
export function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={s.stat}>
      <View style={s.statIcon}>
        <Ionicons name={icon as any} size={18} color={brand.primary} />
      </View>
      <Text style={s.statLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={s.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export const s = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.md },
  errTxt: { color: brand.danger, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  emptyTxt: { color: brand.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  card: {
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
  },

  stat: {
    flex: 1,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: brand.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  statLabel: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: { color: brand.primary, fontSize: 22, fontWeight: '900', marginTop: 2 },
});
