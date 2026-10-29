/**
 * Onboarding content.
 *
 * The artwork is the supplied illustration set, converted to PNG because the
 * app ships `expo-image` rather than an SVG runtime. Captions come from the
 * product copy; keep them short enough for two lines on a 360dp phone.
 */

import type { Icon } from 'phosphor-react-native';
import {
  ArticleIcon,
  BellIcon,
  CalendarBlankIcon,
  GavelIcon,
  GlobeHemisphereWestIcon,
  HeadphonesIcon,
  MapPinIcon,
  MicrophoneIcon,
  NewspaperIcon,
  PlayIcon,
  RadioIcon,
  ScalesIcon,
  SparkleIcon,
  SpeakerHighIcon
} from 'phosphor-react-native';
import type { ImageSourcePropType } from 'react-native';

/** Where an icon sits around the illustration, in dp from the stage edges. */
export interface Placement {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export interface FloatingIcon {
  Icon: Icon;
  /** Glyph size in dp. The button around it scales with this. */
  size: number;
  placement: Placement;
  /** Starting vertical offset, in dp. Varies the float phase. */
  drift: number;
  /** One leg of the float, in milliseconds. */
  duration: number;
}

export interface OnboardingSlide {
  id: string;
  caption: string;
  art: ImageSourcePropType;
  /** An accessible description of the illustration. */
  artLabel: string;
  icons: readonly FloatingIcon[];
}

export const onboardingSlides: readonly OnboardingSlide[] = [
  {
    id: 'news',
    caption: 'Get updated on the latest news',
    art: require('../../assets/onboarding/guotln.png') as ImageSourcePropType,
    artLabel: 'A reader catching up on the day\u2019s news',
    icons: [
      { Icon: NewspaperIcon, size: 34, placement: { left: -10, top: 34 }, drift: -2, duration: 2600 },
      { Icon: BellIcon, size: 20, placement: { right: -4, top: 6 }, drift: 2, duration: 3000 },
      { Icon: ArticleIcon, size: 26, placement: { right: 18, bottom: 0 }, drift: -1, duration: 3400 },
      { Icon: PlayIcon, size: 15, placement: { left: 6, bottom: 52 }, drift: 1, duration: 2500 },
      { Icon: GlobeHemisphereWestIcon, size: 21, placement: { left: 64, top: -14 }, drift: 3, duration: 3600 },
      { Icon: SparkleIcon, size: 14, placement: { right: 60, bottom: -6 }, drift: -3, duration: 2800 }
    ]
  },
  {
    id: 'podcasts',
    caption: 'Listen to podcasts from anywhere',
    art: require('../../assets/onboarding/ltpfa.png') as ImageSourcePropType,
    artLabel: 'A listener wearing headphones',
    icons: [
      { Icon: HeadphonesIcon, size: 36, placement: { left: -14, top: 22 }, drift: 1, duration: 2800 },
      { Icon: MicrophoneIcon, size: 24, placement: { right: -8, top: 40 }, drift: -2, duration: 3200 },
      { Icon: PlayIcon, size: 18, placement: { right: 26, bottom: -2 }, drift: 2, duration: 2500 },
      { Icon: SpeakerHighIcon, size: 16, placement: { left: 10, bottom: 26 }, drift: -1, duration: 3500 },
      { Icon: RadioIcon, size: 28, placement: { left: 76, top: -10 }, drift: 2, duration: 3000 },
      { Icon: SparkleIcon, size: 13, placement: { right: 74, bottom: 16 }, drift: -3, duration: 2600 }
    ]
  },
  {
    id: 'world',
    caption: 'Get updated on the latest events around the planet',
    art: require('../../assets/onboarding/guotleatp.png') as ImageSourcePropType,
    artLabel: 'A globe with the day\u2019s events marked on it',
    icons: [
      { Icon: GlobeHemisphereWestIcon, size: 38, placement: { right: -16, top: 26 }, drift: -1, duration: 3300 },
      { Icon: MapPinIcon, size: 22, placement: { left: -6, top: 10 }, drift: 2, duration: 2700 },
      { Icon: CalendarBlankIcon, size: 25, placement: { left: 22, bottom: 0 }, drift: -2, duration: 3100 },
      { Icon: BellIcon, size: 17, placement: { right: 8, bottom: 44 }, drift: 1, duration: 2500 },
      { Icon: ArticleIcon, size: 20, placement: { left: 82, top: -8 }, drift: -3, duration: 3600 },
      { Icon: SparkleIcon, size: 15, placement: { right: 88, bottom: 8 }, drift: 2, duration: 2900 }
    ]
  },
  {
    id: 'court',
    caption: 'View the latest court rulings',
    art: require('../../assets/onboarding/vtlcr.png') as ImageSourcePropType,
    artLabel: 'A court building and a judge\u2019s gavel',
    icons: [
      { Icon: GavelIcon, size: 34, placement: { left: -12, top: 12 }, drift: 1, duration: 2900 },
      { Icon: ScalesIcon, size: 28, placement: { right: -12, top: 36 }, drift: -2, duration: 3300 },
      { Icon: ArticleIcon, size: 20, placement: { left: 12, bottom: 18 }, drift: 2, duration: 2600 },
      { Icon: NewspaperIcon, size: 24, placement: { right: 14, bottom: 0 }, drift: -1, duration: 3100 },
      { Icon: CalendarBlankIcon, size: 16, placement: { left: 80, top: -12 }, drift: 3, duration: 3500 },
      { Icon: BellIcon, size: 18, placement: { right: 70, bottom: -4 }, drift: -3, duration: 2700 }
    ]
  }
];
