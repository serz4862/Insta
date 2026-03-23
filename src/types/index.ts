export interface User {
  id: string;
  email: string;
  phone: string;
  role: 'driver';
  fcmToken?: string;
}

export type DeliveryStatus = 'pending' | 'delivered';

export interface Delivery {
  id: string;
  driverId: string;
  customerName: string;
  address: string;
  latitude: number;
  longitude: number;
  status: DeliveryStatus;
  createdAt: Date | null;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type AuthStackParamList = {
  Login: undefined;
  PhoneVerification: { email: string; uid: string };
};

export type MainStackParamList = {
  Deliveries: undefined;
  Route: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: { screen?: keyof MainStackParamList } | undefined;
};
