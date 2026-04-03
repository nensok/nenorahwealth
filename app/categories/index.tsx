import { useEffect } from 'react';
import { View, FlatList, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useCategoryStore } from '@/stores/category-store';
import type { Category } from '@/types';

export default function CategoriesScreen() {
  const colors = useColors();
  const categories = useCategoryStore((s) => s.categories);
  const load = useCategoryStore((s) => s.load);
  const remove = useCategoryStore((s) => s.remove);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDelete(cat: Category) {
    if (cat.isDefault) {
      Alert.alert('Cannot delete', 'Default categories cannot be deleted.');
      return;
    }
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const result = await remove(cat.id);
          if (!result.success) Alert.alert('Cannot delete', result.reason);
        },
      },
    ]);
  }

  function renderItem({ item }: { item: Category }) {
    return (
      <View style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        {item.isDefault ? (
          <View style={[styles.badge, { backgroundColor: colors.surfaceElevated }]}>
            <Text style={[styles.badgeText, { color: colors.muted }]}>Default</Text>
          </View>
        ) : (
          <Pressable onPress={() => handleDelete(item)} hitSlop={12} style={[styles.deleteBtn, { backgroundColor: colors.negative + '20' }]}>
            <MaterialIcons name="delete-outline" size={18} color={colors.negative} />
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/categories/add')}
      >
        <MaterialIcons name="add" size={28} color="#000" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  badgeText: { fontSize: 12, fontWeight: '500' },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#AAFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
