import { Stack } from 'expo-router';

export default function CategoriesLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Categories' }} />
      <Stack.Screen name="add" options={{ title: 'Add Category', presentation: 'modal' }} />
    </Stack>
  );
}
