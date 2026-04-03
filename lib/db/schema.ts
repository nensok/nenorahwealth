export const SQL_SCHEMA_VERSION = `
  CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER NOT NULL
  )
`;

export const SQL_SETTINGS = `
  CREATE TABLE IF NOT EXISTS settings (
    id              INTEGER PRIMARY KEY NOT NULL,
    user_name       TEXT    NOT NULL DEFAULT '',
    currency_symbol TEXT    NOT NULL DEFAULT '₦',
    onboarding_done INTEGER NOT NULL DEFAULT 0,
    theme           TEXT    NOT NULL DEFAULT 'dark',
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_CATEGORIES = `
  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    color      TEXT    NOT NULL DEFAULT '#0a7ea4',
    icon       TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_INCOME = `
  CREATE TABLE IF NOT EXISTS income (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    amount     REAL    NOT NULL,
    source     TEXT    NOT NULL,
    month      INTEGER NOT NULL,
    year       INTEGER NOT NULL,
    notes      TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_EXPENSES = `
  CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    amount      REAL    NOT NULL,
    category_id INTEGER NOT NULL,
    description TEXT    NOT NULL DEFAULT '',
    date        TEXT    NOT NULL,
    month       INTEGER NOT NULL,
    year        INTEGER NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_INVESTMENTS = `
  CREATE TABLE IF NOT EXISTS investments (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_name    TEXT NOT NULL,
    ticker        TEXT,
    quantity      REAL NOT NULL,
    buy_price     REAL NOT NULL,
    current_price REAL NOT NULL,
    notes         TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_income_year_month   ON income(year, month)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_year_month ON expenses(year, month)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category_id)`,
];

export const CURRENT_SCHEMA_VERSION = 3;
