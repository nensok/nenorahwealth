import { useAppStore } from '@/stores/app-store';
import { Colors } from '@/constants/theme';

/**
 * Returns the current theme's color palette.
 * Reads the user's theme preference from app-store settings.
 * Falls back to dark if settings haven't loaded yet.
 */
export function useColors() {
  const theme = useAppStore((s) => s.settings?.theme ?? 'dark');
  return Colors[theme];
}
