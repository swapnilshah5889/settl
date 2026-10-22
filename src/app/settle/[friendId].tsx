import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Avatar } from '../../components/Avatar';
import { AmountInput } from '../../components/AmountInput';
import { useDatabase } from '../../hooks/useDatabase';
import { friendRepo } from '../../repositories/friendRepo';
import { expenseRepo } from '../../repositories/expenseRepo';
import { getFriendBalance } from '../../services/balanceCalculator';
import { createSettlementShares } from '../../services/splitCalculator';
import { formatCurrency } from '../../utils/formatCurrency';
import { toISODate } from '../../utils/dateUtils';
import type { Friend } from '../../models';

export default function SettleUp() {
  const { friendId } = useLocalSearchParams<{ friendId: string }>();
  const { db, currentUser } = useDatabase();
  const [friend, setFriend] = useState<Friend | null>(null);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const currency = currentUser?.default_currency ?? 'USD';

  useEffect(() => {
    if (!db || !friendId) return;
    const id = parseInt(friendId);
    const f = friendRepo.getById(db, id);
    setFriend(f);

    if (f) {
      const bal = getFriendBalance(db, f.id);
      setBalance(bal);
      if (bal !== 0) {
        setAmount(Math.abs(bal).toFixed(2));
      }
    }
  }, [db, friendId]);

  if (!friend) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.settlement} />
        </View>
      </SafeAreaView>
    );
  }

  const fullName = friend.last_name
    ? `${friend.first_name} ${friend.last_name}`
    : friend.first_name;

  // positive balance = friend owes you, negative = you owe friend
  const youOwe = balance < 0;
  const parsedAmount = parseFloat(amount) || 0;

  const handleRecordPayment = async () => {
    if (!db || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than zero.');
      return;
    }

    setSaving(true);
    try {
      // If you owe them: you are paying them (you paid, they receive)
      //   fromFriendId = null (you), toFriendId = friend.id
      // If they owe you: they are paying you (they paid, you receive)
      //   fromFriendId = friend.id, toFriendId = null (you)
      const fromId = youOwe ? null : friend.id;
      const toId = youOwe ? friend.id : null;
      const shares = createSettlementShares(parsedAmount, fromId, toId);

      await expenseRepo.create(
        db,
        {
          description: `Settlement with ${fullName}`,
          amount: parsedAmount,
          currency,
          date: toISODate(),
          is_payment: true,
          split_type: 'exact',
        },
        shares.map((s) => ({
          friend_id: s.friendId,
          paid_amount: s.paidAmount,
          owed_amount: s.owedAmount,
        }))
      );

      router.dismiss(2);
    } catch (error) {
      Alert.alert('Error', 'Failed to record payment. Please try again.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Settle Up</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Avatar pair with direction arrow */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarColumn}>
              <Avatar name={currentUser?.first_name ?? 'You'} size={64} />
              <Text style={styles.avatarLabel} numberOfLines={1}>
                You
              </Text>
            </View>

            <View style={styles.arrowContainer}>
              <View style={styles.arrowLine} />
              <View style={styles.arrowIconWrapper}>
                <MaterialCommunityIcons
                  name={youOwe ? 'arrow-right' : 'arrow-left'}
                  size={24}
                  color={Colors.settlement}
                />
              </View>
              <Text style={styles.arrowLabel}>
                {youOwe ? 'paying' : 'receiving'}
              </Text>
            </View>

            <View style={styles.avatarColumn}>
              <Avatar name={fullName} size={64} imageUri={friend.image_uri} />
              <Text style={styles.avatarLabel} numberOfLines={1}>
                {friend.first_name}
              </Text>
            </View>
          </View>

          {/* Balance summary */}
          <View style={styles.balanceSummary}>
            <Text style={styles.balanceSummaryText}>
              {balance === 0 ? (
                'You are all settled up'
              ) : youOwe ? (
                <>
                  You owe{' '}
                  <Text style={{ color: Colors.owes }}>
                    {fullName} {formatCurrency(Math.abs(balance), currency)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ color: Colors.owed }}>
                    {fullName}
                  </Text>
                  {' '}owes you{' '}
                  <Text style={{ color: Colors.owed }}>
                    {formatCurrency(balance, currency)}
                  </Text>
                </>
              )}
            </Text>
          </View>

          {/* Amount input */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Payment amount</Text>
            <View style={styles.amountInputWrapper}>
              <AmountInput
                value={amount}
                onChangeText={setAmount}
                currency={currency}
                large
              />
            </View>
            {parsedAmount > Math.abs(balance) && balance !== 0 && (
              <Text style={styles.overpayWarning}>
                This exceeds the outstanding balance
              </Text>
            )}
          </View>
        </View>

        {/* Record Payment button */}
        <View style={styles.footer}>
          <Pressable
            style={[
              styles.recordButton,
              (saving || parsedAmount <= 0) && styles.recordButtonDisabled,
            ]}
            onPress={handleRecordPayment}
            disabled={saving || parsedAmount <= 0}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="handshake"
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.recordButtonText}>Record Payment</Text>
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 20,
  },
  avatarColumn: {
    alignItems: 'center',
    width: 80,
  },
  avatarLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  arrowLine: {
    position: 'absolute',
    top: 18,
    width: 60,
    height: 2,
    backgroundColor: Colors.settlement,
    opacity: 0.3,
  },
  arrowIconWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.settlement,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  arrowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.settlement,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceSummary: {
    alignItems: 'center',
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  balanceSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginTop: 36,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  amountInputWrapper: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  overpayWarning: {
    fontSize: 13,
    color: Colors.warning,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.settlement,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: Colors.settlement,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonDisabled: {
    opacity: 0.5,
  },
  recordButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
