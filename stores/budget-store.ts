import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getBudgetsByMonth,
  upsertBudget,
  deleteBudget,
  getCategorySpentForMonth,
} from '@/lib/db/queries/budgets';
import type { Budget, BudgetWithSpend } from '@/types';

interface BudgetState {
  budgets: Budget[];
  isLoading: boolean;

  loadByMonth: (month: number, year: number) => Promise<void>;
  upsert: (categoryId: number, amount: number, month: number, year: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getBudgetWithSpend: (categoryId: number, month: number, year: number) => Promise<BudgetWithSpend | null>;
  checkOverBudget: (categoryId: number, month: number, year: number) => Promise<{ isOver: boolean; budget: number; spent: number } | null>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,

  loadByMonth: async (month, year) => {
    set({ isLoading: true });
    const db = await getDb();
    const budgets = await getBudgetsByMonth(db, month, year);
    set({ budgets, isLoading: false });
  },

  upsert: async (categoryId, amount, month, year) => {
    const db = await getDb();
    await upsertBudget(db, categoryId, amount, month, year);
    const budgets = await getBudgetsByMonth(db, month, year);
    set({ budgets });
  },

  remove: async (id) => {
    const db = await getDb();
    await deleteBudget(db, id);
    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },

  getBudgetWithSpend: async (categoryId, month, year) => {
    const db = await getDb();
    const budget = get().budgets.find(
      (b) => b.categoryId === categoryId && b.month === month && b.year === year,
    );
    if (!budget) return null;
    const spent = await getCategorySpentForMonth(db, categoryId, month, year);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;
    return { ...budget, spent, remaining, percentage };
  },

  checkOverBudget: async (categoryId, month, year) => {
    const db = await getDb();
    const budget = get().budgets.find(
      (b) => b.categoryId === categoryId && b.month === month && b.year === year,
    );
    if (!budget) return null;
    const spent = await getCategorySpentForMonth(db, categoryId, month, year);
    return { isOver: spent > budget.amount, budget: budget.amount, spent };
  },
}));
