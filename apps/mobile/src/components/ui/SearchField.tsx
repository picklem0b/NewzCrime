import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Animated, StyleSheet, TextInput } from 'react-native';

import { textVariants } from '@/constants/theme';
import { useAppMotion } from '@/hooks/useAppMotion';
import { useTheme } from '@/hooks/useTheme';

import IconButton from './IconButton';

export interface SearchFieldProps {
	value: string;
	onChangeText: (value: string) => void;
	onSubmit?: () => void;
	placeholder: string;
	autoFocus?: boolean;
}

/**
 * The search field.
 *
 * Focus is animated rather than switched: the border eases to the accent and
 * the field lifts a little, which reads as the app listening. `useNativeDriver`
 * stays false because the animated values are colours, not transforms.
 */
export function SearchField({
	value,
	onChangeText,
	onSubmit,
	placeholder,
	autoFocus = false
}: SearchFieldProps): ReactElement {
	const { colour, layout, radius, spacing } = useTheme();
	const motion = useAppMotion();
	const [focused, setFocused] = useState(false);
	const focus = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		Animated.timing(focus, {
			toValue: focused ? 1 : 0,
			duration: motion.duration.fast,
			useNativeDriver: false
		}).start();
	}, [focus, focused, motion.duration.fast]);

	const borderColor = focus.interpolate({
		inputRange: [0, 1],
		outputRange: [colour.border, colour.accent]
	});

	const shadowOpacity = focus.interpolate({
		inputRange: [0, 1],
		outputRange: [0, 0.18]
	});

	return (
		<Animated.View
			style={[
				styles.field,
				{
					minHeight: layout.touch + 4,
					borderRadius: radius.lg,
					paddingLeft: spacing.md,
					backgroundColor: colour.surface,
					borderColor,
					borderWidth: 1,
					shadowColor: colour.accent,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 0 },
					shadowOpacity,
					elevation: focused ? 2 : 0
				}
			]}
		>
			<MagnifyingGlassIcon
				size={20}
				color={focused ? colour.accent : colour.textMuted}
			/>

			<TextInput
				accessibilityLabel='Search stories, judgments and episodes'
				value={value}
				onChangeText={onChangeText}
				onSubmitEditing={onSubmit}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				placeholder={placeholder}
				placeholderTextColor={colour.textFaint}
				autoFocus={autoFocus}
				autoCapitalize='none'
				autoCorrect={false}
				returnKeyType='search'
				selectionColor={colour.accent}
				style={[
					styles.input,
					{
						color: colour.text,
						fontSize: textVariants.body.fontSize,
						marginLeft: spacing.sm
					}
				]}
			/>

			{value.length > 0 ? (
				<IconButton
					label='Clear search'
					onPress={() => onChangeText('')}
					icon={<XIcon size={18} color={colour.textMuted} />}
				/>
			) : null}
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	field: { flexDirection: 'row', alignItems: 'center' },
	input: { flex: 1, paddingVertical: 10 }
});

export default SearchField;
