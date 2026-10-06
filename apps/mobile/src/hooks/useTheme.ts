/**
 * Resolves the active palette and exposes the design tokens.
 *
 * `colourMode` may be `system`, in which case the OS appearance decides. Every
 * screen reads colours from here, so switching the setting repaints the app.
 */

import { useColorScheme } from 'react-native';

import {
  motion,
  palettes,
  radius,
  spacingX,
  spacingY,
  tabBar,
  typography,
} from '@/constants/theme';
import type { ColourScheme } from '@/types';

import { useSetting } from './useSettings';

export function useTheme() {
  const mode = useSetting('colourMode');
  const systemScheme = useColorScheme();

  const scheme: ColourScheme =
    mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;

  return {
    colour: palettes[scheme],
    scheme,
    radius,
    spacingX,
    spacingY,
    tabBar,
    typography,
    motion,
  };
}
