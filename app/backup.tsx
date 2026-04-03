import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useColors } from '@/hooks/use-colors';
import { useIncomeStore } from '@/stores/income-store';
import { useExpenseStore } from '@/stores/expense-store';
import { useCategoryStore } from '@/stores/category-store';
import { useInvestmentStore } from '@/stores/investment-store';
import { useAppStore } from '@/stores/app-store';
import { backupDatabase, pickBackupFile, restoreDatabase } from '@/lib/export/backup';
import { getCurrentMonthYear } from '@/lib/utils/date';

export default function BackupScreen() {
  const colors = useColors();
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const { month, year } = getCurrentMonthYear();
  const loadIncome = useIncomeStore((s) => s.loadByMonth);
  const loadExpenses = useExpenseStore((s) => s.loadByMonth);
  const loadCategories = useCategoryStore((s) => s.load);
  const loadInvestments = useInvestmentStore((s) => s.load);
  const loadSettings = useAppStore((s) => s.loadSettings);

  async function handleBackup() {
    setBackupLoading(true);
    try {
      await backupDatabase();
    } catch (e) {
      Alert.alert('Backup Failed', String(e));
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleRestore() {
    // Pick the file FIRST — before any Alert — so the picker opens reliably on Android
    let pickedUri: string | null = null;
    try {
      pickedUri = await pickBackupFile();
    } catch (e) {
      Alert.alert('Error', 'Could not open file picker. ' + String(e));
      return;
    }

    if (!pickedUri) return; // user cancelled

    // Now confirm with the user
    Alert.alert(
      'Restore from Backup',
      'This will replace all current data with the selected backup file. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setRestoreLoading(true);
            try {
              await restoreDatabase(pickedUri as string, async () => {
                await loadSettings();
                await loadCategories();
                await loadIncome(month, year);
                await loadExpenses(month, year);
                await loadInvestments();
              });
              Alert.alert('Restore Complete', 'Your data has been restored successfully.');
            } catch (e) {
              Alert.alert('Restore Failed', String(e));
            } finally {
              setRestoreLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.title, { color: colors.text }]}>Backup</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            Save a copy of your database file. Share it via email, cloud storage, or any other app.
          </Text>
          <Button label="Create Backup" onPress={handleBackup} loading={backupLoading} style={styles.btn} />
        </Card>

        <Card>
          <Text style={[styles.title, { color: colors.text }]}>Restore</Text>
          <Text style={[styles.desc, { color: colors.muted }]}>
            Restore from a previous backup file (.db). All current data will be replaced.
          </Text>
          <Button
            label="Import Backup File"
            onPress={handleRestore}
            loading={restoreLoading}
            variant="secondary"
            style={styles.btn}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  btn: {},
});
