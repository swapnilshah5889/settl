import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { AnimatedPressable } from './AnimatedPressable';
import { formatCurrency } from '../utils/formatCurrency';
import { useStaggeredEntry } from '../hooks/useAnimations';

const GROUP_TYPE_ICONS: Record<string, string> = {
  home: 'home',
  trip: 'airplane',
  couple: 'heart',
  other: 'account-group',
};

const GROUP_TYPE_COLORS: Record<string, string> = {
  home: '#FF6B6B',
  trip: '#45B7D1',
  couple: '#FF85A2',
  other: '#4ECDC4',
};

interface GroupCardProps {
  name: string;
  groupType: string;
  memberCount: number;
  balance?: number;
  currency?: string;
  onPress?: () => void;
  index?: number;
}

export function GroupCard({ name, groupType, memberCount, balance = 0, currency = 'USD', onPress, index = 0 }: GroupCardProps) {
  const icon = GROUP_TYPE_ICONS[groupType] || 'account-group';
  const color = GROUP_TYPE_COLORS[groupType] || Colors.primary;
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
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={26} color={color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.members}>{memberCount} members</Text>
      </View>
      {balance !== 0 && (
        <View style={styles.balanceContainer}>
          <Text style={[styles.balance, { color: balance > 0 ? Colors.owed : Colors.owes }]}>
            {balance > 0 ? '+' : ''}{formatCurrency(balance, currency)}
          </Text>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.gray400} />
    </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  members: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  balanceContainer: {
    marginRight: 8,
  },
  balance: {
    fontSize: 15,
    fontWeight: '700',
  },
});
