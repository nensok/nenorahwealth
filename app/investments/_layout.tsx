import { Stack } from 'expo-router';

export default function InvestmentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="add" options={{ title: 'Add Position', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Edit Position' }} />
    </Stack>
  );
}
