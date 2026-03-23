import { useEffect } from 'react';
import { subscribeToDriverDeliveries } from '../services/firebase/deliveryService';
import { useAuthStore } from '../store/authStore';
import { useDeliveryStore } from '../store/deliveryStore';

export const useDeliveries = () => {
  const { user } = useAuthStore();
  const { setDeliveries, setLoading, setError } = useDeliveryStore();

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);

    const unsubscribe = subscribeToDriverDeliveries(
      user.id,
      (deliveries) => {
        setDeliveries(deliveries);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  return useDeliveryStore();
};
