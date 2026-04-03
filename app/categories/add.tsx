import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { useCategoryStore } from '@/stores/category-store';

const PRESET_COLORS = [
  // Reds & pinks
  '#EF4444', '#F43F5E', '#E11D48', '#FB7185',
  // Oranges & yellows
  '#F97316', '#FB923C', '#EAB308', '#FBBF24',
  // Greens
  '#22C55E', '#10B981', '#14B8A6', '#84CC16',
  // Blues
  '#3B82F6', '#06B6D4', '#0EA5E9', '#38BDF8',
  // Purples & indigos
  '#8B5CF6', '#6366F1', '#A855F7', '#C084FC',
  // Rose & accent
  '#EC4899', '#F472B6', '#AAFF00', '#D946EF',
];

export default function AddCategoryScreen() {
  const colors = useColors();
  const add = useCategoryStore((s) => s.add);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!name.trim()) { setNameError('Name is required'); return; }
    setLoading(true);
    await add(name.trim(), selectedColor);
    setLoading(false);
    router.back();
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Input
          label="Category Name"
          placeholder="e.g. Entertainment"
          value={name}
          onChangeText={(v) => { setName(v); setNameError(''); }}
          error={nameError}
          autoFocus
        />

        <View>
          <Text style={[styles.colorLabel, { color: colors.muted }]}>Color</Text>
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => (
              <View
                key={color}
                onTouchEnd={() => setSelectedColor(color)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color },
                  selectedColor === color && styles.swatchSelected,
                ]}
              />
            ))}
          </View>
        </View>

        <Button label="Add Category" onPress={handleSave} loading={loading} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 24 },
  colorLabel: { fontSize: 13, fontWeight: '500', marginBottom: 10 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorSwatch: { width: 44, height: 44, borderRadius: 22 },
  swatchSelected: { borderWidth: 3, borderColor: '#fff', transform: [{ scale: 1.18 }] },
});
