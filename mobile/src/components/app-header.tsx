import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { brand, space } from '@/lib/theme';

/** Umumiy header — chapda gamburger (drawer'ni ochadi) */
export function AppHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const openDrawer = () => {
    Haptics.selectionAsync();
    // Drawer navigator navigation obyektiga openDrawer() qo'shadi
    (navigation as any).openDrawer?.();
  };

  return (
    <View style={[s.root, { paddingTop: insets.top + space.md }]}>
      <Pressable onPress={openDrawer} hitSlop={12} style={s.btn}>
        <Ionicons name="menu" size={24} color="#fff" />
      </Pressable>
      <Text style={s.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={s.right}>{right}</View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: brand.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  btn: { padding: 4 },
  title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '800', marginLeft: space.md },
  right: { minWidth: 32, alignItems: 'flex-end' },
});
