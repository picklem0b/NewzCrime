import { Tabs } from 'expo-router';
import {
	BookmarkSimpleIcon,
	CompassIcon,
	MicrophoneIcon,
	NewspaperIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * The four content tabs.
 *
 * Search and Settings are not here: both live in the top bar that every tab
 * renders, so they are one tap away without occupying a seat. A file in this
 * directory becomes a tab whether or not it is declared, which is why the
 * routes they used to have are gone rather than hidden.
 */
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
				name='Discover'
				options={{
					title: 'Discover',
					tabBarIcon: ({ color, size, focused }) => (
						<CompassIcon
							size={size}
							color={color}
							weight={focused ? 'fill' : 'regular'}
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
		</Tabs>
	);
}
