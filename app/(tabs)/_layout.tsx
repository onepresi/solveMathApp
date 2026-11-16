import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/hooks/use-theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Dashboard', icon: 'grid-outline', iconActive: 'grid' },
  { name: 'saved', title: 'Saved', icon: 'bookmark-outline', iconActive: 'bookmark' },
  { name: 'learn', title: 'Learn', icon: 'book-outline', iconActive: 'book' },
  { name: 'quiz', title: 'Quiz', icon: 'help-circle-outline', iconActive: 'help-circle' },
  { name: 'settings', title: 'Settings', icon: 'settings-outline', iconActive: 'settings' },
];

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={size ?? 24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
