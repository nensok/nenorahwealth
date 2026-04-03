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

export interface Budget {
  id: number;
  categoryId: number;
  amount: number;
  month: number;
  year: number;
  createdAt: string;
}

export interface BudgetWithSpend extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
}

export interface RecurringTransaction {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  categoryId?: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  nextDueDate: string; // YYYY-MM-DD
  active: boolean;
  createdAt: string;
}

export interface InvestmentTransaction {
  id: number;
  investmentId: number;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface CategoryTrendPoint {
  categoryId: number;
  month: number;
  year: number;
  total: number;
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

export interface RecurringFormData {
  type: 'income' | 'expense';
  amount: string;
  title: string;
  categoryId: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  startDate: string; // YYYY-MM-DD
}

export interface InvestmentTransactionFormData {
  type: 'buy' | 'sell';
  quantity: string;
  price: string;
  date: string; // YYYY-MM-DD
  notes?: string;
}
