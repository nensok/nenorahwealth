import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { monthYearLabel, getCurrentMonthYear } from '@/lib/utils/date';

interface MonthPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthPicker({ month, year, onChange }: MonthPickerProps) {
  const colors = useColors();
  const current = getCurrentMonthYear();
  const isCurrentMonth = month === current.month && year === current.year;

  function prev() {
    if (month === 1) onChange(12, year - 1);
    else onChange(month - 1, year);
  }

  function next() {
    if (isCurrentMonth) return;
    if (month === 12) onChange(1, year + 1);
    else onChange(month + 1, year);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
      <Pressable onPress={prev} style={styles.arrow} hitSlop={12}>
        <MaterialIcons name="chevron-left" size={22} color={colors.accent} />
      </Pressable>
      <Text style={[styles.label, { color: colors.text }]}>
        {monthYearLabel(month, year)}
      </Text>
      <Pressable
        onPress={next}
        style={[styles.arrow, isCurrentMonth && styles.disabled]}
        disabled={isCurrentMonth}
        hitSlop={12}
      >
        <MaterialIcons name="chevron-right" size={22} color={isCurrentMonth ? colors.muted : colors.accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  arrow: { padding: 4, width: 36, alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },
  disabled: { opacity: 0.3 },
});
