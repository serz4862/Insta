import AsyncStorage from '@react-native-async-storage/async-storage';
import { Persistence } from 'firebase/auth';

/**
 * Custom AsyncStorage-based persistence for Firebase Auth in React Native.
 * The public Persistence interface only exposes `type`, but initializeAuth
 * accepts the internal adapter shape. We cast via `unknown` to satisfy types.
 */
const asyncStoragePersistenceAdapter = {
  type: 'LOCAL' as const,

  async _isAvailable(): Promise<boolean> {
    try {
      await AsyncStorage.setItem('__firebase_test__', '1');
      await AsyncStorage.removeItem('__firebase_test__');
      return true;
    } catch {
      return false;
    }
  },

  async _set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async _get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async _remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  _addListener(_key: string, _listener: unknown): void {
    // AsyncStorage doesn't support cross-tab listeners
  },

  _removeListener(_key: string, _listener: unknown): void {
    // no-op
  },
};

export const asyncStoragePersistence =
  asyncStoragePersistenceAdapter as unknown as Persistence;
