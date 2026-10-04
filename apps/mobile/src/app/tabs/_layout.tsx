import { Tabs } from 'expo-router';
import {
  BookmarkSimpleIcon,
  CompassIcon,
  GearSixIcon,
  HouseIcon,
  MicrophoneIcon,
} from 'phosphor-react-native';
import type { ReactElement } from 'react';

import { useTheme } from '@/hooks/useTheme';

/**
 * Tab navigation: Home, Discover, Saved, Podcasts and Settings.
 *
 * The leading underscore is required by expo-router for layout files.
 */
export default function TabsLayout(): ReactElement {
  const { colour } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colour.accent,
        tabBarInactiveTintColor: colour.textFaint,
        tabBarStyle: {
          backgroundColor: colour.background,
          borderTopColor: colour.border,
          borderTopWidth: 0.5,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name='Home'
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <HouseIcon size={size} color={color} weight='fill' />
          ),
        }}
      />
      <Tabs.Screen
        name='Discover'
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <CompassIcon size={size} color={color} weight='fill' />
          ),
        }}
      />
      <Tabs.Screen
        name='Saved'
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <BookmarkSimpleIcon size={size} color={color} weight='fill' />
          ),
        }}
      />
      <Tabs.Screen
        name='Podcasts'
        options={{
          title: 'Podcasts',
          tabBarIcon: ({ color, size }) => (
            <MicrophoneIcon size={size} color={color} weight='fill' />
          ),
        }}
      />
      <Tabs.Screen
        name='Settings'
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <GearSixIcon size={size} color={color} weight='fill' />
          ),
        }}
      />
    </Tabs>
  );
}
