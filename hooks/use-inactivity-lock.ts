import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';

export function useInactivityLock() {
  const lastActiveAt = useAuthStore((s) => s.lastActiveAt);
  const lockAfterMs = useAuthStore((s) => s.lockAfterMs);
  const isPinSet = useAuthStore((s) => s.isPinSet);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const lock = useAuthStore((s) => s.lock);
  const refreshActivity = useAuthStore((s) => s.refreshActivity);
  const bgTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        bgTimestampRef.current = Date.now();
      } else if (nextState === 'active') {
        if (bgTimestampRef.current !== null && isPinSet) {
          const elapsed = Date.now() - bgTimestampRef.current;
          if (elapsed >= lockAfterMs) {
            lock();
            router.replace('/(auth)/pin-entry');
          }
          bgTimestampRef.current = null;
        }
      }
    });

    return () => subscription.remove();
  }, [isPinSet, lockAfterMs, lock]);

  return { refreshActivity };
}
