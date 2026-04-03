import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { closeDb, getDb } from '@/lib/db/client';
import { runMigrations } from '@/lib/db/migrations';

const DB_NAME = 'nonorahwealth.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

export async function backupDatabase(): Promise<void> {
  const dateStr = new Date().toISOString().split('T')[0];
  const backupName = `NenorahWealth_backup_${dateStr}.db`;
  const backupPath = `${FileSystem.documentDirectory}${backupName}`;

  const info = await FileSystem.getInfoAsync(DB_PATH);
  if (!info.exists) throw new Error('Database file not found');

  await FileSystem.copyAsync({ from: DB_PATH, to: backupPath });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(backupPath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Save Database Backup',
    });
  }
}

/**
 * Opens the document picker and returns the picked file URI,
 * or null if the user cancelled. Call this BEFORE showing any
 * confirmation Alert — on Android, triggering a picker from
 * inside an Alert callback is unreliable.
 */
export async function pickBackupFile(): Promise<string | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: '*/*',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return result.assets[0].uri;
}

/**
 * Overwrites the current database with the file at pickedUri,
 * then reopens and remigrates. Calls onComplete (awaited) when done.
 */
export async function restoreDatabase(
  pickedUri: string,
  onComplete: () => Promise<void>,
): Promise<void> {
  // Close DB before overwriting the file
  await closeDb();

  // Ensure SQLite directory exists
  const sqliteDir = `${FileSystem.documentDirectory}SQLite`;
  const dirInfo = await FileSystem.getInfoAsync(sqliteDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(sqliteDir, { intermediates: true });
  }

  await FileSystem.copyAsync({ from: pickedUri, to: DB_PATH });

  // Reopen and remigrate to ensure schema is current
  const db = await getDb();
  await runMigrations(db);

  await onComplete();
}
