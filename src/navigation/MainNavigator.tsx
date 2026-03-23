import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types';
import { DeliveriesScreen } from '../screens/Deliveries/DeliveriesScreen';
import { RouteScreen } from '../screens/Route/RouteScreen';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Deliveries" component={DeliveriesScreen} />
      <Stack.Screen name="Route" component={RouteScreen} />
    </Stack.Navigator>
  );
};
