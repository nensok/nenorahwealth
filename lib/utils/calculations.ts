import type { CategorySpend, Category, Expense, InvestmentWithPnL, Investment } from '@/types';

export function calcBalance(totalIncome: number, totalExpenses: number): number {
  return totalIncome - totalExpenses;
}

export function calcPortfolioValue(quantity: number, currentPrice: number): number {
  return quantity * currentPrice;
}

export function calcProfitLoss(quantity: number, buyPrice: number, currentPrice: number): number {
  return (currentPrice - buyPrice) * quantity;
}

export function calcProfitLossPercent(buyPrice: number, currentPrice: number): number {
  if (buyPrice === 0) return 0;
  return ((currentPrice - buyPrice) / buyPrice) * 100;
}

export function enrichInvestment(investment: Investment): InvestmentWithPnL {
  return {
    ...investment,
    portfolioValue: calcPortfolioValue(investment.quantity, investment.currentPrice),
    profitLoss: calcProfitLoss(investment.quantity, investment.buyPrice, investment.currentPrice),
    profitLossPercent: calcProfitLossPercent(investment.buyPrice, investment.currentPrice),
  };
}

export function calcCategorySpend(
  expenses: Expense[],
  categories: Category[],
): CategorySpend[] {
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const byCategory = new Map<number, number>();
  for (const e of expenses) {
    byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + e.amount);
  }
  const result: CategorySpend[] = [];
  for (const [categoryId, total] of byCategory) {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      result.push({
        category,
        total,
        percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0,
      });
    }
  }
  return result.sort((a, b) => b.total - a.total);
}
