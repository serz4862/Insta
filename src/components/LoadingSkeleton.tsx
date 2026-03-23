import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../constants';

const SkeletonItem: React.FC = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <View style={styles.header}>
        <View style={styles.idSkeleton} />
        <View style={styles.badgeSkeleton} />
      </View>
      <View style={styles.nameSkeleton} />
      <View style={styles.addressSkeleton} />
    </Animated.View>
  );
};

export const LoadingSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonItem key={i} />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  idSkeleton: {
    width: 100,
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
  badgeSkeleton: {
    width: 70,
    height: 24,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
  },
  nameSkeleton: {
    width: '60%',
    height: 18,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  addressSkeleton: {
    width: '90%',
    height: 14,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
});
