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

export const SQL_BUDGETS = `
  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    amount      REAL    NOT NULL,
    month       INTEGER NOT NULL,
    year        INTEGER NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(category_id, month, year)
  )
`;

export const SQL_RECURRING = `
  CREATE TABLE IF NOT EXISTS recurring_transactions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    type          TEXT    NOT NULL,
    amount        REAL    NOT NULL,
    title         TEXT    NOT NULL,
    category_id   INTEGER,
    frequency     TEXT    NOT NULL,
    next_due_date TEXT    NOT NULL,
    active        INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_INVESTMENT_TRANSACTIONS = `
  CREATE TABLE IF NOT EXISTS investment_transactions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    type          TEXT    NOT NULL,
    quantity      REAL    NOT NULL,
    price         REAL    NOT NULL,
    date          TEXT    NOT NULL,
    notes         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`;

export const SQL_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_income_year_month   ON income(year, month)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_year_month ON expenses(year, month)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_year_month  ON budgets(year, month)`,
  `CREATE INDEX IF NOT EXISTS idx_inv_tx_investment   ON investment_transactions(investment_id)`,
];

export const CURRENT_SCHEMA_VERSION = 6;
