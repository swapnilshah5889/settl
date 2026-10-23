import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Avatar } from '../../components/Avatar';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { useDatabase } from '../../hooks/useDatabase';
import { useFadeIn } from '../../hooks/useAnimations';
import { userRepo } from '../../repositories/userRepo';

export default function AccountScreen() {
  const { db, currentUser, refreshUser } = useDatabase();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser?.first_name ?? '');
  const [lastName, setLastName] = useState(currentUser?.last_name ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const profileAnim = useFadeIn(100, 500);
  const menuAnim = useFadeIn(200, 400);

  useEffect(() => {
    profileAnim.enter();
    menuAnim.enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!db || !currentUser) return;
    await userRepo.updateUser(db, currentUser.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim() || null,
      email: email.trim() || null,
    });
    refreshUser();
    setEditing(false);
  };

  if (!currentUser) return null;

  const fullName = currentUser.last_name
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser.first_name;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Account</Text>

        <Animated.View style={[styles.profileCard, profileAnim.animatedStyle]}>
          <Avatar name={fullName} size={72} imageUri={currentUser.image_uri} />
          <Text style={styles.profileName}>{fullName}</Text>
          {currentUser.email && <Text style={styles.profileEmail}>{currentUser.email}</Text>}
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyBadgeText}>{currentUser.default_currency}</Text>
          </View>
        </Animated.View>

        <Animated.View style={menuAnim.animatedStyle}>
          {editing ? (
            <View style={styles.editCard}>
              <Text style={styles.editLabel}>First Name</Text>
              <TextInput
                style={styles.editInput}
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={Colors.textLight}
              />
              <Text style={styles.editLabel}>Last Name</Text>
              <TextInput
                style={styles.editInput}
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={Colors.textLight}
              />
              <Text style={styles.editLabel}>Email</Text>
              <TextInput
                style={styles.editInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor={Colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.editActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <AnimatedPressable style={styles.menuItem} onPress={() => {
              setFirstName(currentUser.first_name);
              setLastName(currentUser.last_name ?? '');
              setEmail(currentUser.email ?? '');
              setEditing(true);
            }}>
              <MaterialCommunityIcons name="account-edit" size={22} color={Colors.primary} />
              <Text style={styles.menuText}>Edit Profile</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.gray400} />
            </AnimatedPressable>
          )}
        </Animated.View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>Settl v1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="database" size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>All data stored locally on device</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 20,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
  },
  profileEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  currencyBadge: {
    marginTop: 12,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  currencyBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  editCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 12,
  },
  editInput: {
    backgroundColor: Colors.gray50,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  infoSection: {
    marginTop: 20,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
});
