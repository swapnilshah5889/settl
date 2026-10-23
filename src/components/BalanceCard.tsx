import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/formatCurrency';
import { useFadeIn } from '../hooks/useAnimations';

interface BalanceCardProps {
  owe: number;
  owed: number;
  currency?: string;
}

export function BalanceCard({ owe, owed, currency = 'USD' }: BalanceCardProps) {
  const net = owed - owe;
  const { animatedStyle: fadeStyle, enter } = useFadeIn(0, 500);

  useEffect(() => {
    enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>Total Balance</Text>
        <Text style={[styles.netAmount, { color: net >= 0 ? Colors.owed : Colors.owes }]}>
          {net >= 0 ? '+' : ''}{formatCurrency(net, currency)}
        </Text>
      </View>
      <View style={styles.row}>
        <View style={styles.half}>
          <View style={[styles.indicator, { backgroundColor: Colors.owes }]} />
          <View>
            <Text style={styles.label}>you owe</Text>
            <Text style={[styles.amount, { color: Colors.owes }]}>
              {formatCurrency(owe, currency)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.half}>
          <View style={[styles.indicator, { backgroundColor: Colors.owed }]} />
          <View>
            <Text style={styles.label}>you are owed</Text>
            <Text style={[styles.amount, { color: Colors.owed }]}>
              {formatCurrency(owed, currency)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  netAmount: {
    fontSize: 22,
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  half: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  indicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
});
