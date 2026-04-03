import type { SQLiteDatabase } from 'expo-sqlite';
import type { Settings } from '@/types';

interface RawSettings {
  id: number;
  user_name: string;
  currency_symbol: string;
  onboarding_done: number;
  theme: string;
}

function rowToSettings(row: RawSettings): Settings {
  return {
    id: 1,
    userName: row.user_name,
    currencySymbol: row.currency_symbol,
    onboardingDone: row.onboarding_done === 1,
    theme: (row.theme === 'light' ? 'light' : 'dark') as 'light' | 'dark',
  };
}

export async function getSettings(db: SQLiteDatabase): Promise<Settings | null> {
  const row = await db.getFirstAsync<RawSettings>(
    'SELECT * FROM settings WHERE id = 1',
  );
  return row ? rowToSettings(row) : null;
}

export async function updateSettings(
  db: SQLiteDatabase,
  data: Partial<Omit<Settings, 'id'>>,
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.userName !== undefined) { fields.push('user_name = ?'); values.push(data.userName); }
  if (data.currencySymbol !== undefined) { fields.push('currency_symbol = ?'); values.push(data.currencySymbol); }
  if (data.onboardingDone !== undefined) { fields.push('onboarding_done = ?'); values.push(data.onboardingDone ? 1 : 0); }
  if (data.theme !== undefined) { fields.push('theme = ?'); values.push(data.theme); }

  if (fields.length === 0) return;
  values.push(1); // WHERE id = 1

  await db.runAsync(
    `UPDATE settings SET ${fields.join(', ')} WHERE id = ?`,
    values,
  );
}
