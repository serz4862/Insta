import { Coordinates, Delivery } from '../types';

/**
 * Haversine formula to calculate distance between two coordinates in km.
 */
export const haversineDistance = (a: Coordinates, b: Coordinates): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.asin(Math.sqrt(h));
};

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Nearest neighbor algorithm for route optimization.
 * Starts from driver location and greedily picks the closest unvisited delivery.
 */
export const optimizeRoute = (
  driverLocation: Coordinates,
  deliveries: Delivery[]
): Delivery[] => {
  const pending = deliveries.filter((d) => d.status === 'pending');
  if (pending.length === 0) return [];

  const unvisited = [...pending];
  const ordered: Delivery[] = [];
  let current: Coordinates = driverLocation;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDist = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const dist = haversineDistance(current, {
        latitude: unvisited[i].latitude,
        longitude: unvisited[i].longitude,
      });
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = i;
      }
    }

    const nearest = unvisited[nearestIdx];
    ordered.push(nearest);
    current = { latitude: nearest.latitude, longitude: nearest.longitude };
    unvisited.splice(nearestIdx, 1);
  }

  return ordered;
};
