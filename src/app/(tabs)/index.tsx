import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { BalanceCard } from '../../components/BalanceCard';
import { FriendRow } from '../../components/FriendRow';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { useDatabase } from '../../hooks/useDatabase';
import { useFriends } from '../../hooks/useFriends';
import { useFadeIn } from '../../hooks/useAnimations';
import { getTotalBalance } from '../../services/balanceCalculator';

export default function Dashboard() {
  const { db, currentUser } = useDatabase();
  const { friends, refresh } = useFriends();
  const [balance, setBalance] = useState({ owe: 0, owed: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useFadeIn(0, 400);
  const settleAnim = useFadeIn(200, 400);

  useFocusEffect(
    useCallback(() => {
      if (!db) return;
      headerAnim.enter();
      settleAnim.enter();
      setBalance(getTotalBalance(db));
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, refresh])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (db) {
      setBalance(getTotalBalance(db));
      refresh();
    }
    setTimeout(() => setRefreshing(false), 300);
  }, [db, refresh]);

  const friendsWithDebts = friends.filter((f) => f.balance !== 0);
  const currency = currentUser?.default_currency ?? 'USD';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, headerAnim.animatedStyle]}>
        <View>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{currentUser?.first_name ?? 'there'}</Text>
        </View>
        <Pressable
          style={styles.addFriendBtn}
          onPress={() => router.push('/friend/add')}
        >
          <MaterialCommunityIcons name="account-plus" size={22} color={Colors.primary} />
        </Pressable>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <BalanceCard owe={balance.owe} owed={balance.owed} currency={currency} />

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Friends</Text>
            <Pressable onPress={() => router.push('/friend/add')}>
              <Text style={styles.seeAll}>+ Add</Text>
            </Pressable>
          </View>

          {friends.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-group-outline" size={48} color={Colors.gray300} />
              <Text style={styles.emptyText}>No friends yet</Text>
              <Text style={styles.emptySubtext}>Add friends to start splitting expenses</Text>
              <Pressable style={styles.emptyButton} onPress={() => router.push('/friend/add')}>
                <Text style={styles.emptyButtonText}>Add Friend</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.friendsList}>
              {friends.map((friend, i) => (
                <FriendRow
                  key={friend.id}
                  index={i}
                  name={friend.last_name ? `${friend.first_name} ${friend.last_name}` : friend.first_name}
                  email={friend.email}
                  balance={friend.balance}
                  currency={currency}
                  imageUri={friend.image_uri}
                  onPress={() => router.push(`/friend/${friend.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {friendsWithDebts.length > 0 && (
          <Animated.View style={[styles.section, settleAnim.animatedStyle]}>
            <Text style={styles.sectionTitle}>Quick Settle Up</Text>
            {friendsWithDebts.map((friend) => (
              <AnimatedPressable
                key={friend.id}
                style={styles.settleRow}
                onPress={() => router.push(`/settle/${friend.id}`)}
              >
                <View style={styles.settleInfo}>
                  <Text style={styles.settleName}>
                    {friend.first_name}
                  </Text>
                  <Text
                    style={[
                      styles.settleAmount,
                      { color: friend.balance > 0 ? Colors.owed : Colors.owes },
                    ]}
                  >
                    {friend.balance > 0 ? 'owes you' : 'you owe'}{' '}
                    {Math.abs(friend.balance).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.settleBtn}>
                  <Text style={styles.settleBtnText}>Settle</Text>
                </View>
              </AnimatedPressable>
            ))}
          </Animated.View>
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
    paddingBottom: 4,
  },
  greeting: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  addFriendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  friendsList: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: Colors.surface,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  settleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  settleInfo: {
    flex: 1,
  },
  settleName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  settleAmount: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  settleBtn: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleBtnText: {
    color: Colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
