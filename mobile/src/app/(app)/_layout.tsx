import { Ionicons } from '@expo/vector-icons';
// SDK 56+ da @react-navigation/* dan import qilish mumkin emas —
// expo-router react-navigation'ni o'z ichiga "vendor" qilgan.
import { Drawer, DrawerContentScrollView } from 'expo-router/drawer';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';
import { getDrawerItems } from '@/lib/nav';
import { brand, radius, space } from '@/lib/theme';
import { UserRole } from '@/lib/types';

function roleLabel(role: UserRole, t: any) {
  if (role === UserRole.SUPER_ADMIN) return t.role_creator || 'Creator';
  if (role === UserRole.DIRECTOR) return t.role_director || 'Director';
  if (role === UserRole.ADMIN) return t.role_admin || 'Admin';
  return t.role_teacher || 'Teacher';
}

/** Gamburger menyu ichi — sayt sidebar'ining mobil nusxasi */
function DrawerContent(props: any) {
  const { user, t, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  if (!user) return null;

  const items = getDrawerItems(user);
  const current = props.state?.routes?.[props.state.index]?.name;

  const go = (href: string) => {
    Haptics.selectionAsync();
    props.navigation.closeDrawer();
    router.push(href as any);
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Brend */}
      <View style={s.head}>
        <View style={s.logo}>
          <Text style={s.logoTxt}>E</Text>
        </View>
        <View>
          <Text style={s.brand}>EDUCONTROL</Text>
          <Text style={s.brandSub}>{t.professional_crm || 'Professional CRM'}</Text>
        </View>
      </View>

      {/* Foydalanuvchi */}
      <View style={s.userBox}>
        <View style={s.avatar}>
          <Text style={s.avatarTxt}>{user.name?.charAt(0) ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.userName} numberOfLines={1}>
            {user.name}
          </Text>
          <Text style={s.userRole}>{roleLabel(user.role, t)}</Text>
        </View>
      </View>

      {/* Menyu */}
      <DrawerContentScrollView {...props} contentContainerStyle={s.list}>
        {items.map((it) => {
          const active = current && it.href.endsWith(current);
          return (
            <Pressable
              key={it.href}
              onPress={() => go(it.href)}
              style={({ pressed }) => [s.item, active && s.itemActive, pressed && s.itemPressed]}
            >
              <Ionicons
                name={it.icon as any}
                size={20}
                color={active ? '#fff' : brand.textMutedOnDark}
              />
              <Text style={[s.itemTxt, active && s.itemTxtActive]}>
                {(t as any)[it.labelKey] ?? it.labelKey}
              </Text>
            </Pressable>
          );
        })}
      </DrawerContentScrollView>

      {/* Chiqish */}
      <View style={[s.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable onPress={signOut} style={s.logout}>
          <Ionicons name="log-out-outline" size={18} color={brand.danger} />
          <Text style={s.logoutTxt}>{t.logout}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: '82%', backgroundColor: brand.surface },
        swipeEdgeWidth: 40,
      }}
    />
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.surface },

  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.xl,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
  brand: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: -0.5 },
  brandSub: {
    color: brand.textMutedOnDark,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  userBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.xl,
    paddingVertical: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(5,150,105,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(5,150,105,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTxt: { color: brand.primaryLight, fontSize: 17, fontWeight: '900' },
  userName: { color: '#fff', fontSize: 14, fontWeight: '900' },
  userRole: {
    color: brand.primaryLight,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },

  list: { padding: space.md },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    paddingHorizontal: space.lg,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  itemActive: { backgroundColor: brand.primary },
  itemPressed: { opacity: 0.7 },
  itemTxt: {
    color: brand.textMutedOnDark,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemTxtActive: { color: '#fff', fontWeight: '900' },

  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: 'rgba(220,38,38,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.2)',
  },
  logoutTxt: {
    color: brand.danger,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
