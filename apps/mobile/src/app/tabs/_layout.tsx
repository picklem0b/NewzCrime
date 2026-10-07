import { Tabs } from 'expo-router';
import {
	BookmarkSimpleIcon,
	MagnifyingGlassIcon,
	MicrophoneIcon,
	NewspaperIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export default function TabsLayout(): ReactElement {
	const { colour } = useTheme();

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colour.accent,
				tabBarInactiveTintColor: colour.textMuted,
				tabBarStyle: {
					backgroundColor: colour.background,
					borderTopColor: colour.border,
					borderTopWidth: StyleSheet.hairlineWidth
				},
				tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }
			}}
		>
			<Tabs.Screen
				name='Home'
				options={{
					title: 'Today',
					tabBarIcon: ({ color, size, focused }) => (
						<NewspaperIcon
							size={size}
							color={color}
							weight={focused ? 'fill' : 'regular'}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name='Search'
				options={{
					title: 'Search',
					tabBarIcon: ({ color, size, focused }) => (
						<MagnifyingGlassIcon
							size={size}
							color={color}
							weight={focused ? 'bold' : 'regular'}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name='Podcasts'
				options={{
					title: 'Podcasts',
					tabBarIcon: ({ color, size, focused }) => (
						<MicrophoneIcon
							size={size}
							color={color}
							weight={focused ? 'fill' : 'regular'}
						/>
					)
				}}
			/>
			<Tabs.Screen
				name='Saved'
				options={{
					title: 'Library',
					tabBarIcon: ({ color, size, focused }) => (
						<BookmarkSimpleIcon
							size={size}
							color={color}
							weight={focused ? 'fill' : 'regular'}
						/>
					)
				}}
			/>
			{/*
			 * Registered but hidden. expo-router turns every file in this directory
			 * into a tab, so a route that is not declared here still draws a tab.
			 * `href: null` keeps both reachable by navigation without spending two
			 * slots of the bar; turning Discover into a tab is then a one-line change.
			 */}
			<Tabs.Screen name='Discover' options={{ href: null }} />
			<Tabs.Screen name='Settings' options={{ href: null }} />
		</Tabs>
	);
}
