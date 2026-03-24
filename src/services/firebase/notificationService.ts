import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateFcmToken } from './authService';

/**
 * Global foreground notification handler.
 *
 * shouldShowBanner / shouldShowList = true  → system shows notification banner even when app is open.
 * shouldPlaySound / shouldSetBadge = true   → sound + badge update in all states.
 *
 * This must be called at module load time (before any component mounts) so that
 * notifications received in the foreground are displayed as banners.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers the device for push notifications and stores the native FCM/APNs
 * token in Firestore so the Cloud Function can target this device.
 *
 * Note: `getDevicePushTokenAsync()` returns the *native* token (FCM for Android,
 * APNs for iOS) which is required by `admin.messaging().send()` in Cloud Functions.
 * Do NOT use `getExpoPushTokenAsync()` here — that is for Expo's own push service.
 */
export const registerForPushNotifications = async (uid: string): Promise<string | null> => {
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications only work on physical devices. Skipping.');
    return null;
  }

  // Ensure notification channel exists on Android (required for Android 8+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Deliveries',
      description: 'New delivery assignment notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
      enableLights: true,
      enableVibrate: true,
      showBadge: true,
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted.');
    return null;
  }

  try {
    const devicePushToken = await Notifications.getDevicePushTokenAsync();
    const token =
      typeof devicePushToken === 'string'
        ? devicePushToken
        : (devicePushToken as { data?: unknown }).data;

    if (!token || typeof token !== 'string') {
      console.warn('[Notifications] Failed to get native device push token.');
      return null;
    }

    await updateFcmToken(uid, token);
    console.log('[Notifications] FCM token registered:', token.slice(0, 20) + '…');
    return token;
  } catch (err) {
    console.warn('[Notifications] Token registration error:', err);
    return null;
  }
};
