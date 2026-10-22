import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { AnimatedPressable } from './AnimatedPressable';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/dateUtils';
import { useStaggeredEntry } from '../hooks/useAnimations';

interface ExpenseRowProps {
  description: string;
  amount: number;
  currency: string;
  date: string;
  categoryIcon?: string;
  paidByName: string;
  yourShare: number;
  isPayment?: boolean;
  onPress?: () => void;
  index?: number;
}

export function ExpenseRow({
  description,
  amount,
  currency,
  date,
  categoryIcon = 'receipt',
  paidByName,
  yourShare,
  isPayment,
  onPress,
  index = 0,
}: ExpenseRowProps) {
  const { animatedStyle, enter } = useStaggeredEntry(index);

  useEffect(() => {
    enter();
  }, []);

  return (
    <Animated.View style={animatedStyle}>
    <AnimatedPressable
      style={styles.container}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, isPayment && styles.paymentIcon]}>
        <MaterialCommunityIcons
          name={isPayment ? 'swap-horizontal' : (categoryIcon as any)}
          size={22}
          color={isPayment ? Colors.settlement : Colors.primary}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={1}>
          {description}
        </Text>
        <Text style={styles.meta}>
          {paidByName} paid {formatCurrency(amount, currency)} · {formatDate(date)}
        </Text>
      </View>
      <View style={styles.shareContainer}>
        {yourShare !== 0 && (
          <>
            <Text style={styles.shareLabel}>
              {yourShare > 0 ? 'you lent' : 'you owe'}
            </Text>
            <Text
              style={[
                styles.shareAmount,
                { color: yourShare > 0 ? Colors.owed : Colors.owes },
              ]}
            >
              {formatCurrency(Math.abs(yourShare), currency)}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  pressed: {
    backgroundColor: Colors.gray50,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentIcon: {
    backgroundColor: '#EDE7F6',
  },
  content: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  shareContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  shareLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  shareAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
