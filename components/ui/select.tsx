import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SelectOption {
  label: string;
  value: number | string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  value: number | string;
  onChange: (value: number | string) => void;
  error?: string;
}

export function Select({ label, options, value, onChange, error }: SelectProps) {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme];

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={[styles.label, { color: colors.muted }]}>{label}</Text> : null}
      <View
        style={[
          styles.pickerWrapper,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.negative : colors.border,
          },
        ]}
      >
        <Picker
          selectedValue={value}
          onValueChange={(v) => onChange(v)}
          style={{ color: colors.text }}
          dropdownIconColor={colors.muted}
        >
          {options.map((opt) => (
            <Picker.Item key={String(opt.value)} label={opt.label} value={opt.value} />
          ))}
        </Picker>
      </View>
      {error ? <Text style={[styles.error, { color: colors.negative }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  pickerWrapper: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 48,
    justifyContent: 'center',
  },
  error: { fontSize: 12 },
});
