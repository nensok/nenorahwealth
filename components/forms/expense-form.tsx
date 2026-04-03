import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { todayISO } from '@/lib/utils/date';
import { useCategoryStore } from '@/stores/category-store';
import type { ExpenseFormData } from '@/types';

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseFormData>;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  submitLabel?: string;
}

export function ExpenseForm({ defaultValues, onSubmit, submitLabel = 'Save' }: ExpenseFormProps) {
  const categories = useCategoryStore((s) => s.categories);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    defaultValues: {
      amount: '',
      categoryId: categories[0]?.id ?? 0,
      description: '',
      date: todayISO(),
      ...defaultValues,
    },
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="amount"
        rules={{ required: 'Amount is required', validate: (v) => parseFloat(v) > 0 || 'Must be greater than 0' }}
        render={({ field }) => (
          <Input
            label="Amount (₦)"
            placeholder="0"
            keyboardType="decimal-pad"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.amount?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="categoryId"
        rules={{ validate: (v) => v > 0 || 'Please select a category' }}
        render={({ field }) => (
          <View style={styles.categoryRow}>
            {categories.map((cat) => (
              <View key={cat.id} style={styles.categoryChipWrapper}>
                <View
                  style={[
                    styles.categoryChip,
                    field.value === cat.id && { borderColor: cat.color, borderWidth: 2 },
                  ]}
                  onTouchEnd={() => field.onChange(cat.id)}
                >
                  <Input
                    value={cat.name}
                    editable={false}
                    style={[
                      styles.chipInput,
                      { backgroundColor: cat.color + '22', color: cat.color },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Input
            label="Description"
            placeholder="What did you spend on?"
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      <Controller
        control={control}
        name="date"
        rules={{ required: 'Date is required' }}
        render={({ field }) => (
          <DateField
            label="Date"
            value={(() => {
              if (!field.value) return new Date();
              const [y, m, d] = field.value.split('-').map(Number);
              return new Date(y, m - 1, d);
            })()}
            onChange={(d) => {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              field.onChange(`${y}-${m}-${day}`);
            }}
            error={errors.date?.message}
            maximumDate={new Date()}
          />
        )}
      />

      <Button
        label={submitLabel}
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        style={styles.submit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChipWrapper: {},
  categoryChip: { borderRadius: 8, borderWidth: 1.5, borderColor: 'transparent' },
  chipInput: { paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, borderWidth: 0, minHeight: 36 },
  submit: { marginTop: 8 },
});
