import { Stack } from 'expo-router';

export default function ExpensesLayout() {
  return (
    <Stack>
      <Stack.Screen name="add" options={{ title: 'Add Expense', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Expense' }} />
    </Stack>
  );
}
