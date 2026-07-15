import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StatCard } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Group, Payment, Student } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const fmt = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1000)}K`;
  return String(n ?? 0);
};

export default function DashboardScreen() {
  const { t, user } = useAuth();
  const students = useCenterData<Student>('students');
  const groups = useCenterData<Group>('groups');
  const payments = useCenterData<Payment>('payments');

  const loading = students.loading || groups.loading || payments.loading;

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = payments.data.filter((p: any) => {
      const d = new Date(p.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = thisMonth.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);
    const debtors = students.data.filter((s) => (s.balance ?? 0) < 0).length;
    return { income, debtors };
  }, [payments.data, students.data]);

  const onRefresh = () => {
    students.reload();
    groups.reload();
    payments.reload();
  };

  return (
    <ScrollView
      style={{ backgroundColor: brand.bg }}
      contentContainerStyle={s.root}
      refreshControl={
        <RefreshControl refreshing={!loading && students.refreshing} onRefresh={onRefresh} tintColor={brand.primary} />
      }
    >
      <View style={s.hello}>
        <Text style={s.helloSub}>EduControl</Text>
        <Text style={s.helloName}>{user?.name}</Text>
      </View>

      <View style={s.grid}>
        <StatCard label={t.students} value={String(students.data.length)} icon="people-outline" />
        <StatCard label={t.groups} value={String(groups.data.length)} icon="layers-outline" />
      </View>

      <View style={s.grid}>
        <StatCard label={t.payments} value={fmt(stats.income)} icon="wallet-outline" />
        <StatCard label={t.debtors || 'Qarzdorlar'} value={String(stats.debtors)} icon="alert-circle-outline" />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { padding: space.lg, gap: space.md },
  hello: {
    backgroundColor: brand.primary,
    borderRadius: radius.lg,
    padding: space.xl,
    marginBottom: space.xs,
  },
  helloSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  helloName: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 4 },
  grid: { flexDirection: 'row', gap: space.md },
});
