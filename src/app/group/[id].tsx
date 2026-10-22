import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Avatar } from '../../components/Avatar';
import { ExpenseRow } from '../../components/ExpenseRow';
import { useDatabase } from '../../hooks/useDatabase';
import { groupRepo } from '../../repositories/groupRepo';
import { expenseRepo } from '../../repositories/expenseRepo';
import { getGroupBalances } from '../../services/balanceCalculator';
import { simplifyDebts } from '../../services/debtSimplifier';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Group, Friend, Expense, MemberBalance, SettlementSuggestion } from '../../models';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, currentUser } = useDatabase();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<(Friend | null)[]>([]);
  const [expenses, setExpenses] = useState<(Expense & { your_share: number; creator_name: string })[]>([]);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [settlements, setSettlements] = useState<SettlementSuggestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'expenses' | 'balances'>('expenses');

  const load = useCallback(() => {
    if (!db || !id) return;
    const groupId = parseInt(id);
    const g = groupRepo.getById(db, groupId);
    setGroup(g);

    const memberFriends = groupRepo.getMemberFriends(db, groupId);
    setMembers(memberFriends);

    const groupBalances = getGroupBalances(db, groupId);
    setBalances(groupBalances);
    setSettlements(simplifyDebts(groupBalances));

    const exps = db.getAllSync<Expense & { your_share: number; creator_name: string }>(
      `SELECT e.*,
        COALESCE(
          (SELECT s.owed_amount - s.paid_amount FROM shares s WHERE s.expense_id = e.id AND s.friend_id IS NULL),
          0
        ) as your_share,
        CASE WHEN e.created_by IS NULL THEN 'You'
             ELSE COALESCE(f.first_name, 'Unknown')
        END as creator_name
      FROM expenses e
      LEFT JOIN friends f ON f.id = e.created_by
      WHERE e.group_id = ? AND e.deleted_at IS NULL
      ORDER BY e.date DESC`,
      groupId
    );
    setExpenses(exps);
  }, [db, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
    setTimeout(() => setRefreshing(false), 300);
  }, [load]);

  if (!group) return null;
  const currency = currentUser?.default_currency ?? 'USD';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </Pressable>
        <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.memberAvatars}>
        {members.slice(0, 5).map((m, i) => (
          <View key={i} style={[styles.avatarWrap, { marginLeft: i > 0 ? -10 : 0, zIndex: 10 - i }]}>
            <Avatar
              name={m ? (m.last_name ? `${m.first_name} ${m.last_name}` : m.first_name) : 'You'}
              size={36}
            />
          </View>
        ))}
        <Text style={styles.memberCount}>{members.length} members</Text>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'expenses' && styles.tabActive]}
          onPress={() => setTab('expenses')}
        >
          <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>Expenses</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'balances' && styles.tabActive]}
          onPress={() => setTab('balances')}
        >
          <Text style={[styles.tabText, tab === 'balances' && styles.tabTextActive]}>Balances</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {tab === 'expenses' ? (
          <View style={styles.listContainer}>
            {expenses.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="receipt" size={48} color={Colors.gray300} />
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>Add an expense from the + tab</Text>
              </View>
            ) : (
              expenses.map((e) => (
                <ExpenseRow
                  key={e.id}
                  description={e.description}
                  amount={e.amount}
                  currency={e.currency}
                  date={e.date}
                  paidByName={e.creator_name}
                  yourShare={-e.your_share}
                  isPayment={e.is_payment === 1}
                  onPress={() => router.push(`/expense/${e.id}`)}
                />
              ))
            )}
          </View>
        ) : (
          <View style={styles.balancesContainer}>
            <View style={styles.balanceCard}>
              <Text style={styles.balanceTitle}>Member Balances</Text>
              {balances.map((b, i) => (
                <View key={i} style={styles.balanceRow}>
                  <Avatar name={b.name} size={34} />
                  <Text style={styles.balanceName}>{b.name}</Text>
                  <Text
                    style={[
                      styles.balanceAmount,
                      { color: b.amount === 0 ? Colors.textSecondary : b.amount > 0 ? Colors.owed : Colors.owes },
                    ]}
                  >
                    {b.amount === 0 ? 'settled' : (b.amount > 0 ? '+' : '') + formatCurrency(b.amount, currency)}
                  </Text>
                </View>
              ))}
            </View>

            {settlements.length > 0 && (
              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>Suggested Settlements</Text>
                {settlements.map((s, i) => (
                  <View key={i} style={styles.settlementRow}>
                    <View style={styles.settlementFlow}>
                      <Text style={styles.settlementName}>{s.fromName}</Text>
                      <MaterialCommunityIcons name="arrow-right" size={16} color={Colors.textSecondary} />
                      <Text style={styles.settlementName}>{s.toName}</Text>
                    </View>
                    <Text style={styles.settlementAmount}>{formatCurrency(s.amount, currency)}</Text>
                  </View>
                ))}
              </View>
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  memberAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 4,
  },
  avatarWrap: {},
  memberCount: {
    marginLeft: 8,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: Colors.gray100,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  listContainer: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  balancesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  balanceCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  balanceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  balanceName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  balanceAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  settlementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  settlementFlow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  settlementName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  settlementAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
