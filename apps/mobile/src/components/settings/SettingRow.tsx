import { CaretRightIcon } from 'phosphor-react-native';
import type { ReactElement, ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import Text from '@/components/ui/Text';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import type { Option } from '@/types';

export interface SettingGroupProps {
	title: string;
	children: ReactNode;
}

export function SettingGroup({
	title,
	children
}: SettingGroupProps): ReactElement {
	const { colour, radius, spacing } = useTheme();

	return (
		<View style={{ gap: spacing.sm }}>
			<Text variant='label' tone='faint' accessibilityRole='header'>
				{title}
			</Text>
			<View
				style={{
					borderRadius: radius.lg,
					backgroundColor: colour.surface,
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: colour.border,
					overflow: 'hidden'
				}}
			>
				{children}
			</View>
		</View>
	);
}

export interface SettingRowProps {
	label: string;
	value?: string;
	description?: string;
	onPress?: () => void;
	last?: boolean;
}

export function SettingRow({
	label,
	value,
	description,
	onPress,
	last = false
}: SettingRowProps): ReactElement {
	const { colour, spacing } = useTheme();
	const { touch } = useLayout();

	return (
		<Pressable
			accessibilityRole={onPress ? 'button' : 'text'}
			accessibilityLabel={value ? `${label}, ${value}` : label}
			disabled={!onPress}
			onPress={onPress}
			style={({ pressed }) => [
				styles.row,
				{
					minHeight: touch + 12,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					gap: spacing.md,
					backgroundColor: pressed ? colour.pressed : 'transparent',
					borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
					borderBottomColor: colour.border
				}
			]}
		>
			<View style={styles.flex}>
				<Text variant='body'>{label}</Text>
				{description ? (
					<Text variant='meta' tone='faint'>
						{description}
					</Text>
				) : null}
			</View>
			{value ? (
				<Text variant='small' tone='muted'>
					{value}
				</Text>
			) : null}
			{onPress ? (
				<CaretRightIcon size={16} color={colour.textFaint} />
			) : null}
		</Pressable>
	);
}

export interface ToggleRowProps {
	label: string;
	description?: string;
	value: boolean;
	onChange: (next: boolean) => void;
	last?: boolean;
}

/** A boolean setting, with the whole row tappable as well as the switch. */
export function ToggleRow({
	label,
	description,
	value,
	onChange,
	last = false
}: ToggleRowProps): ReactElement {
	const { colour, spacing } = useTheme();
	const { touch } = useLayout();

	return (
		<Pressable
			accessibilityRole='switch'
			accessibilityLabel={label}
			accessibilityState={{ checked: value }}
			accessibilityHint={description}
			onPress={() => onChange(!value)}
			style={({ pressed }) => [
				styles.row,
				{
					minHeight: touch + 12,
					paddingHorizontal: spacing.lg,
					paddingVertical: spacing.md,
					gap: spacing.md,
					backgroundColor: pressed ? colour.pressed : 'transparent',
					borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
					borderBottomColor: colour.border
				}
			]}
		>
			<View style={styles.flex}>
				<Text variant='body'>{label}</Text>
				{description ? (
					<Text variant='meta' tone='faint'>
						{description}
					</Text>
				) : null}
			</View>
			<Switch
				accessibilityElementsHidden
				importantForAccessibility='no-hide-descendants'
				value={value}
				onValueChange={onChange}
				trackColor={{ false: colour.borderStrong, true: colour.accent }}
				thumbColor={colour.surfaceRaised}
				ios_backgroundColor={colour.borderStrong}
			/>
		</Pressable>
	);
}

export interface ChoiceRowProps<TId extends string> {
	label: string;
	description?: string;
	options: readonly Option<TId>[];
	value: TId;
	onChange: (next: TId) => void;
	last?: boolean;
}

export function ChoiceRow<TId extends string>({
	label,
	description,
	options,
	value,
	onChange,
	last = false
}: ChoiceRowProps<TId>): ReactElement {
	const { colour, radius, spacing } = useTheme();
	const { touch } = useLayout();

	return (
		<View
			style={{
				padding: spacing.lg,
				gap: spacing.md,
				borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
				borderBottomColor: colour.border
			}}
		>
			<View>
				<Text variant='body'>{label}</Text>
				{description ? (
					<Text variant='meta' tone='faint'>
						{description}
					</Text>
				) : null}
			</View>

			<View
				accessibilityRole='radiogroup'
				style={[
					styles.segmented,
					{
						borderRadius: radius.md,
						backgroundColor: colour.surfaceRaised,
						borderColor: colour.border
					}
				]}
			>
				{options.map(option => {
					const isActive = option.id === value;

					return (
						<Pressable
							key={option.id}
							accessibilityRole='radio'
							accessibilityLabel={option.label}
							accessibilityState={{
								selected: isActive,
								checked: isActive
							}}
							onPress={() => onChange(option.id)}
							style={[
								styles.segment,
								{
									minHeight: Math.max(40, touch - 4),
									borderRadius: radius.md - 2,
									backgroundColor: isActive
										? colour.accent
										: 'transparent'
								}
							]}
						>
							<Text
								variant='small'
								tone={isActive ? 'onAccent' : 'muted'}
								style={{ fontWeight: isActive ? '700' : '500' }}
							>
								{option.label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	row: { flexDirection: 'row', alignItems: 'center' },
	flex: { flex: 1 },
	segmented: {
		flexDirection: 'row',
		padding: 2,
		borderWidth: StyleSheet.hairlineWidth
	},
	segment: {
		flex: 1,
		minHeight: 40,
		alignItems: 'center',
		justifyContent: 'center'
	}
});
