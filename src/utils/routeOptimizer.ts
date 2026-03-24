import { Coordinates, Delivery } from '../types';

/**
 * Haversine formula — straight-line distance between two coordinates in km.
 */
export const haversineDistance = (a: Coordinates, b: Coordinates): number => {
  const R = 6371;
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
 * Estimate travel time in minutes between two points.
 *
 * Real-world factors modelled:
 *  - Base speed: 30 km/h (urban average, accounts for stops/lights).
 *  - Traffic penalty: ±20 % based on time-of-day bucket (rush hours 8-10, 17-20).
 *  - Road-type penalty: inner-city coordinates (dense lat/lng area) get +15 % for
 *    narrow roads/one-ways — approximated by coordinate density heuristic.
 */
export const estimateTravelMinutes = (
  from: Coordinates,
  to: Coordinates
): number => {
  const distKm = haversineDistance(from, to);
  const hour = new Date().getHours();

  // Traffic multiplier based on time-of-day
  let trafficMultiplier = 1.0;
  if ((hour >= 8 && hour < 10) || (hour >= 17 && hour < 20)) {
    trafficMultiplier = 1.4; // rush hour — 40 % slower
  } else if ((hour >= 10 && hour < 12) || (hour >= 14 && hour < 17)) {
    trafficMultiplier = 1.15; // moderate traffic
  } else if (hour >= 22 || hour < 6) {
    trafficMultiplier = 0.85; // light traffic at night
  }

  // Heuristic: if coordinates are tightly packed (< 0.1° apart) assume urban density
  const latDiff = Math.abs(from.latitude - to.latitude);
  const lngDiff = Math.abs(from.longitude - to.longitude);
  const urbanPenalty = latDiff < 0.1 && lngDiff < 0.1 ? 1.15 : 1.0;

  const baseSpeedKmh = 30;
  const effectiveSpeedKmh = baseSpeedKmh / (trafficMultiplier * urbanPenalty);

  return (distKm / effectiveSpeedKmh) * 60;
};

/**
 * Compute total route cost (sum of estimated travel times) for a given ordered list.
 */
const routeCost = (
  start: Coordinates,
  route: Delivery[]
): number => {
  let total = 0;
  let prev: Coordinates = start;
  for (const d of route) {
    total += estimateTravelMinutes(prev, { latitude: d.latitude, longitude: d.longitude });
    prev = { latitude: d.latitude, longitude: d.longitude };
  }
  return total;
};

/**
 * 2-opt improvement pass — swaps pairs of edges to reduce total travel time.
 * Runs until no improvement is found (convergence).
 */
const twoOptImprove = (start: Coordinates, route: Delivery[]): Delivery[] => {
  if (route.length < 3) return route;
  let improved = true;
  let best = [...route];

  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        // Reverse the segment between i and j
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ];
        if (routeCost(start, candidate) < routeCost(start, best)) {
          best = candidate;
          improved = true;
        }
      }
    }
  }
  return best;
};

/**
 * Full route optimization pipeline:
 *  1. Nearest-neighbour greedy construction (travel-time aware).
 *  2. 2-opt improvement pass for further refinement.
 *
 * Factors: straight-line distance, estimated traffic conditions, urban density.
 */
export const optimizeRoute = (
  driverLocation: Coordinates,
  deliveries: Delivery[]
): Delivery[] => {
  const pending = deliveries.filter((d) => d.status === 'pending');
  if (pending.length === 0) return [];
  if (pending.length === 1) return pending;

  // Phase 1: nearest-neighbour using travel-time cost (not raw distance)
  const unvisited = [...pending];
  const ordered: Delivery[] = [];
  let current: Coordinates = driverLocation;

  while (unvisited.length > 0) {
    let bestIdx = 0;
    let minTime = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const time = estimateTravelMinutes(current, {
        latitude: unvisited[i].latitude,
        longitude: unvisited[i].longitude,
      });
      if (time < minTime) {
        minTime = time;
        bestIdx = i;
      }
    }

    const nearest = unvisited[bestIdx];
    ordered.push(nearest);
    current = { latitude: nearest.latitude, longitude: nearest.longitude };
    unvisited.splice(bestIdx, 1);
  }

  // Phase 2: 2-opt improvement for routes with 3+ stops
  return twoOptImprove(driverLocation, ordered);
};

/**
 * Returns total estimated travel time in minutes for a given ordered route.
 */
export const totalRouteTravelTime = (
  driverLocation: Coordinates,
  route: Delivery[]
): number => routeCost(driverLocation, route);
