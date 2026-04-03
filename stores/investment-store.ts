import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getAllInvestments,
  insertInvestment,
  updateInvestment,
  deleteInvestment,
} from '@/lib/db/queries/investments';
import { enrichInvestment } from '@/lib/utils/calculations';
import type { Investment, InvestmentWithPnL } from '@/types';

interface InvestmentState {
  positions: Investment[];
  isLoading: boolean;

  load: () => Promise<void>;
  add: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: number, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  getTotalPortfolioValue: () => number;
  getTotalProfitLoss: () => number;
  getEnrichedPositions: () => InvestmentWithPnL[];
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  positions: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const db = await getDb();
    const positions = await getAllInvestments(db);
    set({ positions, isLoading: false });
  },

  add: async (data) => {
    const db = await getDb();
    await insertInvestment(db, data);
    const positions = await getAllInvestments(db);
    set({ positions });
  },

  update: async (id, data) => {
    const db = await getDb();
    await updateInvestment(db, id, data);
    const positions = await getAllInvestments(db);
    set({ positions });
  },

  remove: async (id) => {
    const db = await getDb();
    await deleteInvestment(db, id);
    set({ positions: get().positions.filter((p) => p.id !== id) });
  },

  getTotalPortfolioValue: () => {
    return get().positions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
  },

  getTotalProfitLoss: () => {
    return get().positions.reduce(
      (sum, p) => sum + (p.currentPrice - p.buyPrice) * p.quantity,
      0,
    );
  },

  getEnrichedPositions: () => get().positions.map(enrichInvestment),
}));
