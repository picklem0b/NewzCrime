import type { ReactElement } from 'react';
import { ScrollView, View } from 'react-native';

import Chip from '@/components/ui/Chip';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import type { ProvinceFilter, WatchCategory } from '@/types';
import { WATCH_RAILS, provinceLabel } from '@/utils/watch';

export interface WatchCategoryBarProps {
  value: WatchCategory;
  province: ProvinceFilter;
  onChange: (next: WatchCategory) => void;
}

/** The shelf switcher. It scrolls horizontally and keeps 44pt chips. */
export function WatchCategoryBar({
  value,
  province,
  onChange
}: WatchCategoryBarProps): ReactElement {
  const { spacing } = useTheme();
  const { gutter } = useLayout();

  return (
    <View style={{ paddingVertical: spacing.xs }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: gutter,
          gap: spacing.sm,
          alignItems: 'center'
        }}
      >
        {WATCH_RAILS.map((rail) => (
          <Chip
            key={rail.id}
            label={
              rail.id === 'local'
                ? `Local · ${provinceLabel(province)}`
                : rail.label
            }
            selected={rail.id === value}
            onPress={() => onChange(rail.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default WatchCategoryBar;
