import { Stack } from 'expo-router';

export default function IncomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="add" options={{ title: 'Add Income', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Income' }} />
    </Stack>
  );
}
