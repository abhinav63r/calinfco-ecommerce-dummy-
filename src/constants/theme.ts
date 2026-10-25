/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const BrandColors = {
  primary: '#007F86',
  primaryDark: '#006268',
  primaryLight: '#E8F5F5',
  primarySurface: '#F0F9F9',
  accent: '#028090',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#EDF2F7',
  cardBackground: '#FFFFFF',
  appBackground: '#F8FAFC',
  status: {
    pending: { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' },
    processing: { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' },
    shipped: { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' },
    delivered: { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
    approved: { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' },
    scheduled: { bg: '#E0E7FF', text: '#4F46E5', border: '#C7D2FE' },
    completed: { bg: '#D1FAE5', text: '#059669', border: '#A7F3D0' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
    rejected: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  },
} as const;

export const Colors = {
  light: {
    text: '#1E293B',
    background: '#F8FAFC',
    backgroundElement: '#E8F5F5',
    backgroundSelected: '#007F86',
    textSecondary: '#64748B',
    primary: '#007F86',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    backgroundElement: '#1E293B',
    backgroundSelected: '#007F86',
    textSecondary: '#94A3B8',
    primary: '#007F86',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
