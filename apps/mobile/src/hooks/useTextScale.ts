/** Body-copy multiplier from the reader text-size setting. */

import { textScale } from '@/constants/theme';

import { useSetting } from './useSettings';

export function useTextScale(): number {
  return textScale[useSetting('textSize')];
}
