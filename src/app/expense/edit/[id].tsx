import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { AmountInput } from '../../../components/AmountInput';
import { CategoryPicker } from '../../../components/CategoryPicker';
import { useDatabase } from '../../../hooks/useDatabase';
import { expenseRepo } from '../../../repositories/expenseRepo';
import type { ExpenseWithShares } from '../../../models';

export default function EditExpense() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, currentUser } = useDatabase();
  const [expense, setExpense] = useState<ExpenseWithShares | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!db || !id) return;
    const e = expenseRepo.getWithShares(db, parseInt(id));
    if (e) {
      setExpense(e);
      setDescription(e.description);
      setAmount(e.amount.toString());
      setDate(e.date);
      setCategoryId(e.category_id);
      setNotes(e.notes ?? '');
    }
  }, [db, id]);

  const handleSave = async () => {
    if (!db || !id || !description.trim() || !amount) return;
    const expenseId = parseInt(id);
    await db.runAsync(
      `UPDATE expenses SET description = ?, amount = ?, date = ?, category_id = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`,
      description.trim(),
      parseFloat(amount),
      date,
      categoryId,
      notes.trim() || null,
      expenseId
    );
    router.back();
  };

  if (!expense) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Edit Expense</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <AmountInput
            value={amount}
            onChangeText={setAmount}
            currency={currentUser?.default_currency ?? 'USD'}
            large
          />

          <View style={styles.card}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="What was it for?"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textLight}
            />

            <Text style={styles.label}>Category</Text>
            <CategoryPicker selectedId={categoryId} onSelect={setCategoryId} />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              placeholderTextColor={Colors.textLight}
              multiline
            />
          </View>

          <Pressable style={styles.deleteBtn} onPress={() => {
            Alert.alert('Delete Expense', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                  if (db) {
                    await expenseRepo.softDelete(db, parseInt(id));
                    router.dismiss(2);
                  }
                },
              },
            ]);
          }}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.danger} />
            <Text style={styles.deleteBtnText}>Delete Expense</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  scroll: { padding: 20 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  label: {
    fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 14,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.gray50, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: Colors.text,
  },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, marginTop: 24, borderRadius: 14,
    backgroundColor: Colors.dangerLight,
  },
  deleteBtnText: { fontSize: 15, fontWeight: '600', color: Colors.danger },
});
