import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '@/types';

interface RawCategory {
  id: number;
  name: string;
  color: string;
  icon: string | null;
  is_default: number;
  created_at: string;
}

function rowToCategory(row: RawCategory): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    isDefault: row.is_default === 1,
    createdAt: row.created_at,
  };
}

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<RawCategory>(
    'SELECT * FROM categories ORDER BY is_default DESC, name ASC',
  );
  return rows.map(rowToCategory);
}

export async function getCategoryById(db: SQLiteDatabase, id: number): Promise<Category | null> {
  const row = await db.getFirstAsync<RawCategory>('SELECT * FROM categories WHERE id = ?', [id]);
  return row ? rowToCategory(row) : null;
}

export async function insertCategory(
  db: SQLiteDatabase,
  data: { name: string; color: string; icon?: string },
): Promise<number> {
  const result = await db.runAsync(
    'INSERT INTO categories (name, color, icon, is_default) VALUES (?, ?, ?, 0)',
    [data.name, data.color, data.icon ?? null],
  );
  return result.lastInsertRowId;
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: number,
  data: { name?: string; color?: string; icon?: string },
): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
  if (data.color !== undefined) { fields.push('color = ?'); values.push(data.color); }
  if (data.icon !== undefined) { fields.push('icon = ?'); values.push(data.icon); }
  if (fields.length === 0) return;
  values.push(id);
  await db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
}

export async function deleteCategory(db: SQLiteDatabase, id: number): Promise<void> {
  await db.runAsync('DELETE FROM categories WHERE id = ? AND is_default = 0', [id]);
}

export async function isCategoryReferenced(db: SQLiteDatabase, id: number): Promise<boolean> {
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM expenses WHERE category_id = ?',
    [id],
  );
  return (row?.count ?? 0) > 0;
}
