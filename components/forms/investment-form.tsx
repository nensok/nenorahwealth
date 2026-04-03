import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColors } from "@/hooks/use-colors";
import { calcPortfolioValue, calcProfitLoss } from "@/lib/utils/calculations";
import { formatCurrency } from "@/lib/utils/currency";
import type { InvestmentFormData } from "@/types";
import { Controller, useForm, useWatch } from "react-hook-form";
import { StyleSheet, Text, View } from "react-native";

interface InvestmentFormProps {
  defaultValues?: Partial<InvestmentFormData>;
  onSubmit: (data: InvestmentFormData) => Promise<void>;
  submitLabel?: string;
  currencySymbol?: string;
}

function LivePnL({
  control,
  currencySymbol,
}: {
  control: ReturnType<typeof useForm<InvestmentFormData>>["control"];
  currencySymbol: string;
}) {
  const colors = useColors();
  const [qty, buyPrice, currentPrice] = useWatch({
    control,
    name: ["quantity", "buyPrice", "currentPrice"],
  });

  const q = parseFloat(qty) || 0;
  const bp = parseFloat(buyPrice) || 0;
  const cp = parseFloat(currentPrice) || 0;

  const pv = calcPortfolioValue(q, cp);
  const pl = calcProfitLoss(q, bp, cp);
  const isPositive = pl >= 0;

  if (q === 0 && bp === 0 && cp === 0) return null;

  return (
    <View
      style={[
        styles.preview,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.previewRow}>
        <Text style={[styles.previewLabel, { color: colors.muted }]}>
          Portfolio Value
        </Text>
        <Text style={[styles.previewValue, { color: colors.text }]}>
          {formatCurrency(pv, currencySymbol)}
        </Text>
      </View>
      <View style={styles.previewRow}>
        <Text style={[styles.previewLabel, { color: colors.muted }]}>P&L</Text>
        <Text
          style={[
            styles.previewValue,
            { color: isPositive ? colors.positive : colors.negative },
          ]}
        >
          {isPositive ? "+" : ""}
          {formatCurrency(pl, currencySymbol)}
        </Text>
      </View>
    </View>
  );
}

export function InvestmentForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  currencySymbol = "₦",
}: InvestmentFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InvestmentFormData>({
    defaultValues: {
      stockName: "",
      ticker: "",
      quantity: "",
      buyPrice: "",
      currentPrice: "",
      notes: "",
      ...defaultValues,
    },
  });

  return (
    <View style={styles.form}>
      <View style={styles.row}>
        <View style={styles.flex2}>
          <Controller
            control={control}
            name="stockName"
            rules={{ required: "Stock name is required" }}
            render={({ field }) => (
              <Input
                label="Stock Name"
                placeholder="e.g. Dangote Cement"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.stockName?.message}
              />
            )}
          />
        </View>
        <View style={styles.flex1}>
          <Controller
            control={control}
            name="ticker"
            render={({ field }) => (
              <Input
                label="Ticker (optional)"
                placeholder="DANGCEM"
                value={field.value}
                onChangeText={field.onChange}
                autoCapitalize="characters"
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={control}
        name="quantity"
        rules={{
          required: "Quantity is required",
          validate: (v) => parseFloat(v) > 0 || "Must be > 0",
        }}
        render={({ field }) => (
          <Input
            label="Quantity (units)"
            placeholder="100"
            keyboardType="decimal-pad"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.quantity?.message}
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="buyPrice"
            rules={{
              required: "Buy price required",
              validate: (v) => parseFloat(v) > 0 || "Must be > 0",
            }}
            render={({ field }) => (
              <Input
                label={`Buy Price (${currencySymbol})`}
                placeholder="0"
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.buyPrice?.message}
              />
            )}
          />
        </View>
        <View style={styles.half}>
          <Controller
            control={control}
            name="currentPrice"
            rules={{
              required: "Current price required",
              validate: (v) => parseFloat(v) > 0 || "Must be > 0",
            }}
            render={({ field }) => (
              <Input
                label={`Current Price (${currencySymbol})`}
                placeholder="0"
                keyboardType="decimal-pad"
                value={field.value}
                onChangeText={field.onChange}
                error={errors.currentPrice?.message}
              />
            )}
          />
        </View>
      </View>

      <LivePnL control={control} currencySymbol={currencySymbol} />

      <Controller
        control={control}
        name="notes"
        render={({ field }) => (
          <Input
            label="Notes (optional)"
            placeholder="e.g. Bought via Cowriwise"
            value={field.value}
            onChangeText={field.onChange}
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
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  preview: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel: { fontSize: 14 },
  previewValue: { fontSize: 15, fontWeight: "600" },
  submit: { marginTop: 8 },
});
