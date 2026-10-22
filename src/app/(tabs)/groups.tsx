import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { GroupCard } from '../../components/GroupCard';
import { useDatabase } from '../../hooks/useDatabase';
import { groupRepo } from '../../repositories/groupRepo';
import { getGroupBalances } from '../../services/balanceCalculator';
import type { Group } from '../../models';

export default function GroupsScreen() {
  const { db, currentUser } = useDatabase();
  const [groups, setGroups] = useState<(Group & { memberCount: number; balance: number })[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadGroups = useCallback(() => {
    if (!db) return;
    const all = groupRepo.getAll(db);
    const enriched = all.map((g) => {
      const members = groupRepo.getMembers(db, g.id);
      const balances = getGroupBalances(db, g.id);
      const myBalance = balances.find((b) => b.friendId === null)?.amount ?? 0;
      return { ...g, memberCount: members.length, balance: myBalance };
    });
    setGroups(enriched);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroups();
    setTimeout(() => setRefreshing(false), 300);
  }, [loadGroups]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Groups</Text>
        <Pressable style={styles.addBtn} onPress={() => router.push('/group/create')}>
          <MaterialCommunityIcons name="plus" size={22} color={Colors.white} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {groups.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={56} color={Colors.gray300} />
            <Text style={styles.emptyText}>No groups yet</Text>
            <Text style={styles.emptySubtext}>Create a group to start splitting expenses</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push('/group/create')}>
              <MaterialCommunityIcons name="plus" size={18} color={Colors.white} />
              <Text style={styles.emptyButtonText}>Create Group</Text>
            </Pressable>
          </View>
        ) : (
          groups.map((group) => (
            <GroupCard
              key={group.id}
              name={group.name}
              groupType={group.group_type}
              memberCount={group.memberCount}
              balance={group.balance}
              currency={currentUser?.default_currency}
              onPress={() => router.push(`/group/${group.id}`)}
            />
          ))
        )}
        <View style={{ height: 32 }} />
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
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingTop: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 6,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
