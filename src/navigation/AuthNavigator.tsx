import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';
import { LoginScreen } from '../screens/Auth/LoginScreen';
import { PhoneVerificationScreen } from '../screens/Auth/PhoneVerificationScreen';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PhoneVerification" component={PhoneVerificationScreen} />
    </Stack.Navigator>
  );
};
