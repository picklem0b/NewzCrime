import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import {
	BookmarkSimpleIcon,
	CompassIcon,
	GearSixIcon,
	HouseIcon,
	MicrophoneIcon
} from 'phosphor-react-native';
import type { ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
export default function TabsLayout(): ReactElement {
	const { colour, scheme, tabBar } = useTheme();
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: colour.accent,
				tabBarInactiveTintColor: colour.textFaint,
				tabBarStyle: {
					position: 'absolute',
					left: 12,
					right: 12,
					bottom: tabBar.offset,
					height: tabBar.height,
					paddingTop: 8,
					paddingBottom: 10,
					borderTopWidth: 0,
					borderRadius: 26,
					backgroundColor: 'transparent',
					elevation: 0,
					shadowColor: '#000',
					shadowOpacity: scheme === 'light' ? 0.12 : 0.25,
					shadowRadius: 18,
					shadowOffset: { width: 0, height: 8 }
				},
				tabBarBackground: () => (
					<View
						style={[
							StyleSheet.absoluteFill,
							{
								overflow: 'hidden',
								borderRadius: 26,
								borderWidth: 1,
								borderColor: colour.border
							}
						]}
					>
						<BlurView
							intensity={scheme === 'light' ? 80 : 55}
							tint={scheme}
							style={StyleSheet.absoluteFill}
						/>
						<View
							style={[
								StyleSheet.absoluteFill,
								{
									backgroundColor:
										scheme === 'light'
											? 'rgba(255,255,255,0.72)'
											: 'rgba(20,24,28,0.8)'
								}
							]}
						/>
					</View>
				),
				tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
				tabBarItemStyle: { minHeight: 50 }
			}}
		>
			<Tabs.Screen
				name='Home'
				options={{
					title: 'Home',
					tabBarIcon: ({ color, size }) => (
						<HouseIcon size={size} color={color} weight='fill' />
					)
				}}
			/>
			<Tabs.Screen
				name='Discover'
				options={{
					title: 'Discover',
					tabBarIcon: ({ color, size }) => (
						<CompassIcon size={size} color={color} weight='fill' />
					)
				}}
			/>
			<Tabs.Screen
				name='Saved'
				options={{
					title: 'Saved',
					tabBarIcon: ({ color, size }) => (
						<BookmarkSimpleIcon
							size={size}
							color={color}
							weight='fill'
						/>
					)
				}}
			/>
			<Tabs.Screen
				name='Podcasts'
				options={{
					title: 'Podcasts',
					tabBarIcon: ({ color, size }) => (
						<MicrophoneIcon
							size={size}
							color={color}
							weight='fill'
						/>
					)
				}}
			/>
			<Tabs.Screen
				name='Settings'
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, size }) => (
						<GearSixIcon size={size} color={color} weight='fill' />
					)
				}}
			/>
		</Tabs>
	);
}
