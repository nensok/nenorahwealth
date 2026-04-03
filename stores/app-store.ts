import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import { runMigrations } from '@/lib/db/migrations';
import { getSettings, updateSettings } from '@/lib/db/queries/settings';
import type { Settings } from '@/types';

interface AppState {
  settings: Settings | null;
  isDbReady: boolean;

  initializeDb: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (data: Partial<Omit<Settings, 'id'>>) => Promise<void>;
  completeOnboarding: (userName: string, currencySymbol: string) => Promise<void>;
}

let _initDbPromise: Promise<void> | null = null;

export const useAppStore = create<AppState>((set) => ({
  settings: null,
  isDbReady: false,

  initializeDb: async () => {
    if (!_initDbPromise) {
      _initDbPromise = (async () => {
        const db = await getDb();
        await runMigrations(db);
        set({ isDbReady: true });
      })();
    }
    await _initDbPromise;
  },

  loadSettings: async () => {
    const db = await getDb();
    const settings = await getSettings(db);
    set({ settings });
  },

  saveSettings: async (data) => {
    const db = await getDb();
    await updateSettings(db, data);
    const updated = await getSettings(db);
    set({ settings: updated });
  },

  completeOnboarding: async (userName, currencySymbol) => {
    const db = await getDb();
    await updateSettings(db, { userName, currencySymbol, onboardingDone: true });
    const updated = await getSettings(db);
    set({ settings: updated });
  },
}));
