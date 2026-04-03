import type { SQLiteDatabase } from 'expo-sqlite';
import type { Income } from '@/types';

interface RawIncome {
  id: number;
  amount: number;
  source: string;
  month: number;
  year: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToIncome(row: RawIncome): Income {
  return {
    id: row.id,
    amount: row.amount,
    source: row.source,
    month: row.month,
    year: row.year,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getIncomeByMonth(
  db: SQLiteDatabase,
  month: number,
  year: number,
): Promise<Income[]> {
  const rows = await db.getAllAsync<RawIncome>(
    'SELECT * FROM income WHERE month = ? AND year = ? ORDER BY created_at DESC',
    [month, year],
  );
  return rows.map(rowToIncome);
}

export async function getAllIncome(db: SQLiteDatabase): Promise<Income[]> {
  const rows = await db.getAllAsync<RawIncome>(
    'SELECT * FROM income ORDER BY year DESC, month DESC, created_at DESC',
  );
  return rows.map(rowToIncome);
}

export async function getIncomeById(db: SQLiteDatabase, id: number): Promise<Income | null> {
  const row = await db.getFirstAsync<RawIncome>('SELECT * FROM income WHERE id = ?', [id]);
  return row ? rowToIncome(row) : null;
}

export async function insertIncome(
  db: SQLiteDatabase,
  data: Omit<Income, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO income (amount, source, month, year, notes) VALUES (?, ?, ?, ?, ?)',
    [data.amount, data.source, data.month, data.year, data.notes ?? null],
  );
  return result.lastInsertRowId;
}

export async function updateIncome(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Omit<Income, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const values: unknown[] = [];
  if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
  if (data.source !== undefined) { fields.push('source = ?'); values.push(data.source); }
  if (data.month !== undefined) { fields.push('month = ?'); values.push(data.month); }
  if (data.year !== undefined) { fields.push('year = ?'); values.push(data.year); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes ?? null); }
  values.push(id);
  await db.runAsync(`UPDATE income SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteIncome(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM income WHERE id = ?', [id]);
}

export async function getMonthlyIncomeTotals(
  db: SQLiteDatabase,
  months: Array<{ month: number; year: number }>,
): Promise<Array<{ month: number; year: number; total: number }>> {
  const results: Array<{ month: number; year: number; total: number }> = [];
  for (const { month, year } of months) {
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE month = ? AND year = ?',
      [month, year],
    );
    results.push({ month, year, total: row?.total ?? 0 });
  }
  return results;
}
