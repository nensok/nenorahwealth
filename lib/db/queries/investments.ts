import type { SQLiteDatabase } from 'expo-sqlite';
import type { Investment } from '@/types';

interface RawInvestment {
  id: number;
  stock_name: string;
  ticker: string | null;
  quantity: number;
  buy_price: number;
  current_price: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToInvestment(row: RawInvestment): Investment {
  return {
    id: row.id,
    stockName: row.stock_name,
    ticker: row.ticker ?? undefined,
    quantity: row.quantity,
    buyPrice: row.buy_price,
    currentPrice: row.current_price,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAllInvestments(db: SQLiteDatabase): Promise<Investment[]> {
  const rows = await db.getAllAsync<RawInvestment>(
    'SELECT * FROM investments ORDER BY stock_name ASC',
  );
  return rows.map(rowToInvestment);
}

export async function getInvestmentById(db: SQLiteDatabase, id: number): Promise<Investment | null> {
  const row = await db.getFirstAsync<RawInvestment>('SELECT * FROM investments WHERE id = ?', [id]);
  return row ? rowToInvestment(row) : null;
}

export async function insertInvestment(
  db: SQLiteDatabase,
  data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO investments (stock_name, ticker, quantity, buy_price, current_price, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [data.stockName, data.ticker ?? null, data.quantity, data.buyPrice, data.currentPrice, data.notes ?? null],
  );
  return result.lastInsertRowId;
}

export async function updateInvestment(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  const fields: string[] = ['updated_at = datetime(\'now\')'];
  const values: unknown[] = [];
  if (data.stockName !== undefined) { fields.push('stock_name = ?'); values.push(data.stockName); }
  if (data.ticker !== undefined) { fields.push('ticker = ?'); values.push(data.ticker ?? null); }
  if (data.quantity !== undefined) { fields.push('quantity = ?'); values.push(data.quantity); }
  if (data.buyPrice !== undefined) { fields.push('buy_price = ?'); values.push(data.buyPrice); }
  if (data.currentPrice !== undefined) { fields.push('current_price = ?'); values.push(data.currentPrice); }
  if (data.notes !== undefined) { fields.push('notes = ?'); values.push(data.notes ?? null); }
  values.push(id);
  await db.runAsync(`UPDATE investments SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteInvestment(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM investments WHERE id = ?', [id]);
}
