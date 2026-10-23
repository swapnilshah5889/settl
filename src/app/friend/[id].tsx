import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Avatar } from '../../components/Avatar';
import { ExpenseRow } from '../../components/ExpenseRow';
import { useDatabase } from '../../hooks/useDatabase';
import { friendRepo } from '../../repositories/friendRepo';
import { getFriendBalance } from '../../services/balanceCalculator';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Friend, Expense } from '../../models';

export default function FriendDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, currentUser } = useDatabase();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [balance, setBalance] = useState(0);
  const [expenses, setExpenses] = useState<(Expense & { your_share: number })[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!db || !id) return;
      const friendId = parseInt(id);
      const f = friendRepo.getById(db, friendId);
      setFriend(f);

      if (f) {
        setBalance(getFriendBalance(db, f.id));

        const shared = db.getAllSync<Expense & { your_share: number }>(
          `SELECT e.*,
            COALESCE(
              (SELECT s.owed_amount - s.paid_amount FROM shares s WHERE s.expense_id = e.id AND s.friend_id IS NULL),
              0
            ) as your_share
          FROM expenses e
          WHERE e.deleted_at IS NULL
            AND e.id IN (
              SELECT expense_id FROM shares WHERE friend_id = ?
              INTERSECT
              SELECT expense_id FROM shares WHERE friend_id IS NULL
            )
          ORDER BY e.date DESC`,
          friendId
        );
        setExpenses(shared);
      }
    }, [db, id])
  );

  if (!friend) return null;

  const fullName = friend.last_name ? `${friend.first_name} ${friend.last_name}` : friend.first_name;
  const currency = currentUser?.default_currency ?? 'USD';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Pressable
          onPress={() => {
            Alert.alert('Remove friend', `Remove ${fullName}?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                  if (db) {
                    await friendRepo.remove(db, friend.id);
                    router.back();
                  }
                },
              },
            ]);
          }}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.danger} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar name={fullName} size={72} imageUri={friend.image_uri} />
          <Text style={styles.name}>{fullName}</Text>
          {friend.email && <Text style={styles.email}>{friend.email}</Text>}

          <View style={[styles.balanceBadge, { backgroundColor: balance === 0 ? Colors.gray100 : balance > 0 ? Colors.successLight : Colors.dangerLight }]}>
            <Text style={[styles.balanceText, { color: balance === 0 ? Colors.textSecondary : balance > 0 ? Colors.owed : Colors.owes }]}>
              {balance === 0
                ? 'All settled up'
                : balance > 0
                  ? `${fullName} owes you ${formatCurrency(balance, currency)}`
                  : `You owe ${fullName} ${formatCurrency(Math.abs(balance), currency)}`}
            </Text>
          </View>

          {balance !== 0 && (
            <Pressable
              style={styles.settleButton}
              onPress={() => router.push(`/settle/${friend.id}`)}
            >
              <MaterialCommunityIcons name="handshake" size={18} color={Colors.white} />
              <Text style={styles.settleButtonText}>Settle Up</Text>
            </Pressable>
          )}
        </View>

        {expenses.length > 0 && (
          <View style={styles.expensesSection}>
            <Text style={styles.sectionTitle}>Shared Expenses</Text>
            <View style={styles.expensesList}>
              {expenses.map((e) => (
                <ExpenseRow
                  key={e.id}
                  description={e.description}
                  amount={e.amount}
                  currency={e.currency}
                  date={e.date}
                  paidByName={e.created_by === friend.id ? friend.first_name : 'You'}
                  yourShare={-e.your_share}
                  isPayment={e.is_payment === 1}
                  onPress={() => router.push(`/expense/${e.id}`)}
                />
              ))}
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 14,
  },
  email: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  balanceBadge: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  balanceText: {
    fontSize: 15,
    fontWeight: '700',
  },
  settleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 16,
  },
  settleButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  expensesSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  expensesList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
