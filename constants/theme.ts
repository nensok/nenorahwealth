import { Platform } from 'react-native';

export const Colors = {
  dark: {
    text: '#FFFFFF',
    background: '#0A0A0A',
    tint: '#AAFF00',
    icon: '#8A8A8A',
    tabIconDefault: '#444444',
    tabIconSelected: '#AAFF00',
    surface: '#141414',
    surfaceElevated: '#1E1E1E',
    positive: '#00E676',
    negative: '#FF4D4D',
    muted: '#8A8A8A',
    border: '#252525',
    accent: '#AAFF00',
  },
  light: {
    text: '#0A0A0A',
    background: '#F4F4F0',
    tint: '#5B9A00',
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#5B9A00',
    surface: '#FFFFFF',
    surfaceElevated: '#EAEAE5',
    positive: '#16A34A',
    negative: '#DC2626',
    muted: '#6B7280',
    border: '#E2E2DC',
    accent: '#5B9A00',
  },
};

export type AppColors = typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
