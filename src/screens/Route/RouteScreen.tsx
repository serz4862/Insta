import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList, Delivery } from '../../types';
import { useDeliveryStore } from '../../store/deliveryStore';
import { useLocation } from '../../hooks/useLocation';
import { optimizeRoute } from '../../utils/routeOptimizer';
import { updateDeliveryStatus } from '../../services/firebase/deliveryService';
import { DeliveryCard } from '../../components/DeliveryCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Route'>;
};

export const RouteScreen: React.FC<Props> = ({ navigation }) => {
  const { deliveries, setOptimizedRoute, optimizedRoute } = useDeliveryStore();
  const { location, isLoading: locationLoading, error: locationError } = useLocation();
  const mapRef = useRef<MapView>(null);

  const pendingDeliveries = useMemo(
    () => deliveries.filter((d) => d.status === 'pending'),
    [deliveries]
  );

  useEffect(() => {
    if (!location || pendingDeliveries.length === 0) return;
    const route = optimizeRoute(location, pendingDeliveries);
    setOptimizedRoute(route);
  }, [location, pendingDeliveries]);

  const polylineCoordinates = useMemo(() => {
    if (!location || optimizedRoute.length === 0) return [];
    const coords = [
      { latitude: location.latitude, longitude: location.longitude },
      ...optimizedRoute.map((d) => ({
        latitude: d.latitude,
        longitude: d.longitude,
      })),
    ];
    return coords;
  }, [location, optimizedRoute]);

  const mapRegion = useMemo((): Region | undefined => {
    if (!location) return undefined;
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [location]);

  const handleMarkDelivered = useCallback(
    (deliveryId: string) => {
      Alert.alert('Confirm Delivery', 'Mark this stop as delivered?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateDeliveryStatus(deliveryId, 'delivered');
              // Route recalculates automatically via useEffect watching pendingDeliveries
            } catch {
              Alert.alert('Error', 'Failed to update delivery. Please try again.');
            }
          },
        },
      ]);
    },
    []
  );

  const fitMapToMarkers = useCallback(() => {
    if (!mapRef.current || !location || optimizedRoute.length === 0) return;
    const coordinates = [
      { latitude: location.latitude, longitude: location.longitude },
      ...optimizedRoute.map((d) => ({
        latitude: d.latitude,
        longitude: d.longitude,
      })),
    ];
    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 60, right: 40, bottom: 60, left: 40 },
      animated: true,
    });
  }, [location, optimizedRoute]);

  const renderStop = useCallback(
    ({ item, index }: { item: Delivery; index: number }) => (
      <DeliveryCard
        delivery={item}
        index={index}
        onMarkDelivered={handleMarkDelivered}
      />
    ),
    [handleMarkDelivered]
  );

  const keyExtractor = useCallback((item: Delivery) => item.id, []);

  if (locationLoading) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.loadingEmoji}>📍</Text>
        <Text style={styles.loadingTitle}>Getting Your Location...</Text>
        <Text style={styles.loadingSubtitle}>
          Please wait while we fetch your GPS location.
        </Text>
      </SafeAreaView>
    );
  }

  if (locationError) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <Text style={styles.loadingEmoji}>⚠️</Text>
        <Text style={styles.loadingTitle}>Location Unavailable</Text>
        <Text style={styles.loadingSubtitle}>{locationError}</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backArrow}>
          <Text style={styles.backArrowText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Optimised Route</Text>
          <Text style={styles.headerSubtitle}>
            {optimizedRoute.length} stop{optimizedRoute.length !== 1 ? 's' : ''} remaining
          </Text>
        </View>
        <TouchableOpacity style={styles.fitButton} onPress={fitMapToMarkers}>
          <Text style={styles.fitButtonText}>⊙ Fit</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={mapRegion}
          showsUserLocation
          showsMyLocationButton
          onMapReady={fitMapToMarkers}
        >
          {/* Driver location marker */}
          {location && (
            <Marker
              coordinate={location}
              title="Your Location"
              description="Current position"
              pinColor={COLORS.primary}
            />
          )}

          {/* Delivery markers */}
          {optimizedRoute.map((delivery, index) => (
            <Marker
              key={delivery.id}
              coordinate={{
                latitude: delivery.latitude,
                longitude: delivery.longitude,
              }}
              title={`Stop ${index + 1}: ${delivery.customerName}`}
              description={delivery.address}
            >
              <View style={styles.markerContainer}>
                <Text style={styles.markerText}>{index + 1}</Text>
              </View>
            </Marker>
          ))}

          {/* Polyline connecting all stops */}
          {polylineCoordinates.length > 1 && (
            <Polyline
              coordinates={polylineCoordinates}
              strokeColor={COLORS.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>You</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
            <Text style={styles.legendText}>Stops</Text>
          </View>
        </View>
      </View>

      {/* Stops List */}
      {optimizedRoute.length === 0 ? (
        <View style={styles.noStopsContainer}>
          <Text style={styles.noStopsEmoji}>🎉</Text>
          <Text style={styles.noStopsTitle}>All Deliveries Complete!</Text>
          <Text style={styles.noStopsSubtitle}>Great work — no pending stops left.</Text>
        </View>
      ) : (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>Stops in Optimal Order</Text>
            <Text style={styles.listHeaderSubtitle}>
              Nearest-neighbor algorithm
            </Text>
          </View>
          <FlatList
            data={optimizedRoute}
            keyExtractor={keyExtractor}
            renderItem={renderStop}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.background,
  },
  loadingEmoji: {
    fontSize: 52,
    marginBottom: SPACING.md,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
  },
  backBtnText: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backArrow: {
    padding: SPACING.xs,
  },
  backArrowText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  fitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  fitButtonText: {
    color: COLORS.surface,
    fontSize: 13,
    fontWeight: '600',
  },
  mapContainer: {
    height: 280,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  markerText: {
    color: COLORS.surface,
    fontWeight: '800',
    fontSize: 13,
  },
  legend: {
    position: 'absolute',
    bottom: SPACING.sm,
    left: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    flexDirection: 'row',
    gap: SPACING.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  listHeader: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  listHeaderSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  noStopsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  noStopsEmoji: {
    fontSize: 52,
    marginBottom: SPACING.md,
  },
  noStopsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  noStopsSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
