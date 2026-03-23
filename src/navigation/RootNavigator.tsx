import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-modules-core';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList, MainStackParamList } from '../types';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

// Stack must live outside the component to prevent re-creation on every render
const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isPhoneVerified, isLoading } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const showMainRef = useRef(false);

  const [pendingMainScreen, setPendingMainScreen] = useState<
    keyof MainStackParamList | null
  >(null);

  // Bootstrap auth state from Firebase persisted session
  useAuth();

  const showMain = isAuthenticated && isPhoneVerified;

  // Keep a ref in sync so notification handlers can access current value without stale closure
  useEffect(() => {
    showMainRef.current = showMain;
  }, [showMain]);

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

  // Handle notification taps (background + foreground + killed/cold-start)
  useEffect(() => {
    // Tap from background / foreground
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as { screen?: string } | undefined;
        const target: keyof MainStackParamList =
          data?.screen === 'Route' ? 'Route' : 'Deliveries';

        if (showMainRef.current && navigationRef.current) {
          navigationRef.current.navigate('Main', { screen: target });
        } else {
          setPendingMainScreen(target);
        }
      }
    );

    // Cold-start: app opened from notification after being killed
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = response.notification.request.content.data as { screen?: string } | undefined;
        const target: keyof MainStackParamList =
          data?.screen === 'Route' ? 'Route' : 'Deliveries';

        if (showMainRef.current && navigationRef.current) {
          navigationRef.current.navigate('Main', { screen: target });
        } else {
          setPendingMainScreen(target);
        }
      })
      .catch((e) => console.warn('getLastNotificationResponseAsync failed:', e));

    return () => {
      responseListener.current?.remove();
    };
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
