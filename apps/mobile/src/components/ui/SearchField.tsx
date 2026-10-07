import { MagnifyingGlassIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import type { ReactElement } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { textVariants } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

import IconButton from './IconButton';

export interface SearchFieldProps {
	value: string;
	onChangeText: (value: string) => void;
	onSubmit?: () => void;
	placeholder: string;
	autoFocus?: boolean;
}

export function SearchField({
	value,
	onChangeText,
	onSubmit,
	placeholder,
	autoFocus = false
}: SearchFieldProps): ReactElement {
	const { colour, layout, radius, spacing } = useTheme();
	const [focused, setFocused] = useState(false);

	return (
		<View
			style={[
				styles.field,
				{
					minHeight: layout.touch + 4,
					borderRadius: radius.lg,
					paddingLeft: spacing.md,
					backgroundColor: colour.surface,
					borderColor: focused ? colour.accent : colour.border,
					borderWidth: focused ? 2 : StyleSheet.hairlineWidth
				}
			]}
		>
			<MagnifyingGlassIcon size={20} color={colour.textMuted} />

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
		</View>
	);
}

const styles = StyleSheet.create({
	field: { flexDirection: 'row', alignItems: 'center' },
	input: { flex: 1, paddingVertical: 10 }
});

export default SearchField;
