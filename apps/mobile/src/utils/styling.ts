import { Dimensions } from 'react-native';

/** Responsive sizing helpers based on a 375 × 812 reference frame. */

const { width, height } = Dimensions.get('window');

const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/** Scale a value against screen width. */
export const scale = (size: number): number =>
  (width / GUIDELINE_BASE_WIDTH) * size;

/** Scale a value against screen height. */
export const verticalScale = (size: number): number =>
  (height / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Scale with damping, so large tablets don't get comically large spacing.
 * `factor` 0 = untouched, 1 = fully scaled.
 */
export const moderateScale = (size: number, factor = 0.5): number =>
  size + (scale(size) - size) * factor;
