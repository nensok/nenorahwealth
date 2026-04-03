import { useState } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Platform } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';

interface DateFieldProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
}

export function DateField({ label, value, onChange, error, maximumDate, minimumDate }: DateFieldProps) {
  const colors = useColors();
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(value);

  const display = value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  function handleAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    setShow(false);
    if (event.type === 'set' && selected) onChange(selected);
  }

  function handleIOSChange(_event: DateTimePickerEvent, selected?: Date) {
    if (selected) setPending(selected);
  }

  function confirmIOS() {
    onChange(pending);
    setShow(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>

      <Pressable
        onPress={() => { setPending(value); setShow(true); }}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: colors.surface, borderColor: error ? colors.negative : colors.border },
          pressed && { borderColor: colors.accent },
        ]}
      >
        <Text style={[styles.value, { color: colors.text }]}>{display}</Text>
        <MaterialIcons name="calendar-today" size={18} color={colors.muted} />
      </Pressable>

      {error ? <Text style={[styles.error, { color: colors.negative }]}>{error}</Text> : null}

      {/* Android: native dialog rendered directly */}
      {Platform.OS === 'android' && show && (
        <DateTimePicker
          value={value}
          mode="date"
          display="calendar"
          onChange={handleAndroidChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {/* iOS: modal overlay with inline picker + Done button */}
      {Platform.OS === 'ios' && (
        <Modal visible={show} transparent animationType="slide">
          <Pressable style={styles.backdrop} onPress={() => setShow(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setShow(false)}>
                <Text style={[styles.sheetAction, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>{label}</Text>
              <Pressable onPress={confirmIOS}>
                <Text style={[styles.sheetAction, { color: colors.accent }]}>Done</Text>
              </Pressable>
            </View>
            <DateTimePicker
              value={pending}
              mode="date"
              display="spinner"
              onChange={handleIOSChange}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              themeVariant="dark"
              style={styles.iosPicker}
            />
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  value: { fontSize: 15 },
  error: { fontSize: 12 },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sheetTitle: { fontSize: 15, fontWeight: '600' },
  sheetAction: { fontSize: 15, fontWeight: '500' },
  iosPicker: { height: 200 },
});
