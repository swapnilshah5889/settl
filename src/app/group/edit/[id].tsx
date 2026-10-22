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
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../../constants/colors';
import { PersonPicker } from '../../../components/PersonPicker';
import { useDatabase } from '../../../hooks/useDatabase';
import { friendRepo } from '../../../repositories/friendRepo';
import { groupRepo } from '../../../repositories/groupRepo';
import type { Friend, GroupType } from '../../../models';

const GROUP_TYPES: { key: GroupType; label: string; icon: string; color: string }[] = [
  { key: 'home', label: 'Home', icon: 'home', color: '#FF6B6B' },
  { key: 'trip', label: 'Trip', icon: 'airplane', color: '#45B7D1' },
  { key: 'couple', label: 'Couple', icon: 'heart', color: '#FF85A2' },
  { key: 'other', label: 'Other', icon: 'account-group', color: '#4ECDC4' },
];

export default function EditGroup() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [name, setName] = useState('');
  const [groupType, setGroupType] = useState<GroupType>('other');
  const [simplifyDebts, setSimplifyDebts] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<number | null>>(new Set([null]));

  useEffect(() => {
    if (!db || !id) return;
    const groupId = parseInt(id);
    const group = groupRepo.getById(db, groupId);
    if (group) {
      setName(group.name);
      setGroupType(group.group_type as GroupType);
      setSimplifyDebts(group.simplify_debts === 1);
    }
    const members = groupRepo.getMembers(db, groupId);
    setSelectedMembers(new Set(members.map((m) => m.friend_id)));
    setFriends(friendRepo.getAll(db));
  }, [db, id]);

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

  const handleSave = async () => {
    if (!db || !id || !name.trim()) return;
    const groupId = parseInt(id);
    await groupRepo.update(db, groupId, {
      name: name.trim(),
      group_type: groupType,
      simplify_debts: simplifyDebts ? 1 : 0,
    });
    await groupRepo.setMembers(db, groupId, Array.from(selectedMembers));
    router.back();
  };

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
          <Text style={styles.title}>Edit Group</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Group name"
            placeholderTextColor={Colors.textLight}
          />

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

          <Text style={styles.sectionLabel}>Members</Text>
          <PersonPicker people={people} selected={selectedMembers} onToggle={toggleMember} />

          <Pressable style={styles.simplifyRow} onPress={() => setSimplifyDebts(!simplifyDebts)}>
            <Text style={styles.simplifyLabel}>Simplify debts</Text>
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  scroll: { padding: 20 },
  nameInput: {
    backgroundColor: Colors.surface, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'center',
    borderWidth: 1, borderColor: Colors.gray200, marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14, fontWeight: '600', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 2, borderColor: 'transparent', gap: 6,
  },
  typeLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  simplifyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginTop: 24,
  },
  simplifyLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
  toggle: {
    width: 52, height: 30, borderRadius: 15, backgroundColor: Colors.gray300,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleActive: { backgroundColor: Colors.primary },
  toggleDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.white },
  toggleDotActive: { alignSelf: 'flex-end' as const },
});
