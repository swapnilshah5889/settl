import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  type ScrollViewInstance,
} from 'react-native';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Avatar } from '../../components/Avatar';
import { useDatabase } from '../../hooks/useDatabase';
import { expenseRepo } from '../../repositories/expenseRepo';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatFullDate } from '../../utils/dateUtils';
import type { ExpenseWithShares } from '../../models';

interface ShareWithName {
  id: number;
  expense_id: number;
  friend_id: number | null;
  paid_amount: number;
  owed_amount: number;
  name: string;
}

interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  friend_id: number | null;
  first_name: string | null;
}

const SPLIT_TYPE_LABELS: Record<string, string> = {
  equal: 'Split equally',
  exact: 'Split by exact amounts',
  percentage: 'Split by percentages',
  shares: 'Split by shares',
};

export default function ExpenseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, currentUser } = useDatabase();
  const [expense, setExpense] = useState<ExpenseWithShares | null>(null);
  const [shares, setShares] = useState<ShareWithName[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const load = useCallback(() => {
    if (!db || !id) return;
    const expenseId = parseInt(id);
    const data = expenseRepo.getWithShares(db, expenseId);
    setExpense(data);

    if (data) {
      const resolved: ShareWithName[] = data.shares.map((s) => {
        if (s.friend_id === null) {
          return { ...s, name: 'You' };
        }
        const friend = db.getFirstSync<{ first_name: string; last_name: string | null }>(
          'SELECT first_name, last_name FROM friends WHERE id = ?',
          s.friend_id
        );
        const name = friend
          ? friend.last_name
            ? `${friend.first_name} ${friend.last_name}`
            : friend.first_name
          : 'Unknown';
        return { ...s, name };
      });
      setShares(resolved);

      setComments(expenseRepo.getComments(db, expenseId));
    }
  }, [db, id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = () => {
    Alert.alert(
      'Delete Expense',
      `Are you sure you want to delete "${expense?.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (db && id) {
              await expenseRepo.softDelete(db, parseInt(id));
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleAddComment = async () => {
    if (!db || !id || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await expenseRepo.addComment(db, parseInt(id), null, commentText.trim());
      setCommentText('');
      setComments(expenseRepo.getComments(db, parseInt(id)));
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } finally {
      setSubmitting(false);
    }
  };

  if (!expense) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const currency = expense.currency || currentUser?.default_currency || 'USD';
  const categoryIcon = expense.category?.icon || 'cash';
  const categoryName = expense.category?.name || 'General';

  const paidByName = expense.created_by === null
    ? 'You'
    : expense.creatorName;

  const netAmount = (share: ShareWithName) => share.owed_amount - share.paid_amount;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push(`/expense/edit/${expense.id}`)}
              hitSlop={12}
              style={styles.headerButton}
            >
              <MaterialCommunityIcons name="pencil-outline" size={22} color={Colors.text} />
            </Pressable>
            <Pressable onPress={handleDelete} hitSlop={12} style={styles.headerButton}>
              <MaterialCommunityIcons name="delete-outline" size={22} color={Colors.danger} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.categoryBadge}>
              <MaterialCommunityIcons
                name={categoryIcon as any}
                size={32}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.amount}>{formatCurrency(expense.amount, currency)}</Text>
            <Text style={styles.description}>{expense.description}</Text>
            {expense.is_payment === 1 && (
              <View style={styles.paymentBadge}>
                <MaterialCommunityIcons name="handshake" size={14} color={Colors.settlement} />
                <Text style={styles.paymentBadgeText}>Payment</Text>
              </View>
            )}
          </View>

          {/* Info Card */}
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name="tag-outline" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{categoryName}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name="calendar-outline" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formatFullDate(expense.date)}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name="account-outline" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.infoLabel}>Paid by</Text>
              <Text style={styles.infoValue}>{paidByName}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons name="call-split" size={18} color={Colors.textSecondary} />
              </View>
              <Text style={styles.infoLabel}>Split</Text>
              <Text style={styles.infoValue}>
                {SPLIT_TYPE_LABELS[expense.split_type] || expense.split_type}
              </Text>
            </View>
          </View>

          {/* Shares Breakdown */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Split Breakdown</Text>
          </View>
          <View style={styles.card}>
            {shares.map((share, index) => {
              const net = netAmount(share);
              return (
                <React.Fragment key={share.id}>
                  {index > 0 && <View style={styles.infoDivider} />}
                  <View style={styles.shareRow}>
                    <Avatar name={share.name} size={36} />
                    <View style={styles.shareInfo}>
                      <Text style={styles.shareName}>{share.name}</Text>
                      <Text style={styles.shareDetail}>
                        Paid {formatCurrency(share.paid_amount, currency)}
                      </Text>
                    </View>
                    <View style={styles.shareAmounts}>
                      <Text
                        style={[
                          styles.shareNet,
                          {
                            color:
                              net === 0
                                ? Colors.textSecondary
                                : net > 0
                                  ? Colors.owes
                                  : Colors.owed,
                          },
                        ]}
                      >
                        {net === 0
                          ? 'settled'
                          : net > 0
                            ? `owes ${formatCurrency(net, currency)}`
                            : `gets back ${formatCurrency(Math.abs(net), currency)}`}
                      </Text>
                    </View>
                  </View>
                </React.Fragment>
              );
            })}
          </View>

          {/* Notes Section */}
          {expense.notes ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Notes</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.notesText}>{expense.notes}</Text>
              </View>
            </>
          ) : null}

          {/* Receipt Section */}
          {expense.receipt_uri ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Receipt</Text>
              </View>
              <View style={styles.card}>
                <Image
                  source={{ uri: expense.receipt_uri }}
                  style={styles.receiptImage}
                  resizeMode="cover"
                />
              </View>
            </>
          ) : null}

          {/* Comments Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Comments{comments.length > 0 ? ` (${comments.length})` : ''}
            </Text>
          </View>
          <View style={styles.card}>
            {comments.length === 0 ? (
              <View style={styles.emptyComments}>
                <MaterialCommunityIcons
                  name="comment-outline"
                  size={28}
                  color={Colors.gray300}
                />
                <Text style={styles.emptyCommentsText}>No comments yet</Text>
              </View>
            ) : (
              comments.map((c, index) => (
                <React.Fragment key={c.id}>
                  {index > 0 && <View style={styles.infoDivider} />}
                  <View style={styles.commentRow}>
                    <Avatar
                      name={c.friend_id === null ? 'You' : c.first_name || 'Unknown'}
                      size={32}
                    />
                    <View style={styles.commentContent}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>
                          {c.friend_id === null ? 'You' : c.first_name || 'Unknown'}
                        </Text>
                        <Text style={styles.commentTime}>
                          {formatCommentTime(c.created_at)}
                        </Text>
                      </View>
                      <Text style={styles.commentText}>{c.content}</Text>
                    </View>
                  </View>
                </React.Fragment>
              ))
            )}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Add a comment..."
            placeholderTextColor={Colors.textLight}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleAddComment}
            disabled={!commentText.trim() || submitting}
            style={[
              styles.sendButton,
              (!commentText.trim() || submitting) && styles.sendButtonDisabled,
            ]}
            hitSlop={8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={Colors.white} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatCommentTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 28,
  },
  categoryBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  amount: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
  },
  description: {
    fontSize: 17,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#EDE7F6',
  },
  paymentBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.settlement,
  },

  // Cards
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },

  // Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIcon: {
    width: 28,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    width: 80,
    marginLeft: 4,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
  },
  infoDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.gray200,
  },

  // Shares
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  shareInfo: {
    flex: 1,
  },
  shareName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  shareDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  shareAmounts: {
    alignItems: 'flex-end',
  },
  shareNet: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Notes
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },

  // Receipt
  receiptImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
  },

  // Comments
  emptyComments: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyCommentsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  commentRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 10,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  commentTime: {
    fontSize: 11,
    color: Colors.textLight,
  },
  commentText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },

  // Comment input
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.gray100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.gray300,
  },
});
