import { create } from 'zustand';
import { storePin, pinExists, verifyPin, deletePin } from '@/lib/auth/pin';

interface AuthState {
  isAuthenticated: boolean;
  isPinSet: boolean;
  lastActiveAt: number;
  lockAfterMs: number;

  checkPinExists: () => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  removePin: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  refreshActivity: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isPinSet: false,
  lastActiveAt: Date.now(),
  lockAfterMs: 5 * 60 * 1000, // 5 minutes

  checkPinExists: async () => {
    const exists = await pinExists();
    set({ isPinSet: exists });
  },

  verifyPin: async (pin) => {
    const ok = await verifyPin(pin);
    if (ok) set({ isAuthenticated: true, lastActiveAt: Date.now() });
    return ok;
  },

  setupPin: async (pin) => {
    await storePin(pin);
    set({ isPinSet: true, isAuthenticated: true, lastActiveAt: Date.now() });
  },

  changePin: async (oldPin, newPin) => {
    const ok = await verifyPin(oldPin);
    if (!ok) return false;
    await storePin(newPin);
    return true;
  },

  removePin: async () => {
    await deletePin();
    set({ isPinSet: false, isAuthenticated: false });
  },

  lock: () => set({ isAuthenticated: false }),

  unlock: () => set({ isAuthenticated: true, lastActiveAt: Date.now() }),

  refreshActivity: () => set({ lastActiveAt: Date.now() }),
}));
