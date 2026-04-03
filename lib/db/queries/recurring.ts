import type { SQLiteDatabase } from 'expo-sqlite';
import type { RecurringTransaction } from '@/types';

interface RawRecurring {
  id: number;
  type: string;
  amount: number;
  title: string;
  category_id: number | null;
  frequency: string;
  next_due_date: string;
  active: number;
  created_at: string;
}

function rowToRecurring(row: RawRecurring): RecurringTransaction {
  return {
    id: row.id,
    type: row.type as 'income' | 'expense',
    amount: row.amount,
    title: row.title,
    categoryId: row.category_id ?? undefined,
    frequency: row.frequency as 'weekly' | 'monthly' | 'yearly',
    nextDueDate: row.next_due_date,
    active: row.active === 1,
    createdAt: row.created_at,
  };
}

function addPeriod(date: string, frequency: 'weekly' | 'monthly' | 'yearly'): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (frequency === 'weekly') {
    dt.setDate(dt.getDate() + 7);
  } else if (frequency === 'monthly') {
    dt.setMonth(dt.getMonth() + 1);
  } else {
    dt.setFullYear(dt.getFullYear() + 1);
  }
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

export async function getAllRecurring(db: SQLiteDatabase): Promise<RecurringTransaction[]> {
  const rows = await db.getAllAsync<RawRecurring>(
    'SELECT * FROM recurring_transactions ORDER BY created_at DESC',
  );
  return rows.map(rowToRecurring);
}

export async function insertRecurring(
  db: SQLiteDatabase,
  data: Omit<RecurringTransaction, 'id' | 'createdAt'>,
): Promise<number> {
  const result = await db.runAsync(
    `INSERT INTO recurring_transactions (type, amount, title, category_id, frequency, next_due_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.type,
      data.amount,
      data.title,
      data.categoryId ?? null,
      data.frequency,
      data.nextDueDate,
      data.active ? 1 : 0,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateRecurring(
  db: SQLiteDatabase,
  id: number,
  data: Partial<Omit<RecurringTransaction, 'id' | 'createdAt'>>,
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.amount !== undefined) { fields.push('amount = ?'); values.push(data.amount); }
  if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
  if (data.categoryId !== undefined) { fields.push('category_id = ?'); values.push(data.categoryId ?? null); }
  if (data.frequency !== undefined) { fields.push('frequency = ?'); values.push(data.frequency); }
  if (data.nextDueDate !== undefined) { fields.push('next_due_date = ?'); values.push(data.nextDueDate); }
  if (data.active !== undefined) { fields.push('active = ?'); values.push(data.active ? 1 : 0); }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE recurring_transactions SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteRecurring(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM recurring_transactions WHERE id = ?', [id]);
}

export async function getRecurringById(
  db: SQLiteDatabase,
  id: number,
): Promise<RecurringTransaction | null> {
  const row = await db.getFirstAsync<RawRecurring>(
    'SELECT * FROM recurring_transactions WHERE id = ?',
    [id],
  );
  return row ? rowToRecurring(row) : null;
}

/**
 * Finds all active recurring transactions due on or before today,
 * generates the corresponding income/expense records, and advances next_due_date.
 * Returns the number of records generated.
 */
export async function processDueRecurring(
  db: SQLiteDatabase,
  defaultCategoryId: number,
): Promise<number> {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const dueRows = await db.getAllAsync<RawRecurring>(
    `SELECT * FROM recurring_transactions WHERE active = 1 AND next_due_date <= ?`,
    [todayStr],
  );

  let count = 0;
  for (const row of dueRows) {
    const r = rowToRecurring(row);
    let dueDate = r.nextDueDate;

    // Process all overdue occurrences
    while (dueDate <= todayStr) {
      const [y, m] = dueDate.split('-').map(Number);

      if (r.type === 'income') {
        await db.runAsync(
          'INSERT INTO income (amount, source, month, year) VALUES (?, ?, ?, ?)',
          [r.amount, r.title, m, y],
        );
      } else {
        const catId = r.categoryId ?? defaultCategoryId;
        await db.runAsync(
          'INSERT INTO expenses (amount, category_id, description, date, month, year) VALUES (?, ?, ?, ?, ?, ?)',
          [r.amount, catId, r.title, dueDate, m, y],
        );
      }

      dueDate = addPeriod(dueDate, r.frequency);
      count++;
    }

    await db.runAsync(
      'UPDATE recurring_transactions SET next_due_date = ? WHERE id = ?',
      [dueDate, r.id],
    );
  }

  return count;
}
