import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useDatabase } from '../../hooks/useDatabase';
import { friendRepo } from '../../repositories/friendRepo';

export default function AddFriend() {
  const { db } = useDatabase();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const canSave = firstName.trim().length > 0;

  const handleSave = async () => {
    if (!db || !canSave) return;
    await friendRepo.create(db, {
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
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
            <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>Add Friend</Text>
          <Pressable
            onPress={handleSave}
            disabled={!canSave}
            hitSlop={12}
          >
            <Text style={[styles.saveText, !canSave && { opacity: 0.4 }]}>Save</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <View style={styles.avatarPreview}>
            <View style={styles.avatarCircle}>
              <MaterialCommunityIcons name="account-plus" size={36} color={Colors.primary} />
            </View>
          </View>

          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First name *"
              placeholderTextColor={Colors.textLight}
              value={firstName}
              onChangeText={setFirstName}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Last name"
              placeholderTextColor={Colors.textLight}
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Email"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="phone-outline" size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.inputWithIcon}
              placeholder="Phone"
              placeholderTextColor={Colors.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>
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
  form: {
    padding: 20,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  halfInput: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    marginBottom: 16,
    gap: 12,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
});
