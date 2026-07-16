import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Expense, Group, Payment, Student, User, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n ?? 0));
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function DashboardScreen() {
  const { t, user } = useAuth();
  const router = useRouter();
  const students = useCenterData<Student>('students');
  const groups = useCenterData<Group>('groups');
  const payments = useCenterData<Payment>('payments');
  const expenses = useCenterData<Expense>('expenses');
  const users = useCenterData<User>('users');

  const isTeacher = user?.role === UserRole.TEACHER;
  const loading =
    students.loading || groups.loading || payments.loading || expenses.loading || users.loading;

  /** Joriy oy statistikasi (web Dashboard.tsx bilan bir xil mantiq) */
  const stats = useMemo(() => {
    const now = new Date();
    const inThisMonth = (dateStr?: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    };
    const monthName = String((t as any)[MONTHS[now.getMonth()]] ?? '').toLowerCase();

    const monthPayments = payments.data.filter((p) => inThisMonth(p.date));
    const revenue = monthPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const officeExpenses = expenses.data
      .filter((e) => inThisMonth(e.date))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // Maosh: har o'qituvchi guruhlarining shu oydagi tushumi × foizi
    let salaries = 0;
    users.data
      .filter((u) => u.role === UserRole.TEACHER)
      .forEach((teacher) => {
        const pct = teacher.salaryPercentage || 40;
        const ids = teacher.groupIds || [];
        const myGroups = groups.data.filter((g) => ids.includes(g.id) || g.teacher === teacher.name);
        const rev = myGroups.reduce((sum, g) => {
          const set = new Set(g.studentIds ?? []);
          return (
            sum +
            payments.data
              .filter((p) => set.has(p.studentId) && (p.forMonth ?? '').toLowerCase() === monthName)
              .reduce((a, p) => a + (Number(p.amount) || 0), 0)
          );
        }, 0);
        salaries += (rev * pct) / 100;
      });

    const debtors = students.data.filter((s) => (s.balance ?? 0) < 0).length;
    const profit = revenue - officeExpenses - salaries;
    return { revenue, officeExpenses, salaries, profit, debtors };
  }, [payments.data, expenses.data, users.data, groups.data, students.data, t]);

  const onRefresh = () => {
    students.reload();
    groups.reload();
    payments.reload();
    expenses.reload();
    users.reload();
  };

  return (
    <ScrollView
      style={{ backgroundColor: brand.bg }}
      contentContainerStyle={s.root}
      refreshControl={
        <RefreshControl refreshing={students.refreshing} onRefresh={onRefresh} tintColor={brand.primary} />
      }
    >
      {/* Salom + sof foyda (direktor/admin) */}
      <View style={s.hello}>
        <Text style={s.helloSub}>EduControl · {user?.name}</Text>
        {isTeacher ? (
          <Text style={s.helloName}>{t.dashboard}</Text>
        ) : (
          <>
            <Text style={s.profitLabel}>{t.net_profit}</Text>
            <Text style={[s.profitValue, stats.profit < 0 && { color: '#FCA5A5' }]}>
              {money(stats.profit)}
            </Text>
          </>
        )}
      </View>

      {/* Asosiy sonlar */}
      <View style={s.grid}>
        <Tile label={t.students} value={String(students.data.length)} icon="people-outline"
          onPress={() => router.navigate('/(app)/(tabs)/students')} />
        <Tile label={t.groups} value={String(groups.data.length)} icon="layers-outline"
          onPress={() => router.navigate('/(app)/(tabs)/groups')} />
      </View>

      {/* Moliya — o'qituvchiga ko'rsatilmaydi */}
      {!isTeacher && (
        <>
          <View style={s.grid}>
            <Tile label={t.revenue} value={money(stats.revenue)} icon="trending-up-outline"
              color={brand.primary} onPress={() => router.navigate('/(app)/payments')} />
            <Tile label={t.debtors || 'Qarzdorlar'} value={String(stats.debtors)} icon="alert-circle-outline"
              color={stats.debtors > 0 ? brand.danger : brand.text}
              onPress={() => router.navigate('/(app)/(tabs)/students')} />
          </View>
          <View style={s.grid}>
            <Tile label={t.expenses_label} value={money(stats.officeExpenses)} icon="receipt-outline"
              color={brand.danger} onPress={() => router.navigate('/(app)/expenses')} />
            <Tile label={t.salaries} value={money(stats.salaries)} icon="cash-outline"
              onPress={() => router.navigate('/(app)/salary')} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

/** Bosiladigan statistika kartasi */
function Tile({
  label,
  value,
  icon,
  color,
  onPress,
}: {
  label: string;
  value: string;
  icon: string;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [s.tile, pressed && s.tilePressed]} onPress={onPress}>
      <View style={s.tileIcon}>
        <Ionicons name={icon as any} size={18} color={brand.primary} />
      </View>
      <Text style={s.tileLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[s.tileValue, color ? { color } : null]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { padding: space.lg, gap: space.md },
  hello: { backgroundColor: brand.primary, borderRadius: radius.xl, padding: space.xl },
  helloSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  helloName: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 6 },
  profitLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
  },
  profitValue: { color: '#fff', fontSize: 30, fontWeight: '900', marginTop: 2 },

  grid: { flexDirection: 'row', gap: space.md },
  tile: {
    flex: 1,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.lg,
  },
  tilePressed: { opacity: 0.6 },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(5,150,105,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  tileLabel: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tileValue: { color: brand.text, fontSize: 20, fontWeight: '900', marginTop: 2 },
});
