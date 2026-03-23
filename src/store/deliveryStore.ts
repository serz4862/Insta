import { create } from 'zustand';
import { Delivery } from '../types';

interface DeliveryState {
  deliveries: Delivery[];
  optimizedRoute: Delivery[];
  isLoading: boolean;
  error: string | null;
  setDeliveries: (deliveries: Delivery[]) => void;
  setOptimizedRoute: (route: Delivery[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  deliveries: [],
  optimizedRoute: [],
  isLoading: false,
  error: null,
  setDeliveries: (deliveries) => set({ deliveries }),
  setOptimizedRoute: (optimizedRoute) => set({ optimizedRoute }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
