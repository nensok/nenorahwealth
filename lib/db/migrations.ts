import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { SQLiteDatabase } from "expo-sqlite";
import {
  CURRENT_SCHEMA_VERSION,
  SQL_BUDGETS,
  SQL_CATEGORIES,
  SQL_EXPENSES,
  SQL_INCOME,
  SQL_INDEXES,
  SQL_INVESTMENTS,
  SQL_INVESTMENT_TRANSACTIONS,
  SQL_RECURRING,
  SQL_SCHEMA_VERSION,
  SQL_SETTINGS,
} from "./schema";

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  // The _initDbPromise mutex in app-store.ts guarantees this runs only once at a time.

  await db.execAsync(SQL_SCHEMA_VERSION);

  const versionRow = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_version LIMIT 1",
  );
  const currentVersion = versionRow?.version ?? 0;

  if (currentVersion >= CURRENT_SCHEMA_VERSION) return;

  // ── v0 → v1: initial schema ──────────────────────────────────────────────
  if (currentVersion < 1) {
    for (const sql of [SQL_SETTINGS, SQL_CATEGORIES, SQL_INCOME, SQL_EXPENSES, SQL_INVESTMENTS, ...SQL_INDEXES]) {
      await db.execAsync(sql);
    }
    await db.runAsync(
      `INSERT OR IGNORE INTO settings (id, user_name, currency_symbol, onboarding_done) VALUES (1, '', '₦', 0)`,
    );
    for (const cat of DEFAULT_CATEGORIES) {
      await db.runAsync(
        `INSERT INTO categories (name, color, icon, is_default) VALUES (?, ?, ?, 1)`,
        [cat.name, cat.color, cat.icon],
      );
    }
  }

  // ── v1 → v2: ensure investments table exists ─────────────────────────────
  if (currentVersion < 2) {
    await db.execAsync(SQL_INVESTMENTS);
  }

  // ── v2 → v3: add theme column to settings ────────────────────────────────
  if (currentVersion < 3) {
    try {
      await db.execAsync(`ALTER TABLE settings ADD COLUMN theme TEXT NOT NULL DEFAULT 'dark'`);
    } catch {
      // Column may already exist on fresh installs — safe to ignore
    }
  }

  // ── v3 → v4: budgets table ────────────────────────────────────────────────
  if (currentVersion < 4) {
    await db.execAsync(SQL_BUDGETS);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_budgets_year_month ON budgets(year, month)`);
  }

  // ── v4 → v5: recurring transactions ──────────────────────────────────────
  if (currentVersion < 5) {
    await db.execAsync(SQL_RECURRING);
  }

  // ── v5 → v6: investment transactions ─────────────────────────────────────
  if (currentVersion < 6) {
    await db.execAsync(SQL_INVESTMENT_TRANSACTIONS);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_inv_tx_investment ON investment_transactions(investment_id)`);
  }

  // ── v6 → v7: rename default category "Giving" → "Gift" ───────────────────
  if (currentVersion < 7) {
    await db.runAsync(
      `UPDATE categories SET name = 'Gift' WHERE name = 'Giving' AND is_default = 1`,
    );
  }

  // Stamp the new version (clear any stale rows first)
  await db.execAsync("DELETE FROM schema_version");
  await db.runAsync(`INSERT INTO schema_version (version) VALUES (?)`, [CURRENT_SCHEMA_VERSION]);
}
