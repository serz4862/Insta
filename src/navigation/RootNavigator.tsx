import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useNotifications } from '../hooks/useNotifications';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList, MainStackParamList } from '../types';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isPhoneVerified, isLoading } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const showMainRef = useRef(false);

  const [pendingMainScreen, setPendingMainScreen] = useState<
    keyof MainStackParamList | null
  >(null);

  useAuth();

  const showMain = isAuthenticated && isPhoneVerified;

  useEffect(() => {
    showMainRef.current = showMain;
  }, [showMain]);

  /**
   * Navigate to a Main screen from a notification tap.
   * If the user isn't in the Main stack yet, store as pending and navigate once auth resolves.
   */
  const handleNotificationTap = useCallback((data: Record<string, string>) => {
    const target: keyof MainStackParamList =
      data.screen === 'Route' ? 'Route' : 'Deliveries';

    if (showMainRef.current && navigationRef.current) {
      navigationRef.current.navigate('Main', { screen: target });
    } else {
      setPendingMainScreen(target);
    }
  }, []);

  // Register device push token + attach foreground/background notification listeners
  useNotifications(handleNotificationTap);

  // Navigate to the correct stack whenever auth/loading state changes
  useEffect(() => {
    if (isLoading || !navigationRef.current) return;

    if (showMain) {
      navigationRef.current.reset({
        index: 0,
        routes: [
          {
            name: 'Main',
            params: { screen: pendingMainScreen ?? 'Deliveries' },
          },
        ],
      });
    } else {
      navigationRef.current.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }

    if (pendingMainScreen) setPendingMainScreen(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, isPhoneVerified]);

  // Cold-start: app opened by tapping a notification while it was killed
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const rawData = response.notification.request.content.data ?? {};
        const data: Record<string, string> = {};
        for (const [k, v] of Object.entries(rawData)) {
          data[k] = String(v ?? '');
        }
        handleNotificationTap(data);
      })
      .catch((e) => console.warn('[RootNavigator] getLastNotificationResponseAsync failed:', e));
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigator} />
        <Stack.Screen name="Main" component={MainNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
});
