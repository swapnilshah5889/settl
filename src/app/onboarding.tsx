import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useDatabase } from '../hooks/useDatabase';
import { userRepo } from '../repositories/userRepo';
import { CURRENCIES } from '../constants/currencies';

export default function Onboarding() {
  const { db, refreshUser } = useDatabase();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showCurrencies, setShowCurrencies] = useState(false);

  const canSubmit = firstName.trim().length > 0;

  const handleSubmit = async () => {
    if (!db || !canSubmit) return;
    await userRepo.createUser(db, {
      first_name: firstName.trim(),
      last_name: lastName.trim() || undefined,
      email: email.trim() || undefined,
      default_currency: currency,
    });
    refreshUser();
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="handshake" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Welcome to Settl</Text>
          <Text style={styles.subtitle}>Split expenses with friends, effortlessly</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>What's your name?</Text>
          <View style={styles.nameRow}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="First name"
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

          <Text style={styles.label}>Email (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={Colors.textLight}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Default currency</Text>
          <Pressable
            style={styles.currencyPicker}
            onPress={() => setShowCurrencies(!showCurrencies)}
          >
            <Text style={styles.currencyText}>
              {CURRENCIES.find(c => c.code === currency)?.symbol} {currency}
            </Text>
            <MaterialCommunityIcons
              name={showCurrencies ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={Colors.textSecondary}
            />
          </Pressable>
          {showCurrencies && (
            <View style={styles.currencyList}>
              {CURRENCIES.map((c) => (
                <Pressable
                  key={c.code}
                  style={[styles.currencyItem, c.code === currency && styles.currencySelected]}
                  onPress={() => { setCurrency(c.code); setShowCurrencies(false); }}
                >
                  <Text style={styles.currencySymbol}>{c.symbol}</Text>
                  <Text style={styles.currencyCode}>{c.code}</Text>
                  <Text style={styles.currencyName}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.white} />
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
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
  currencyPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
  },
  currencyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  currencyList: {
    marginTop: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gray200,
    maxHeight: 200,
    overflow: 'hidden',
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.gray200,
  },
  currencySelected: {
    backgroundColor: Colors.primaryLight,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    width: 40,
  },
  currencyName: {
    fontSize: 14,
    color: Colors.textSecondary,
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
