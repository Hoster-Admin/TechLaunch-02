import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'tlmena_token';
const REFRESH_TOKEN_KEY = 'tlmena_refresh_token';
const USER_KEY = 'tlmena_user';

// expo-secure-store is not available on web — fall back to AsyncStorage there.
const isSecureAvailable = Platform.OS !== 'web';

async function secureGet(key: string): Promise<string | null> {
  if (isSecureAvailable) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (isSecureAvailable) {
    await SecureStore.setItemAsync(key, value);
  } else {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureDelete(key: string): Promise<void> {
  if (isSecureAvailable) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await AsyncStorage.removeItem(key);
  }
}

export const storage = {
  async getToken(): Promise<string | null> {
    return secureGet(TOKEN_KEY);
  },
  async setToken(token: string): Promise<void> {
    await secureSet(TOKEN_KEY, token);
  },
  async removeToken(): Promise<void> {
    await secureDelete(TOKEN_KEY);
  },
  async getRefreshToken(): Promise<string | null> {
    return secureGet(REFRESH_TOKEN_KEY);
  },
  async setRefreshToken(token: string): Promise<void> {
    await secureSet(REFRESH_TOKEN_KEY, token);
  },
  async getUser<T>(): Promise<T | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  async setUser<T>(user: T): Promise<void> {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async removeUser(): Promise<void> {
    await AsyncStorage.removeItem(USER_KEY);
  },
  async clear(): Promise<void> {
    await Promise.all([
      secureDelete(TOKEN_KEY),
      secureDelete(REFRESH_TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};
