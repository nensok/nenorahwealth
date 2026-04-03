import type { SQLiteDatabase } from 'expo-sqlite';
import type { InvestmentTransaction } from '@/types';

interface RawInvTx {
  id: number;
  investment_id: number;
  type: string;
  quantity: number;
  price: number;
  date: string;
  notes: string | null;
  created_at: string;
}

function rowToTx(row: RawInvTx): InvestmentTransaction {
  return {
    id: row.id,
    investmentId: row.investment_id,
    type: row.type as 'buy' | 'sell',
    quantity: row.quantity,
    price: row.price,
    date: row.date,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getTransactionsByInvestment(
  db: SQLiteDatabase,
  investmentId: number,
): Promise<InvestmentTransaction[]> {
  const rows = await db.getAllAsync<RawInvTx>(
    'SELECT * FROM investment_transactions WHERE investment_id = ? ORDER BY date DESC, created_at DESC',
    [investmentId],
  );
  return rows.map(rowToTx);
}

export async function insertInvestmentTransaction(
  db: SQLiteDatabase,
  data: Omit<InvestmentTransaction, 'id' | 'createdAt'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO investment_transactions (investment_id, type, quantity, price, date, notes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.investmentId, data.type, data.quantity, data.price, data.date, data.notes ?? null],
  );
  return result.lastInsertRowId;
}

export async function deleteInvestmentTransaction(
  db: SQLiteDatabase,
  id: number,
): Promise<void> {
  await db.runAsync('DELETE FROM investment_transactions WHERE id = ?', [id]);
}
