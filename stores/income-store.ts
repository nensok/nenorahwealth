import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getIncomeByMonth,
  insertIncome,
  updateIncome,
  deleteIncome,
  getMonthlyIncomeTotals,
} from '@/lib/db/queries/income';
import type { Income, MonthlySummary } from '@/types';

interface IncomeState {
  records: Income[];
  isLoading: boolean;

  loadByMonth: (month: number, year: number) => Promise<void>;
  add: (data: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: number, data: Partial<Omit<Income, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getMonthlyTotal: () => number;
  fetchMonthlyTotals: (months: Array<{ month: number; year: number }>) => Promise<Array<{ month: number; year: number; total: number }>>;
}

export const useIncomeStore = create<IncomeState>((set, get) => ({
  records: [],
  isLoading: false,

  loadByMonth: async (month, year) => {
    set({ isLoading: true });
    const db = await getDb();
    const records = await getIncomeByMonth(db, month, year);
    set({ records, isLoading: false });
  },

  add: async (data) => {
    const db = await getDb();
    await insertIncome(db, data);
    const records = await getIncomeByMonth(db, data.month, data.year);
    set({ records });
  },

  update: async (id, data) => {
    const db = await getDb();
    await updateIncome(db, id, data);
    // Reload current records (month may have changed, so reload all loaded records)
    const current = get().records;
    if (current.length > 0) {
      const first = current[0];
      const reloaded = await getIncomeByMonth(db, first.month, first.year);
      set({ records: reloaded });
    }
  },

  remove: async (id) => {
    const db = await getDb();
    await deleteIncome(db, id);
    set({ records: get().records.filter((r) => r.id !== id) });
  },

  getMonthlyTotal: () => get().records.reduce((sum, r) => sum + r.amount, 0),

  fetchMonthlyTotals: async (months) => {
    const db = await getDb();
    return getMonthlyIncomeTotals(db, months);
  },
}));
