import { create } from 'zustand';
import { getDb } from '@/lib/db/client';
import {
  getAllInvestments,
  insertInvestment,
  updateInvestment,
  deleteInvestment,
} from '@/lib/db/queries/investments';
import {
  getTransactionsByInvestment,
  insertInvestmentTransaction,
  deleteInvestmentTransaction,
} from '@/lib/db/queries/investment-transactions';
import { enrichInvestment } from '@/lib/utils/calculations';
import type { Investment, InvestmentTransaction, InvestmentWithPnL } from '@/types';

interface InvestmentState {
  positions: Investment[];
  transactions: Record<number, InvestmentTransaction[]>;
  isLoading: boolean;

  load: () => Promise<void>;
  add: (data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  update: (id: number, data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  remove: (id: number) => Promise<void>;
  loadTransactions: (investmentId: number) => Promise<void>;
  addTransaction: (data: Omit<InvestmentTransaction, 'id' | 'createdAt'>) => Promise<void>;
  removeTransaction: (txId: number, investmentId: number) => Promise<void>;
  getTotalPortfolioValue: () => number;
  getTotalProfitLoss: () => number;
  getEnrichedPositions: () => InvestmentWithPnL[];
}

export const useInvestmentStore = create<InvestmentState>((set, get) => ({
  positions: [],
  transactions: {},
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
    const { transactions } = get();
    const newTx = { ...transactions };
    delete newTx[id];
    set({ positions: get().positions.filter((p) => p.id !== id), transactions: newTx });
  },

  loadTransactions: async (investmentId) => {
    const db = await getDb();
    const txs = await getTransactionsByInvestment(db, investmentId);
    set({ transactions: { ...get().transactions, [investmentId]: txs } });
  },

  addTransaction: async (data) => {
    const db = await getDb();
    await insertInvestmentTransaction(db, data);
    const txs = await getTransactionsByInvestment(db, data.investmentId);
    set({ transactions: { ...get().transactions, [data.investmentId]: txs } });
  },

  removeTransaction: async (txId, investmentId) => {
    const db = await getDb();
    await deleteInvestmentTransaction(db, txId);
    const txs = await getTransactionsByInvestment(db, investmentId);
    set({ transactions: { ...get().transactions, [investmentId]: txs } });
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
