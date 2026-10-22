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
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { PersonPicker } from '../../components/PersonPicker';
import { useDatabase } from '../../hooks/useDatabase';
import { friendRepo } from '../../repositories/friendRepo';
import { groupRepo } from '../../repositories/groupRepo';
import type { Friend, GroupType } from '../../models';

const GROUP_TYPES: { key: GroupType; label: string; icon: string; color: string }[] = [
  { key: 'home', label: 'Home', icon: 'home', color: '#FF6B6B' },
  { key: 'trip', label: 'Trip', icon: 'airplane', color: '#45B7D1' },
  { key: 'couple', label: 'Couple', icon: 'heart', color: '#FF85A2' },
  { key: 'other', label: 'Other', icon: 'account-group', color: '#4ECDC4' },
];

export default function CreateGroup() {
  const { db } = useDatabase();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('other');
  const [simplifyDebts, setSimplifyDebts] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<number | null>>(new Set([null]));

  useEffect(() => {
    if (!db) return;
    setFriends(friendRepo.getAll(db));
  }, [db]);

  const people = [
    { id: null as number | null, name: 'You' },
    ...friends.map((f) => ({
      id: f.id as number | null,
      name: f.last_name ? `${f.first_name} ${f.last_name}` : f.first_name,
    })),
  ];

  const toggleMember = (id: number | null) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (id === null) return next;
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!db || !name.trim()) return;
    const groupId = await groupRepo.create(
      db,
      { name: name.trim(), group_type: groupType, simplify_debts: simplifyDebts },
      Array.from(selectedMembers)
    );
    router.back();
    setTimeout(() => router.push(`/group/${groupId}`), 100);
  };

  const canSave = name.trim().length > 0 && selectedMembers.size >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Create Group</Text>
          <Pressable onPress={handleCreate} disabled={!canSave} hitSlop={12}>
            <Text style={[styles.saveText, !canSave && { opacity: 0.4 }]}>Create</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.nameSection}>
            <View style={styles.groupIconLarge}>
              <MaterialCommunityIcons
                name={(GROUP_TYPES.find(t => t.key === groupType)?.icon as any) ?? 'account-group'}
                size={36}
                color={GROUP_TYPES.find(t => t.key === groupType)?.color ?? Colors.primary}
              />
            </View>
            <TextInput
              style={styles.nameInput}
              placeholder="Group name"
              placeholderTextColor={Colors.textLight}
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Type</Text>
            <View style={styles.typeRow}>
              {GROUP_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.typeBtn, groupType === t.key && { backgroundColor: t.color + '20', borderColor: t.color }]}
                  onPress={() => setGroupType(t.key)}
                >
                  <MaterialCommunityIcons name={t.icon as any} size={22} color={groupType === t.key ? t.color : Colors.gray400} />
                  <Text style={[styles.typeLabel, groupType === t.key && { color: t.color }]}>{t.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Members</Text>
            <PersonPicker
              people={people}
              selected={selectedMembers}
              onToggle={toggleMember}
            />
            {friends.length === 0 && (
              <Pressable style={styles.addFriendHint} onPress={() => router.push('/friend/add')}>
                <MaterialCommunityIcons name="account-plus" size={18} color={Colors.primary} />
                <Text style={styles.addFriendText}>Add friends first</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={styles.simplifyRow}
            onPress={() => setSimplifyDebts(!simplifyDebts)}
          >
            <View style={styles.simplifyInfo}>
              <Text style={styles.simplifyLabel}>Simplify debts</Text>
              <Text style={styles.simplifyHint}>Minimize the number of payments between members</Text>
            </View>
            <View style={[styles.toggle, simplifyDebts && styles.toggleActive]}>
              <View style={[styles.toggleDot, simplifyDebts && styles.toggleDotActive]} />
            </View>
          </Pressable>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  scroll: {
    padding: 20,
  },
  nameSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  groupIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  nameInput: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 6,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  addFriendHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addFriendText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  simplifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
  },
  simplifyInfo: {
    flex: 1,
  },
  simplifyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  simplifyHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.gray300,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleActive: {
    backgroundColor: Colors.primary,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
});
