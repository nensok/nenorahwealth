# NenorahWealth

A modern, offline-first personal finance app built with Expo and React Native. Track income, expenses, and investments — all stored locally on your device with no backend or internet connection required.

---

## Features

- **Dashboard** — Animated debit-card balance widget, spending breakdown donut chart, 6-month income vs expense trend line, time-based greeting
- **Income tracking** — Log earnings by month with source and notes
- **Expense tracking** — Categorised expenses with color-coded categories and a native date picker
- **Investments** — Portfolio tracker with live P&L, buy price vs current price, gold credit-card style summary card
- **Excel export** — One-tap monthly report exported as a 3-sheet `.xlsx` file (Income, Expenses, Summary) shared via the native share sheet
- **Backup & Restore** — Full SQLite database backup shared as a `.db` file; restore by importing any previous backup
- **PIN security** — 4-digit PIN lock on app open with configurable inactivity auto-lock (5 min)
- **Light / Dark mode** — Toggle in Settings; preference persisted to the database
- **Offline-first** — All data lives in a local SQLite database; no account or internet required

---

## Tech Stack

| Layer | Library |
|-------|---------|
| Framework | Expo SDK 55 / React Native 0.83 |
| Navigation | Expo Router (typed routes) |
| Database | expo-sqlite (async API, WAL mode) |
| State | Zustand v5 |
| Forms | react-hook-form |
| Charts | react-native-svg (custom SVG area + donut charts) |
| Animations | react-native-reanimated v4 |
| Excel export | xlsx 0.18.5 |
| PIN auth | expo-secure-store |

---

## Project Structure

```
app/
├── (auth)/          # PIN entry & setup screens
├── (onboarding)/    # First-run name + currency setup
├── (tabs)/          # Main tab screens (Dashboard, Income, Expenses, Investments, Settings)
├── income/          # Add / Edit income screens
├── expenses/        # Add / Edit expense screens
├── investments/     # Add / Edit investment screens
├── categories/      # Category management
├── export.tsx       # Excel export screen
└── backup.tsx       # Backup & restore screen

lib/
├── db/              # SQLite client, schema, migrations, per-table query functions
├── export/          # Excel builder and backup/restore logic
└── utils/           # Currency formatting, date helpers, financial calculations

stores/              # Zustand stores — app, auth, income, expense, investment, category
components/
├── charts/          # Custom SVG charts (spending donut, 6-month trend line)
├── forms/           # react-hook-form controlled forms
└── ui/              # Reusable UI primitives (Button, Input, Card, PinPad, ListItem …)
hooks/               # useColors, useAnimatedNumber, useInactivityLock
constants/           # Theme color palettes, default category seeds
types/               # Shared TypeScript interfaces
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Android Studio (Android) or Xcode (iOS)

### Install & run

```bash
git clone https://github.com/nensok/nenorahwealth.git
cd nenorahwealth
npm install

npm run android    # Android
npm run ios        # iOS
npm run web        # Browser
```

### Lint

```bash
npm run lint
```

---

## Database

The app uses a local SQLite database (`nonorahwealth.db`) with the following tables:

| Table | Description |
|-------|-------------|
| `settings` | Singleton — user name, currency symbol, theme, onboarding flag |
| `categories` | Expense categories with name, color, and icon |
| `income` | Income records indexed by `(year, month)` |
| `expenses` | Expense records indexed by `(year, month)` and `category_id` |
| `investments` | Investment positions with buy price and current price |
| `schema_version` | Tracks applied migration version |

Migrations run automatically on every startup via `lib/db/migrations.ts`. Current schema version: **3**.

---

## Architecture Notes

- **No backend** — `expo-sqlite` with WAL journal mode and `busy_timeout = 5000 ms` ensures reliable concurrent access during development hot-reloads
- **Single DB connection** — Module-level promise mutex in `lib/db/client.ts` prevents concurrent `openDatabaseAsync` calls
- **Computed values never stored** — Balance, portfolio value, and P&L are always derived at render time; never persisted
- **React Compiler enabled** — Manual `useMemo` / `useCallback` are not used
- **Theme hook** — `useColors()` reads `settings.theme` from the Zustand store and returns the matching palette from `constants/theme.ts`, making every component reactively theme-aware

---

## License

MIT
