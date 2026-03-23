import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Delivery } from '../types';
import { StatusBadge } from './StatusBadge';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface DeliveryCardProps {
  delivery: Delivery;
  index?: number;
  onMarkDelivered?: (id: string) => void;
}

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  index,
  onMarkDelivered,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.orderInfo}>
          {index !== undefined && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{index + 1}</Text>
            </View>
          )}
          <Text style={styles.orderId} numberOfLines={1}>
            #{delivery.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
        <StatusBadge status={delivery.status} />
      </View>

      <Text style={styles.customerName}>{delivery.customerName}</Text>

      <View style={styles.addressRow}>
        <Text style={styles.addressIcon}>📍</Text>
        <Text style={styles.address} numberOfLines={2}>
          {delivery.address}
        </Text>
      </View>

      {delivery.status === 'pending' && onMarkDelivered && (
        <TouchableOpacity
          style={styles.deliverButton}
          onPress={() => onMarkDelivered(delivery.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.deliverButtonText}>Mark as Delivered</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: COLORS.surface,
    fontSize: 12,
    fontWeight: '700',
  },
  orderId: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    fontFamily: 'monospace',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
  },
  addressIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  deliverButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  deliverButtonText: {
    color: COLORS.surface,
    fontWeight: '600',
    fontSize: 14,
  },
});
