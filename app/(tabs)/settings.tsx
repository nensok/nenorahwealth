import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  Alert, Switch, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { ScreenHeader } from '@/components/ui/screen-header';

interface SettingsRowProps {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
}

function SettingsRow({ label, icon, onPress, destructive }: SettingsRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? colors.surfaceElevated : colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.rowIconWrap, { backgroundColor: destructive ? colors.negative + '20' : colors.surfaceElevated }]}>
        <MaterialIcons name={icon} size={18} color={destructive ? colors.negative : colors.muted} />
      </View>
      <Text style={[styles.rowLabel, { color: destructive ? colors.negative : colors.text }]}>{label}</Text>
      <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const settings = useAppStore((s) => s.settings);
  const saveSettings = useAppStore((s) => s.saveSettings);
  const lock = useAuthStore((s) => s.lock);
  const isLight = settings?.theme === 'light';

  const [editNameVisible, setEditNameVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  function handleLockApp() {
    lock();
    router.replace('/(auth)/pin-entry');
  }

  function handleChangePIN() {
    Alert.alert('Change PIN', 'You will need to set up a new PIN. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => router.push('/(auth)/pin-setup') },
    ]);
  }

  function toggleTheme() {
    saveSettings({ theme: isLight ? 'dark' : 'light' });
  }

  function openEditName() {
    setNameInput(settings?.userName ?? '');
    setEditNameVisible(true);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSaving(true);
    await saveSettings({ userName: trimmed });
    setSaving(false);
    setEditNameVisible(false);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Settings" subtitle="Preferences & security" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
            <MaterialIcons name="person" size={32} color={colors.accent} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {settings?.userName || 'User'}
            </Text>
            <Text style={[styles.profileSub, { color: colors.muted }]}>
              Currency: {settings?.currencySymbol ?? '₦'}
            </Text>
          </View>
          <Pressable
            onPress={openEditName}
            style={[styles.editBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <MaterialIcons name="edit" size={16} color={colors.accent} />
          </Pressable>
        </View>

        {/* Appearance section */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>APPEARANCE</Text>
        <View style={[styles.themeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.themeIconWrap, { backgroundColor: colors.surfaceElevated }]}>
            <MaterialIcons name={isLight ? 'light-mode' : 'dark-mode'} size={18} color={colors.accent} />
          </View>
          <Text style={[styles.themeLabel, { color: colors.text }]}>
            {isLight ? 'Light Mode' : 'Dark Mode'}
          </Text>
          <Switch
            value={isLight}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.accent + '60' }}
            thumbColor={isLight ? colors.accent : colors.muted}
          />
        </View>

        {/* Data section */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>DATA MANAGEMENT</Text>
        <View style={styles.group}>
          <SettingsRow icon="category" label="Categories" onPress={() => router.push('/categories')} />
          <SettingsRow icon="file-download" label="Export to Excel" onPress={() => router.push('/export')} />
          <SettingsRow icon="backup" label="Backup & Restore" onPress={() => router.push('/backup')} />
        </View>

        {/* Security section */}
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>SECURITY</Text>
        <View style={styles.group}>
          <SettingsRow icon="lock" label="Change PIN" onPress={handleChangePIN} />
          <SettingsRow icon="logout" label="Lock App" onPress={handleLockApp} destructive />
        </View>

        {/* About */}
        <View style={[styles.about, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialIcons name="account-balance-wallet" size={28} color={colors.accent} />
          <Text style={[styles.aboutName, { color: colors.text }]}>NenorahWealth</Text>
          <Text style={[styles.aboutVersion, { color: colors.muted }]}>Version 1.0.0</Text>
        </View>

      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editNameVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditNameVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setEditNameVisible(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            <Text style={[styles.sheetTitle, { color: colors.text }]}>Edit Name</Text>
            <Text style={[styles.sheetSub, { color: colors.muted }]}>
              This name appears on your dashboard greeting.
            </Text>

            <TextInput
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              autoFocus
              style={[
                styles.nameInput,
                {
                  color: colors.text,
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                },
              ]}
            />

            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => setEditNameVisible(false)}
                style={[styles.sheetBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.sheetBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveName}
                disabled={saving || !nameInput.trim()}
                style={[
                  styles.sheetBtn,
                  styles.sheetBtnPrimary,
                  { backgroundColor: colors.accent, opacity: saving || !nameInput.trim() ? 0.5 : 1 },
                ]}
              >
                <Text style={[styles.sheetBtnText, { color: '#000' }]}>
                  {saving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700' },
  profileSub: { fontSize: 13, marginTop: 2 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingLeft: 4 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  themeIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  themeLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  group: { gap: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  rowIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '500' },

  about: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginTop: 8,
  },
  aboutName: { fontSize: 16, fontWeight: '700' },
  aboutVersion: { fontSize: 13 },

  // ── Edit name modal ───────────────────────────────────────────────────────
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 24,
    gap: 14,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  sheetSub: { fontSize: 13, marginTop: -6 },
  nameInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 100,
    alignItems: 'center',
    borderWidth: 1,
  },
  sheetBtnPrimary: { borderWidth: 0 },
  sheetBtnText: { fontSize: 15, fontWeight: '700' },
});
