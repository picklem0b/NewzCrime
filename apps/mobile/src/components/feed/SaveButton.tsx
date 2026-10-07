import type { ContentItem } from '@newzcrime/shared';
import { BookmarkSimpleIcon } from 'phosphor-react-native';
import type { ReactElement } from 'react';

import IconButton from '@/components/ui/IconButton';
import { useIsSaved, useSaved } from '@/hooks/useSaved';
import { useTheme } from '@/hooks/useTheme';
import { tapFeedback } from '@/utils/haptics';

export interface SaveButtonProps {
	item: ContentItem;
	size?: number;
}

export function SaveButton({ item, size = 22 }: SaveButtonProps): ReactElement {
	const { colour } = useTheme();
	const isSaved = useIsSaved(item.id);
	const { toggle } = useSaved();

	return (
		<IconButton
			label={
				isSaved
					? `Remove from Library: ${item.title}`
					: `Save: ${item.title}`
			}
			selected={isSaved}
			onPress={() => {
				tapFeedback();
				toggle(item);
			}}
			icon={
				<BookmarkSimpleIcon
					size={size}
					color={isSaved ? colour.accent : colour.textMuted}
					weight={isSaved ? 'fill' : 'regular'}
				/>
			}
		/>
	);
}

export default SaveButton;
