import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-modules-core';
import { registerForPushNotifications } from '../services/firebase/notificationService';
import { useAuthStore } from '../store/authStore';

/**
 * Hook that wires up all push notification lifecycle handling.
 *
 * - Registers the device for push notifications on mount (once per uid).
 * - Handles foreground notifications: expo-notifications shows the OS banner because
 *   `setNotificationHandler` in notificationService returns `shouldShowBanner: true`.
 * - Handles background + killed-app taps via `addNotificationResponseReceivedListener`.
 * - Exposes `onNotificationTap` callback so callers (e.g. RootNavigator) can navigate.
 */
export const useNotifications = (
  onNotificationTap?: (data: Record<string, string>) => void
) => {
  const { user } = useAuthStore();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Register device push token with Firebase (non-blocking)
    registerForPushNotifications(user.id).catch((err) =>
      console.warn('[useNotifications] Registration failed:', err)
    );

    // Foreground: notification arrives while the app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body } = notification.request.content;
        console.log(`[Notification] Foreground — ${title}: ${body}`);
        // The OS banner is shown automatically by setNotificationHandler.
        // No extra Alert needed; banner + sound is the correct UX.
      }
    );

    // Background / killed-app: user taps the notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const rawData = response.notification.request.content.data ?? {};
        // Coerce to string map for safe consumption by navigation handler
        const data: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawData)) {
          data[k] = String(v ?? '');
        }
        console.log('[Notification] Tapped:', data);
        onNotificationTap?.(data);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
};
