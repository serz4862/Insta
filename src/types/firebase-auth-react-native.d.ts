import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(
    storage: Pick<
      import('@react-native-async-storage/async-storage').default,
      'getItem' | 'setItem' | 'removeItem'
    >
  ): Persistence;
}
