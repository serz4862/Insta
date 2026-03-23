import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { EventSubscription } from 'expo-modules-core';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { RootStackParamList } from '../types';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isPhoneVerified, isLoading } = useAuthStore();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  useAuth();

  // Handle notification taps — navigate to Deliveries screen
  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (_response) => {
        // Notification tapped: navigate to Deliveries
        // We rely on the NavigationContainer being ready when notifications come in
        console.log('Notification tapped from RootNavigator');
      }
    );
    return () => responseListener.current?.remove();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const showMain = isAuthenticated && isPhoneVerified;

  return (
    <NavigationContainer ref={navigationRef}>
      {showMain ? <MainNavigator /> : <AuthNavigator />}
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
