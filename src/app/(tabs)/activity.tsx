import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFocusEffect, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { ExpenseRow } from '../../components/ExpenseRow';
import { useDatabase } from '../../hooks/useDatabase';
import { useFadeIn } from '../../hooks/useAnimations';
import { activityRepo } from '../../repositories/activityRepo';
import type { ActivityItem } from '../../models';

export default function ActivityScreen() {
  const { db } = useDatabase();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const headerAnim = useFadeIn(0, 400);

  const loadActivity = useCallback(() => {
    if (!db) return;
    setItems(activityRepo.getAll(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      headerAnim.enter();
      loadActivity();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadActivity])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadActivity();
    setTimeout(() => setRefreshing(false), 300);
  }, [loadActivity]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.header, headerAnim.animatedStyle]}>
        <Text style={styles.title}>Activity</Text>
      </Animated.View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="history" size={56} color={Colors.gray300} />
          <Text style={styles.emptyText}>No activity yet</Text>
          <Text style={styles.emptySubtext}>Your expenses and payments will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <ExpenseRow
              index={index}
              description={item.description}
              amount={item.amount}
              currency={item.currency}
              date={item.date}
              paidByName={item.creator_name}
              yourShare={-item.your_share}
              isPayment={item.type === 'payment'}
              onPress={() => router.push(`/expense/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
  },
  list: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
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
  },
});
