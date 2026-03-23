import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';
import { useDeliveries } from '../../hooks/useDeliveries';
import { useAuthStore } from '../../store/authStore';
import { updateDeliveryStatus } from '../../services/firebase/deliveryService';
import { logout } from '../../services/firebase/authService';
import { DeliveryCard } from '../../components/DeliveryCard';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { Button } from '../../components/Button';
import { COLORS, SPACING } from '../../constants';
import { Delivery } from '../../types';

type Props = {
  navigation: NativeStackNavigationProp<MainStackParamList, 'Deliveries'>;
};

export const DeliveriesScreen: React.FC<Props> = ({ navigation }) => {
  const { user, clearAuth } = useAuthStore();
  const { deliveries, isLoading, error } = useDeliveries();

  const pendingCount = deliveries.filter((d) => d.status === 'pending').length;
  const deliveredCount = deliveries.filter((d) => d.status === 'delivered').length;

  const handleMarkDelivered = useCallback(
    async (deliveryId: string) => {
      Alert.alert(
        'Confirm Delivery',
        'Mark this delivery as delivered?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                await updateDeliveryStatus(deliveryId, 'delivered');
              } catch {
                Alert.alert('Error', 'Failed to update delivery status. Try again.');
              }
            },
          },
        ]
      );
    },
    []
  );

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          clearAuth();
        },
      },
    ]);
  };

  const renderDelivery = useCallback(
    ({ item }: { item: Delivery }) => (
      <DeliveryCard delivery={item} onMarkDelivered={handleMarkDelivered} />
    ),
    [handleMarkDelivered]
  );

  const keyExtractor = useCallback((item: Delivery) => item.id, []);

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📦</Text>
      <Text style={styles.emptyTitle}>No Deliveries Yet</Text>
      <Text style={styles.emptySubtitle}>
        You have no assigned deliveries at the moment. Check back soon!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, Driver 👋</Text>
          <Text style={styles.driverName} numberOfLines={1}>
            {user?.email ?? 'Loading...'}
          </Text>
        </View>
        <Button
          title="Sign Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          textStyle={styles.logoutText}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{deliveries.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.pendingCard]}>
          <Text style={[styles.statValue, { color: COLORS.pending }]}>
            {pendingCount}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, styles.deliveredCard]}>
          <Text style={[styles.statValue, { color: COLORS.delivered }]}>
            {deliveredCount}
          </Text>
          <Text style={styles.statLabel}>Delivered</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.listContent}>
          <LoadingSkeleton count={4} />
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={keyExtractor}
          renderItem={renderDelivery}
          contentContainerStyle={[
            styles.listContent,
            deliveries.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {pendingCount > 0 && (
        <View style={styles.footer}>
          <Button
            title={`🗺  Optimise Route  (${pendingCount} stops)`}
            onPress={() => navigation.navigate('Route')}
            style={styles.optimiseButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  greeting: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  driverName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    maxWidth: 200,
  },
  logoutButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    minHeight: 36,
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pendingCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.pending,
  },
  deliveredCard: {
    borderTopWidth: 3,
    borderTopColor: COLORS.delivered,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  errorBanner: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: SPACING.sm,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: SPACING.xs,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  optimiseButton: {
    borderRadius: 14,
  },
});
