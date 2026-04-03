import { View, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { getCurrentMonthYear } from '@/lib/utils/date';
import type { IncomeFormData } from '@/types';

interface IncomeFormProps {
  defaultValues?: Partial<IncomeFormData>;
  onSubmit: (data: IncomeFormData) => Promise<void>;
  submitLabel?: string;
}

export function IncomeForm({ defaultValues, onSubmit, submitLabel = 'Save' }: IncomeFormProps) {
  const { month, year } = getCurrentMonthYear();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormData>({
    defaultValues: {
      amount: '',
      source: '',
      month,
      year,
      notes: '',
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
        name="source"
        rules={{ required: 'Source is required' }}
        render={({ field }) => (
          <Input
            label="Source"
            placeholder="e.g. Salary, Business"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.source?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="month"
        render={({ field: monthField }) => (
          <Controller
            control={control}
            name="year"
            render={({ field: yearField }) => (
              <DateField
                label="Month / Year"
                value={new Date(yearField.value as number, (monthField.value as number) - 1, 1)}
                onChange={(d) => {
                  monthField.onChange(d.getMonth() + 1);
                  yearField.onChange(d.getFullYear());
                }}
                maximumDate={new Date()}
              />
            )}
          />
        )}
      />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Input
            label="Notes (optional)"
            placeholder="Any additional details"
            value={field.value}
            onChangeText={field.onChange}
            multiline
            numberOfLines={3}
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
  submit: { marginTop: 8 },
});
