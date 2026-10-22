import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

type SplitType = 'equal' | 'exact' | 'percentage' | 'shares';

interface SplitPickerProps {
  selected: SplitType;
  onSelect: (type: SplitType) => void;
}

const SPLIT_OPTIONS: {
  type: SplitType;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}[] = [
  { type: 'equal', icon: 'equal', label: 'Equal' },
  { type: 'exact', icon: 'numeric', label: 'Exact' },
  { type: 'percentage', icon: 'percent', label: '%' },
  { type: 'shares', icon: 'chart-pie', label: 'Shares' },
];

const TIMING_CONFIG = { duration: 250 };

function SplitOption({
  type,
  icon,
  label,
  isSelected,
  onPress,
}: {
  type: SplitType;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, TIMING_CONFIG);
    if (isSelected) {
      scale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 150 }),
      );
    }
  }, [isSelected, progress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor:
      progress.value > 0.5 ? Colors.primary : Colors.gray100,
    transform: [{ scale: scale.value }],
  }));

  const textColor = isSelected ? Colors.white : Colors.textSecondary;

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      <Animated.View style={[styles.pill, animatedStyle]}>
        <MaterialCommunityIcons name={icon} size={18} color={textColor} />
        <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function SplitPicker({ selected, onSelect }: SplitPickerProps) {
  return (
    <View style={styles.container}>
      {SPLIT_OPTIONS.map((option) => (
        <SplitOption
          key={option.type}
          type={option.type}
          icon={option.icon}
          label={option.label}
          isSelected={selected === option.type}
          onPress={() => onSelect(option.type)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
  },
  pressable: {
    flex: 1,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
