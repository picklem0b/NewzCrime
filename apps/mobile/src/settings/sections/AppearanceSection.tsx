/** Appearance: colour scheme and reader text size. */

import type { ReactElement } from 'react';
import { View } from 'react-native';

import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { colourModes, textSizes } from '@/settings/constants';
import { ChoiceRow } from '@/settings/components/SettingRow';

export function AppearanceSection(): ReactElement {
  const { spacingY } = useTheme();
  const { draft, set } = useSettings();

  return (
    <View style={{ gap: spacingY.sm }}>
      <ChoiceRow
        label='Colour scheme'
        description='System follows your device setting'
        options={colourModes}
        value={draft.colourMode}
        onChange={(value) => set('colourMode', value)}
      />

      <ChoiceRow
        label='Text size'
        description='Applies to headlines and story text'
        options={textSizes}
        value={draft.textSize}
        onChange={(value) => set('textSize', value)}
      />
    </View>
  );
}

export default AppearanceSection;
