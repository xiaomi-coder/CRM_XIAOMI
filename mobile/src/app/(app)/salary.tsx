import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header';
import { Empty, ErrorBox, Loading } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';
import { brand, radius, space } from '@/lib/theme';
import { Group, Payment, User, UserRole } from '@/lib/types';
import { useCenterData } from '@/lib/use-center-data';

const money = (n: number) => new Intl.NumberFormat('uz-UZ').format(Math.round(n ?? 0));

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function SalaryScreen() {
  const { t, user } = useAuth();
  const users = useCenterData<User>('users');
  const groups = useCenterData<Group>('groups');
  const payments = useCenterData<Payment>('payments');

  const isDirector = user?.role === UserRole.DIRECTOR || user?.role === UserRole.SUPER_ADMIN;

  const teachers = useMemo(
    () => users.data.filter((u) => u.role === UserRole.TEACHER),
    [users.data]
  );

  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());

  /** O'qituvchi o'zini ko'radi; direktor birinchi o'qituvchidan boshlaydi */
  useEffect(() => {
    if (teacherId) return;
    if (!isDirector && user) setTeacherId(user.id);
    else if (teachers.length) setTeacherId(teachers[0].id);
  }, [isDirector, user, teachers, teacherId]);

  const monthName = (t as any)[MONTH_KEYS[monthIdx]] ?? MONTH_KEYS[monthIdx];

  /** Web SalaryCalculation.tsx bilan bir xil hisob */
  const calc = useMemo(() => {
    const teacher = users.data.find((u) => u.id === teacherId);
    if (!teacher) return null;

    const pct = teacher.salaryPercentage || 40;
    const ids = teacher.groupIds || [];
    const myGroups = groups.data.filter((g) => ids.includes(g.id) || g.teacher === teacher.name);

    let totalRevenue = 0;
    const details = myGroups.map((g) => {
      const set = new Set(g.studentIds ?? []);
      const rev = payments.data
        .filter(
          (p) =>
            set.has(p.studentId) &&
            (p.forMonth ?? '').toLowerCase() === String(monthName).toLowerCase()
        )
        .reduce((sum, p) => sum + (p.amount ?? 0), 0);
      totalRevenue += rev;
      return { name: g.name, subject: g.subject, revenue: rev, share: (rev * pct) / 100 };
    });

    return {
      teacherName: teacher.name,
      pct,
      groupsCount: myGroups.length,
      studentsCount: new Set(myGroups.flatMap((g) => g.studentIds ?? [])).size,
      totalRevenue,
      salary: (totalRevenue * pct) / 100,
      details,
    };
  }, [teacherId, monthName, users.data, groups.data, payments.data]);

  const loading = users.loading || groups.loading || payments.loading;
  const error = users.error || groups.error || payments.error;
  const reload = () => {
    users.reload();
    groups.reload();
    payments.reload();
  };

  if (loading) {
    return (
      <View style={s.root}>
        <AppHeader title={t.salary} />
        <Loading />
      </View>
    );
  }
  if (error) {
    return (
      <View style={s.root}>
        <AppHeader title={t.salary} />
        <ErrorBox message={error} />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <AppHeader title={t.salary} />

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={users.refreshing} onRefresh={reload} tintColor={brand.primary} />
        }
      >
        {/* Oy tanlash */}
        <Text style={s.section}>{t.month}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
          {MONTH_KEYS.map((mk, i) => {
            const active = i === monthIdx;
            return (
              <Pressable
                key={mk}
                onPress={() => setMonthIdx(i)}
                style={[s.chip, active && s.chipActive]}
              >
                <Text style={[s.chipTxt, active && s.chipTxtActive]}>{(t as any)[mk] ?? mk}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* O'qituvchi tanlash — faqat direktorga */}
        {isDirector && teachers.length > 0 && (
          <>
            <Text style={s.section}>{t.select_teacher || t.teacher}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
              {teachers.map((tc) => {
                const active = tc.id === teacherId;
                return (
                  <Pressable
                    key={tc.id}
                    onPress={() => setTeacherId(tc.id)}
                    style={[s.chip, active && s.chipActive]}
                  >
                    <Text style={[s.chipTxt, active && s.chipTxtActive]}>{tc.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {!calc ? (
          <Empty text={t.no_data || "Ma'lumot yo'q"} icon="cash-outline" />
        ) : (
          <>
            {/* Maosh kartasi */}
            <View style={s.hero}>
              <Text style={s.heroName}>{calc.teacherName}</Text>
              <Text style={s.heroLabel}>
                {monthName} · {calc.pct}%
              </Text>
              <Text style={s.heroValue}>{money(calc.salary)}</Text>
            </View>

            {/* Ko'rsatkichlar */}
            <View style={s.stats}>
              <View style={s.stat}>
                <Text style={s.statLabel}>{t.total_revenue}</Text>
                <Text style={s.statValue}>{money(calc.totalRevenue)}</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statLabel}>{t.groups}</Text>
                <Text style={s.statValue}>{calc.groupsCount}</Text>
              </View>
              <View style={s.stat}>
                <Text style={s.statLabel}>{t.students}</Text>
                <Text style={s.statValue}>{calc.studentsCount}</Text>
              </View>
            </View>

            {/* Guruhlar kesimi */}
            {calc.details.length > 0 && (
              <>
                <Text style={s.section}>{t.details}</Text>
                {calc.details.map((d, i) => (
                  <View key={i} style={s.row}>
                    <View style={s.rowIcon}>
                      <Ionicons name="layers-outline" size={18} color={brand.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName} numberOfLines={1}>
                        {d.name}
                      </Text>
                      <Text style={s.rowSub} numberOfLines={1}>
                        {d.subject} · {money(d.revenue)}
                      </Text>
                    </View>
                    <Text style={s.rowShare}>{money(d.share)}</Text>
                  </View>
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  scroll: { padding: space.lg, paddingBottom: space.xl, gap: space.sm },

  section: {
    color: brand.textMuted,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: space.md,
    marginBottom: space.xs,
  },

  chips: { gap: space.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: brand.card,
    borderWidth: 1,
    borderColor: brand.border,
  },
  chipActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  chipTxt: { fontSize: 11, fontWeight: '800', color: brand.textMuted },
  chipTxtActive: { color: '#fff' },

  hero: {
    backgroundColor: brand.primary,
    borderRadius: radius.xl,
    padding: space.xl,
    marginTop: space.md,
  },
  heroName: { color: '#fff', fontSize: 18, fontWeight: '900' },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: '900', marginTop: space.md },

  stats: { flexDirection: 'row', gap: space.sm, marginTop: space.sm },
  stat: {
    flex: 1,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.md,
  },
  statLabel: {
    color: brand.textMuted,
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  statValue: { color: brand.text, fontSize: 15, fontWeight: '900', marginTop: 4 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: brand.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: brand.border,
    padding: space.md,
    marginBottom: space.sm,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(5,150,105,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowName: { color: brand.text, fontSize: 13, fontWeight: '800' },
  rowSub: { color: brand.textMuted, fontSize: 11, marginTop: 2 },
  rowShare: { color: brand.primary, fontSize: 14, fontWeight: '900' },
});
