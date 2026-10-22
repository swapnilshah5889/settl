import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '../constants/colors';
import { Avatar } from './Avatar';
import { formatCurrency } from '../utils/formatCurrency';

interface FriendRowProps {
  name: string;
  email?: string | null;
  balance?: number;
  currency?: string;
  imageUri?: string | null;
  onPress?: () => void;
}

export function FriendRow({ name, email, balance = 0, currency = 'USD', imageUri, onPress }: FriendRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Avatar name={name} imageUri={imageUri} size={44} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {email && <Text style={styles.email} numberOfLines={1}>{email}</Text>}
      </View>
      {balance !== 0 && (
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>
            {balance > 0 ? 'owes you' : 'you owe'}
          </Text>
          <Text style={[styles.balance, { color: balance > 0 ? Colors.owed : Colors.owes }]}>
            {formatCurrency(Math.abs(balance), currency)}
          </Text>
        </View>
      )}
      {balance === 0 && (
        <Text style={styles.settled}>settled up</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  pressed: {
    backgroundColor: Colors.gray50,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  email: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  balanceContainer: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 1,
  },
  balance: {
    fontSize: 15,
    fontWeight: '700',
  },
  settled: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: '500',
  },
});
