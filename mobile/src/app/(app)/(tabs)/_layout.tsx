import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { AppHeader } from '@/components/app-header';
import { useAuth } from '@/lib/auth-context';
import { hasPermission } from '@/lib/nav';
import { brand } from '@/lib/theme';
import { UserRole } from '@/lib/types';

export default function TabsLayout() {
  const { user, t } = useAuth();
  if (!user) return null;

  const isTeacher = user.role === UserRole.TEACHER;
  const isSuper = user.role === UserRole.SUPER_ADMIN;

  /** O'qituvchida dashboard yo'q; super admin uchun ham boshqacha */
  const show = (key: string) => (key === 'dashboard' ? !isTeacher : hasPermission(user, key));

  const tab = (name: string, labelKey: string, icon: string, permKey: string) => (
    <Tabs.Screen
      name={name}
      options={{
        title: (t as any)[labelKey] ?? labelKey,
        header: () => <AppHeader title={(t as any)[labelKey] ?? labelKey} />,
        tabBarIcon: ({ color, focused }) => (
          <Ionicons name={(focused ? icon.replace('-outline', '') : icon) as any} size={22} color={color} />
        ),
        href: show(permKey) ? undefined : null,
      }}
    />
  );

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: brand.primaryLight,
        tabBarInactiveTintColor: brand.textMutedOnDark,
        tabBarStyle: {
          backgroundColor: brand.surface,
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarLabelStyle: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
        sceneStyle: { backgroundColor: brand.bg },
      }}
    >
      {tab('index', 'dashboard', 'grid-outline', 'dashboard')}
      {tab('attendance', 'attendance', 'calendar-outline', 'attendance')}
      {tab('students', 'students', 'people-outline', 'students')}
      {tab('groups', 'groups', 'layers-outline', 'groups')}
    </Tabs>
  );
}
