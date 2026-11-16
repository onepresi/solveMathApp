import { Platform } from 'react-native';

export type Palette = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  tabInactive: string;
};

export const Colors: { light: Palette; dark: Palette } = {
  light: {
    background: '#F5F6FB',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F8',
    border: '#E2E5F0',
    text: '#141729',
    textMuted: '#646A85',
    primary: '#4F46E5',
    primarySoft: '#E7E6FD',
    onPrimary: '#FFFFFF',
    success: '#12976B',
    successSoft: '#DDF5EC',
    warning: '#C27803',
    warningSoft: '#FDF1D8',
    danger: '#D93A4A',
    dangerSoft: '#FCE4E7',
    tabInactive: '#8A8FA8',
  },
  dark: {
    background: '#0E1020',
    surface: '#181B2E',
    surfaceAlt: '#22263C',
    border: '#2C3049',
    text: '#EEF0FA',
    textMuted: '#9CA1BD',
    primary: '#8B85FF',
    primarySoft: '#2B2A55',
    onPrimary: '#0E1020',
    success: '#3DD9A0',
    successSoft: '#163A30',
    warning: '#F5B544',
    warningSoft: '#3D3017',
    danger: '#FF7583',
    dangerSoft: '#40202A',
    tabInactive: '#6E7390',
  },
};

/** Accent colors used to tint math topics. Each works on both light and dark surfaces. */
export const TopicColors = {
  algebra: '#7468F0',
  geometry: '#0EA5A4',
  calculus: '#E0508A',
  trigonometry: '#F08C2E',
  statistics: '#2E86DE',
  arithmetic: '#12976B',
  other: '#7C83A3',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};

export const Fonts = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};
