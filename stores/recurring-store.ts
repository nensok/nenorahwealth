import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getAllRecurring,
  insertRecurring,
  updateRecurring,
  deleteRecurring,
  getRecurringById,
  processDueRecurring,
} from '@/lib/db/queries/recurring';
import type { RecurringTransaction } from '@/types';

interface RecurringState {
  items: RecurringTransaction[];
  isLoading: boolean;

  load: () => Promise<void>;
  add: (data: Omit<RecurringTransaction, 'id' | 'createdAt'>) => Promise<void>;
  update: (id: number, data: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getById: (id: number) => Promise<RecurringTransaction | null>;
  /** Auto-generate overdue entries. Returns count of generated records. */
  processDue: (defaultCategoryId?: number) => Promise<number>;
}

export const useRecurringStore = create<RecurringState>((set, get) => ({
  items: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const db = await getDb();
    const items = await getAllRecurring(db);
    set({ items, isLoading: false });
  },

  add: async (data) => {
    const db = await getDb();
    await insertRecurring(db, data);
    const items = await getAllRecurring(db);
    set({ items });
  },

  update: async (id, data) => {
    const db = await getDb();
    await updateRecurring(db, id, data);
    const items = await getAllRecurring(db);
    set({ items });
  },

  remove: async (id) => {
    const db = await getDb();
    await deleteRecurring(db, id);
    set({ items: get().items.filter((r) => r.id !== id) });
  },

  getById: async (id) => {
    const db = await getDb();
    return getRecurringById(db, id);
  },

  processDue: async (defaultCategoryId = 1) => {
    const db = await getDb();
    return processDueRecurring(db, defaultCategoryId);
  },
}));
