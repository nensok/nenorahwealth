import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;
// Single shared promise prevents concurrent callers from opening the DB more than once
let _initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  if (!_initPromise) {
    _initPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('nonorahwealth.db');
      // Set WAL mode + busy timeout. On hot reloads in development a stale native
      // connection may hold the WAL lock for a short time — retry with backoff.
      // If all retries fail (extreme case) we still continue; the app will work,
      // it just falls back to rollback-journal mode for this session.
      for (let i = 0; i < 5; i++) {
        try {
          await db.execAsync('PRAGMA busy_timeout=5000;');
          await db.execAsync('PRAGMA journal_mode=WAL;');
          break;
        } catch {
          if (i < 4) await sleep((i + 1) * 300);
        }
      }
      _db = db;
      return db;
    })();
  }
  return _initPromise;
}

export async function closeDb(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
    _initPromise = null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
