import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import { getCurrencySymbol } from '../constants/currencies';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  currency: string;
  placeholder?: string;
  large?: boolean;
}

export function AmountInput({ value, onChangeText, currency, placeholder = '0.00', large }: AmountInputProps) {
  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeText(cleaned);
  };

  return (
    <View style={[styles.container, large && styles.containerLarge]}>
      <Text style={[styles.symbol, large && styles.symbolLarge]}>
        {getCurrencySymbol(currency)}
      </Text>
      <TextInput
        style={[styles.input, large && styles.inputLarge]}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType="decimal-pad"
        returnKeyType="done"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  containerLarge: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginRight: 4,
  },
  symbolLarge: {
    fontSize: 36,
    color: Colors.text,
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    padding: 0,
  },
  inputLarge: {
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
  },
});
