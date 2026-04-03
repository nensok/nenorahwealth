import type { SQLiteDatabase } from 'expo-sqlite';
import type { Expense } from '@/types';

interface RawExpense {
  id: number;
  amount: number;
  category_id: number;
  description: string;
  date: string;
  month: number;
  year: number;
  created_at: string;
  updated_at: string;
}

function rowToExpense(row: RawExpense): Expense {
  return {
    id: row.id,
    amount: row.amount,
    categoryId: row.category_id,
    description: row.description,
    date: row.date,
    month: row.month,
    year: row.year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getExpensesByMonth(
  db: SQLiteDatabase,
  month: number,
  year: number,
): Promise<Expense[]> {
  const rows = await db.getAllAsync<RawExpense>(
    'SELECT * FROM expenses WHERE month = ? AND year = ? ORDER BY date DESC, created_at DESC',
    [month, year],
  );
  return rows.map(rowToExpense);
}

export async function getExpenseById(db: SQLiteDatabase, id: number): Promise<Expense | null> {
  const row = await db.getFirstAsync<RawExpense>('SELECT * FROM expenses WHERE id = ?', [id]);
  return row ? rowToExpense(row) : null;
}

export async function insertExpense(
  db: SQLiteDatabase,
  data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO expenses (amount, category_id, description, date, month, year) VALUES (?, ?, ?, ?, ?, ?)',
    [data.amount, data.categoryId, data.description, data.date, data.month, data.year],
  );
  return result.lastInsertRowId;
}

export async function updateExpense(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const values: unknown[] = [];
  if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
  if (data.categoryId !== undefined) { fields.push('category_id = ?'); values.push(data.categoryId); }
  if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
  if (data.date !== undefined) {
    fields.push('date = ?', 'month = ?', 'year = ?');
    const d = new Date(data.date);
    values.push(data.date, d.getMonth() + 1, d.getFullYear());
  }
  values.push(id);
  await db.runAsync(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteExpense(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

export async function getCategorySpendByMonths(
  db: SQLiteDatabase,
  months: Array<{ month: number; year: number }>,
): Promise<Array<{ categoryId: number; month: number; year: number; total: number }>> {
  const results: Array<{ categoryId: number; month: number; year: number; total: number }> = [];
  for (const { month, year } of months) {
    const rows = await db.getAllAsync<{ category_id: number; total: number }>(
      `SELECT category_id, COALESCE(SUM(amount), 0) as total
       FROM expenses WHERE month = ? AND year = ?
       GROUP BY category_id`,
      [month, year],
    );
    for (const row of rows) {
      results.push({ categoryId: row.category_id, month, year, total: row.total });
    }
  }
  return results;
}

export async function getMonthlyExpenseTotals(
  db: SQLiteDatabase,
  months: Array<{ month: number; year: number }>,
): Promise<Array<{ month: number; year: number; total: number }>> {
  const results: Array<{ month: number; year: number; total: number }> = [];
  for (const { month, year } of months) {
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE month = ? AND year = ?',
      [month, year],
    );
    results.push({ month, year, total: row?.total ?? 0 });
  }
  return results;
}
