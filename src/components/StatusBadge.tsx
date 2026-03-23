import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DeliveryStatus } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

interface StatusBadgeProps {
  status: DeliveryStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const isPending = status === 'pending';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isPending ? COLORS.pendingBg : COLORS.deliveredBg },
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: isPending ? COLORS.pending : COLORS.delivered },
        ]}
      />
      <Text
        style={[
          styles.text,
          { color: isPending ? COLORS.pending : COLORS.delivered },
        ]}
      >
        {isPending ? 'Pending' : 'Delivered'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
    gap: SPACING.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
