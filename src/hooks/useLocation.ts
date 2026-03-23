import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../types';

interface LocationState {
  location: Coordinates | null;
  error: string | null;
  isLoading: boolean;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setState((prev) => ({
            ...prev,
            error: 'Location permission denied.',
            isLoading: false,
          }));
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setState({
          location: {
            latitude: current.coords.latitude,
            longitude: current.coords.longitude,
          },
          error: null,
          isLoading: false,
        });

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000,
            distanceInterval: 20,
          },
          (loc) => {
            setState((prev) => ({
              ...prev,
              location: {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              },
            }));
          }
        );
      } catch (err) {
        setState({
          location: null,
          error: 'Failed to get location.',
          isLoading: false,
        });
      }
    };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, []);

  return state;
};
