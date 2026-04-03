import type { SQLiteDatabase } from 'expo-sqlite';
import type { Budget } from '@/types';

interface RawBudget {
  id: number;
  category_id: number;
  amount: number;
  month: number;
  year: number;
  created_at: string;
}

function rowToBudget(row: RawBudget): Budget {
  return {
    id: row.id,
    categoryId: row.category_id,
    amount: row.amount,
    month: row.month,
    year: row.year,
    createdAt: row.created_at,
  };
}

export async function getBudgetsByMonth(
  db: SQLiteDatabase,
  month: number,
  year: number,
): Promise<Budget[]> {
  const rows = await db.getAllAsync<RawBudget>(
    'SELECT * FROM budgets WHERE month = ? AND year = ?',
    [month, year],
  );
  return rows.map(rowToBudget);
}

export async function getBudgetByCategoryMonth(
  db: SQLiteDatabase,
  categoryId: number,
  month: number,
  year: number,
): Promise<Budget | null> {
  const row = await db.getFirstAsync<RawBudget>(
    'SELECT * FROM budgets WHERE category_id = ? AND month = ? AND year = ?',
    [categoryId, month, year],
  );
  return row ? rowToBudget(row) : null;
}

export async function upsertBudget(
  db: SQLiteDatabase,
  categoryId: number,
  amount: number,
  month: number,
  year: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO budgets (category_id, amount, month, year)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(category_id, month, year) DO UPDATE SET amount = excluded.amount`,
    [categoryId, amount, month, year],
  );
}

export async function deleteBudget(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM budgets WHERE id = ?', [id]);
}

export async function getCategorySpentForMonth(
  db: SQLiteDatabase,
  categoryId: number,
  month: number,
  year: number,
): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category_id = ? AND month = ? AND year = ?',
    [categoryId, month, year],
  );
  return row?.total ?? 0;
}
