import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-modules-core';
import { registerForPushNotifications } from '../services/firebase/notificationService';
import { useAuthStore } from '../store/authStore';

export const useNotifications = (
  onNotificationTap?: (notification: Notifications.Notification) => void
) => {
  const { user } = useAuthStore();
  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotifications(user.id).catch((err) =>
      console.warn('Push notification registration failed:', err)
    );

    // Foreground notification handler
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received in foreground:', notification);
      }
    );

    // Notification tap handler (background / killed state)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const notification = response.notification;
        console.log('Notification tapped:', notification);
        onNotificationTap?.(notification);
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id]);
};
