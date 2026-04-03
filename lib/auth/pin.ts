import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'app_pin';

export async function storePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function pinExists(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(PIN_KEY);
  return value !== null && value.length > 0;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY);
  return stored === pin;
}

export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY);
}
