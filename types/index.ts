// ── Domain Models ──────────────────────────────────────────────────────────

export interface Settings {
  id: 1;
  userName: string;
  currencySymbol: string;
  onboardingDone: boolean;
  theme: 'dark' | 'light';
}

export interface Category {
  id: number;
  name: string;
  color: string;
  icon?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Income {
  id: number;
  amount: number;
  source: string;
  month: number;
  year: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  amount: number;
  categoryId: number;
  description: string;
  date: string; // YYYY-MM-DD
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: number;
  stockName: string;
  ticker?: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Derived / View Models ──────────────────────────────────────────────────

export interface MonthlySummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
}

export interface CategorySpend {
  category: Category;
  total: number;
  percentage: number;
}

export interface InvestmentWithPnL extends Investment {
  portfolioValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

// ── Form Input Types ───────────────────────────────────────────────────────

export interface IncomeFormData {
  amount: string;
  source: string;
  month: number;
  year: number;
  notes?: string;
}

export interface ExpenseFormData {
  amount: string;
  categoryId: number;
  description: string;
  date: string; // YYYY-MM-DD
}

export interface InvestmentFormData {
  stockName: string;
  ticker?: string;
  quantity: string;
  buyPrice: string;
  currentPrice: string;
  notes?: string;
}
