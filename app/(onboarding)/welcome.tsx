import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const colors = useColors();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("₦");
  const [nameError, setNameError] = useState("");

  function handleNext() {
    if (!name.trim()) {
      setNameError("Please enter your name");
      return;
    }
    router.push({
      pathname: "/(onboarding)/initial-income",
      params: { name: name.trim(), currency },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View
            style={[
              styles.logoWrap,
              {
                backgroundColor: colors.accent + "20",
                borderColor: colors.accent + "40",
              },
            ]}
          >
            <MaterialIcons
              name="account-balance-wallet"
              size={36}
              color={colors.accent}
            />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to{"\n"}NenorahWealth
          </Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Your personal finance companion. Let us get you set up.
          </Text>
        </View>

        <View style={styles.fields}>
          <Input
            label="Your Name"
            placeholder="e.g. Kendinen N"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setNameError("");
            }}
            error={nameError}
            autoFocus
          />

          <Input
            label="Currency Symbol"
            placeholder="₦"
            value={currency}
            onChangeText={setCurrency}
            maxLength={3}
          />
        </View>

        <Button label="Continue" onPress={handleNext} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24, gap: 32, justifyContent: "center" },
  header: { alignItems: "center", gap: 12 },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  title: { fontSize: 28, fontWeight: "800", textAlign: "center" },
  subtitle: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  fields: { gap: 16 },
});
