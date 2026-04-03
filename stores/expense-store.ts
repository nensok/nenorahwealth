import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getExpensesByMonth,
  insertExpense,
  updateExpense,
  deleteExpense,
  getMonthlyExpenseTotals,
  getCategorySpendByMonths,
} from '@/lib/db/queries/expenses';
import type { Expense } from '@/types';

interface ExpenseState {
  records: Expense[];
  isLoading: boolean;

  loadByMonth: (month: number, year: number) => Promise<void>;
  add: (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: number, data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getMonthlyTotal: () => number;
  getByCategory: (categoryId: number) => Expense[];
  fetchMonthlyTotals: (months: Array<{ month: number; year: number }>) => Promise<Array<{ month: number; year: number; total: number }>>;
  fetchCategorySpendByMonths: (months: Array<{ month: number; year: number }>) => Promise<Array<{ categoryId: number; month: number; year: number; total: number }>>;
}

export const useExpenseStore = create<ExpenseState>((set, get) => ({
  records: [],
  isLoading: false,

  loadByMonth: async (month, year) => {
    set({ isLoading: true });
    const db = await getDb();
    const records = await getExpensesByMonth(db, month, year);
    set({ records, isLoading: false });
  },

  add: async (data) => {
    const db = await getDb();
    await insertExpense(db, data);
    const records = await getExpensesByMonth(db, data.month, data.year);
    set({ records });
  },

  update: async (id, data) => {
    const db = await getDb();
    await updateExpense(db, id, data);
    const current = get().records;
    if (current.length > 0) {
      const first = current[0];
      const reloaded = await getExpensesByMonth(db, first.month, first.year);
      set({ records: reloaded });
    }
  },

  remove: async (id) => {
    const db = await getDb();
    await deleteExpense(db, id);
    set({ records: get().records.filter((r) => r.id !== id) });
  },

  getMonthlyTotal: () => get().records.reduce((sum, r) => sum + r.amount, 0),

  getByCategory: (categoryId) => get().records.filter((r) => r.categoryId === categoryId),

  fetchMonthlyTotals: async (months) => {
    const db = await getDb();
    return getMonthlyExpenseTotals(db, months);
  },

  fetchCategorySpendByMonths: async (months) => {
    const db = await getDb();
    return getCategorySpendByMonths(db, months);
  },
}));
