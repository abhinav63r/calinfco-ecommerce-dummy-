import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BrandColors } from '@/constants/theme';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normStatus = (status || 'Unknown').toLowerCase();

  let colors = { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };

  if (normStatus === 'placed' || normStatus === 'pending' || normStatus === 'requested') {
    colors = BrandColors.status.pending;
  } else if (normStatus === 'processing' || normStatus === 'scheduled') {
    colors = BrandColors.status.processing;
  } else if (normStatus === 'shipped') {
    colors = BrandColors.status.shipped;
  } else if (normStatus === 'delivered' || normStatus === 'approved' || normStatus === 'completed') {
    colors = BrandColors.status.delivered;
  } else if (normStatus === 'cancelled' || normStatus === 'rejected') {
    colors = BrandColors.status.cancelled;
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text style={[styles.text, { color: colors.text }]}>{status}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
