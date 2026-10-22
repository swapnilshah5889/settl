import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { AmountInput } from '../../components/AmountInput';
import { CategoryPicker } from '../../components/CategoryPicker';
import { PersonPicker } from '../../components/PersonPicker';
import { useDatabase } from '../../hooks/useDatabase';
import { friendRepo } from '../../repositories/friendRepo';
import { groupRepo } from '../../repositories/groupRepo';
import { expenseRepo } from '../../repositories/expenseRepo';
import { splitEqual, splitExact, splitPercentage, splitByShares } from '../../services/splitCalculator';
import { toISODate } from '../../utils/dateUtils';
import type { Friend, Group, SplitType } from '../../models';

export default function AddExpense() {
  const { db, currentUser } = useDatabase();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toISODate());
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [paidById, setPaidById] = useState<number | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<number | null>>(new Set([null]));
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [exactAmounts, setExactAmounts] = useState<Map<number | null, string>>(new Map());
  const [percentages, setPercentages] = useState<Map<number | null, string>>(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!db) return;
      setFriends(friendRepo.getAll(db));
      setGroups(groupRepo.getAll(db));
    }, [db])
  );

  useEffect(() => {
    if (selectedGroupId && db) {
      const members = groupRepo.getMembers(db, selectedGroupId);
      const memberIds = new Set(members.map((m) => m.friend_id));
      setSelectedMembers(memberIds);
    }
  }, [selectedGroupId, db]);

  const people = [
    { id: null, name: 'You' },
    ...friends.map((f) => ({
      id: f.id as number | null,
      name: f.last_name ? `${f.first_name} ${f.last_name}` : f.first_name,
    })),
  ];

  const toggleMember = (id: number | null) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!db) return;
    const numAmount = parseFloat(amount);
    if (!description.trim() || isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Missing info', 'Please enter a description and amount.');
      return;
    }
    if (selectedMembers.size < 2) {
      Alert.alert('Need more people', 'Select at least 2 people to split with.');
      return;
    }

    const memberIds = Array.from(selectedMembers);
    let shares;

    switch (splitType) {
      case 'equal':
        shares = splitEqual(numAmount, paidById, memberIds);
        break;
      case 'exact': {
        const map = new Map<number | null, number>();
        for (const id of memberIds) {
          map.set(id, parseFloat(exactAmounts.get(id) ?? '0'));
        }
        shares = splitExact(numAmount, paidById, map);
        break;
      }
      case 'percentage': {
        const map = new Map<number | null, number>();
        for (const id of memberIds) {
          map.set(id, parseFloat(percentages.get(id) ?? '0'));
        }
        shares = splitPercentage(numAmount, paidById, map);
        break;
      }
      default:
        shares = splitEqual(numAmount, paidById, memberIds);
    }

    await expenseRepo.create(
      db,
      {
        group_id: selectedGroupId ?? undefined,
        description: description.trim(),
        amount: numAmount,
        currency: currentUser?.default_currency ?? 'USD',
        date,
        category_id: categoryId ?? undefined,
        split_type: splitType,
        notes: notes.trim() || undefined,
      },
      shares.map((s) => ({
        friend_id: s.friendId,
        paid_amount: s.paidAmount,
        owed_amount: s.owedAmount,
      }))
    );

    setDescription('');
    setAmount('');
    setNotes('');
    setCategoryId(null);
    setSplitType('equal');
    setSelectedMembers(new Set([null]));
    setSelectedGroupId(null);

    router.back();
  };

  const splitTypes: { key: SplitType; label: string; icon: string }[] = [
    { key: 'equal', label: 'Equal', icon: 'equal' },
    { key: 'exact', label: 'Exact', icon: 'numeric' },
    { key: 'percentage', label: '%', icon: 'percent' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Add Expense</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.amountSection}>
            <AmountInput
              value={amount}
              onChangeText={setAmount}
              currency={currentUser?.default_currency ?? 'USD'}
              large
            />
          </View>

          <View style={styles.card}>
            <TextInput
              style={styles.descriptionInput}
              placeholder="What was it for?"
              placeholderTextColor={Colors.textLight}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="calendar" size={20} color={Colors.textSecondary} />
              <TextInput
                style={styles.dateInput}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textLight}
              />
            </View>

            <CategoryPicker selectedId={categoryId} onSelect={setCategoryId} />

            {groups.length > 0 && (
              <View style={styles.groupSection}>
                <Text style={styles.fieldLabel}>Group (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupChips}>
                  <Pressable
                    style={[styles.chip, !selectedGroupId && styles.chipActive]}
                    onPress={() => setSelectedGroupId(null)}
                  >
                    <Text style={[styles.chipText, !selectedGroupId && styles.chipTextActive]}>None</Text>
                  </Pressable>
                  {groups.map((g) => (
                    <Pressable
                      key={g.id}
                      style={[styles.chip, selectedGroupId === g.id && styles.chipActive]}
                      onPress={() => setSelectedGroupId(g.id)}
                    >
                      <Text style={[styles.chipText, selectedGroupId === g.id && styles.chipTextActive]}>{g.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textLight}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Paid by</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paidByChips}>
              {people.map((p) => (
                <Pressable
                  key={String(p.id)}
                  style={[styles.chip, paidById === p.id && styles.chipActive]}
                  onPress={() => setPaidById(p.id)}
                >
                  <Text style={[styles.chipText, paidById === p.id && styles.chipTextActive]}>{p.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Split between</Text>
            <PersonPicker
              people={people}
              selected={selectedMembers}
              onToggle={toggleMember}
            />

            <View style={styles.splitTypeRow}>
              {splitTypes.map((st) => (
                <Pressable
                  key={st.key}
                  style={[styles.splitTypeBtn, splitType === st.key && styles.splitTypeBtnActive]}
                  onPress={() => setSplitType(st.key)}
                >
                  <MaterialCommunityIcons
                    name={st.icon as any}
                    size={18}
                    color={splitType === st.key ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[styles.splitTypeText, splitType === st.key && styles.splitTypeTextActive]}>
                    {st.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {splitType === 'exact' && (
              <View style={styles.splitDetails}>
                {Array.from(selectedMembers).map((id) => {
                  const person = people.find((p) => p.id === id);
                  return (
                    <View key={String(id)} style={styles.splitRow}>
                      <Text style={styles.splitName}>{person?.name}</Text>
                      <TextInput
                        style={styles.splitInput}
                        placeholder="0.00"
                        placeholderTextColor={Colors.textLight}
                        keyboardType="decimal-pad"
                        value={exactAmounts.get(id) ?? ''}
                        onChangeText={(text) => {
                          setExactAmounts(new Map(exactAmounts.set(id, text)));
                        }}
                      />
                    </View>
                  );
                })}
              </View>
            )}

            {splitType === 'percentage' && (
              <View style={styles.splitDetails}>
                {Array.from(selectedMembers).map((id) => {
                  const person = people.find((p) => p.id === id);
                  return (
                    <View key={String(id)} style={styles.splitRow}>
                      <Text style={styles.splitName}>{person?.name}</Text>
                      <View style={styles.percentInput}>
                        <TextInput
                          style={styles.splitInput}
                          placeholder="0"
                          placeholderTextColor={Colors.textLight}
                          keyboardType="number-pad"
                          value={percentages.get(id) ?? ''}
                          onChangeText={(text) => {
                            setPercentages(new Map(percentages.set(id, text)));
                          }}
                        />
                        <Text style={styles.percentSign}>%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <Pressable
            style={[styles.saveButton, (!description.trim() || !amount) && styles.saveButtonDisabled]}
            onPress={handleSave}
          >
            <MaterialCommunityIcons name="check" size={22} color={Colors.white} />
            <Text style={styles.saveButtonText}>Save Expense</Text>
          </Pressable>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  scroll: {
    paddingHorizontal: 16,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  descriptionInput: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    marginBottom: 12,
  },
  dateInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesInput: {
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.gray200,
    marginTop: 12,
    minHeight: 44,
  },
  groupSection: {
    marginTop: 12,
  },
  groupChips: {
    flexDirection: 'row',
  },
  paidByChips: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.gray200,
  },
  splitTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
  },
  splitTypeBtnActive: {
    backgroundColor: Colors.primary,
  },
  splitTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  splitTypeTextActive: {
    color: Colors.white,
  },
  splitDetails: {
    marginTop: 12,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  splitName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    flex: 1,
  },
  splitInput: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'right',
    width: 80,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.gray50,
    borderRadius: 8,
  },
  percentInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentSign: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
