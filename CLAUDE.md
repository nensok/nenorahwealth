# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start dev server
npm run android    # Android
npm run ios        # iOS
npm run web        # Web
npm run lint       # ESLint
```

No test runner is configured.

## Architecture

**NenorahWealth** — offline-first personal finance app (Expo SDK 54, React Native 0.81.5, TypeScript strict, React Compiler on, New Architecture on).

### Key constraints
- **expo-sqlite SDK 54 async API only**: use `openDatabaseAsync`, `getAllAsync`, `runAsync`. Never use legacy sync `openDatabase`.
- **Typed routes enabled**: all `router.replace()` / `<Link href>` strings are type-checked.
- **React Compiler on**: do not add `useMemo`/`useCallback` manually.
- **Zustand v5**: plain `create()`, no immer.

### Routing & auth flow

`app/_layout.tsx` is the auth gate — it initializes the DB, reads settings, checks for a PIN, then redirects:
- No onboarding done → `/(onboarding)/welcome`
- No PIN set → `/(auth)/pin-setup`
- PIN exists → `/(auth)/pin-entry` → on success → `/(tabs)`

Route groups:
```
app/
├── (auth)/        pin-entry, pin-setup
├── (onboarding)/  welcome, initial-income
├── (tabs)/        index (Dashboard), income, expenses, investments, settings
├── income/        add, [id]
├── expenses/      add, [id]
├── investments/   add, [id]
├── categories/    index, add
├── export.tsx
└── backup.tsx
```

### Data layer

`lib/db/client.ts` — singleton `getDb()` / `closeDb()` via `openDatabaseAsync('nonorahwealth.db')`.

`lib/db/migrations.ts` — `runMigrations(db)` creates all tables, seeds default categories, records schema version. Called once on startup from `app-store.initializeDb()`.

`lib/db/queries/` — one file per table (`settings`, `categories`, `income`, `expenses`, `investments`). All query functions accept `db` as first argument. Use `snake_case → camelCase` row mappers.

### State (Zustand stores)

| File | Purpose |
|------|---------|
| `stores/app-store.ts` | DB init, settings (user name, currency symbol, onboarding flag) |
| `stores/auth-store.ts` | PIN auth state, lock/unlock, inactivity timer state |
| `stores/income-store.ts` | Income records for the viewed month |
| `stores/expense-store.ts` | Expense records for the viewed month |
| `stores/category-store.ts` | All categories (loaded once) |
| `stores/investment-store.ts` | All investment positions |

Computed values (`balance`, `portfolioValue`, `profitLoss`) are **never stored** — always derived via `lib/utils/calculations.ts`.

### Theming

`constants/theme.ts` exports `Colors` with `light` and `dark` objects. Fintech-specific tokens added: `surface`, `positive` (green), `negative` (red), `muted`, `border`.

All screens read colors via `const colors = Colors[useColorScheme() ?? 'light']` — do not use `useThemeColor()` hook in new screens.

### Inactivity lock

`hooks/use-inactivity-lock.ts` — subscribed to `AppState` changes in `app/(tabs)/_layout.tsx`. If the app is backgrounded for ≥5 min and a PIN is set, it calls `authStore.lock()` and redirects to pin-entry.

### Export & backup

- `lib/export/excel.ts` — builds xlsx workbook (3 sheets), writes base64 to `FileSystem.documentDirectory`, shares via `expo-sharing`.
- `lib/export/backup.ts` — copies `SQLite/nonorahwealth.db` for backup; for restore, closes the DB, copies picked file over it, reopens and remigrates.

### Platform-specific files

`.ios.tsx` is preferred over `.tsx` on iOS (e.g. `components/ui/icon-symbol.ios.tsx` uses native SF Symbols; `.tsx` falls back to MaterialIcons).

`@/*` resolves to the repo root.
