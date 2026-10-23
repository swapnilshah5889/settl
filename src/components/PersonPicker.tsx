import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Avatar } from './Avatar';
import { useStaggeredEntry } from '../hooks/useAnimations';

interface Person {
  id: number | null;
  name: string;
}

interface PersonPickerProps {
  people: Person[];
  selected: Set<number | null>;
  onToggle: (id: number | null) => void;
  multiSelect?: boolean;
}

function PersonRow({ person, isSelected, onToggle, index }: { person: Person; isSelected: boolean; onToggle: (id: number | null) => void; index: number }) {
  const { animatedStyle, enter } = useStaggeredEntry(index);

  useEffect(() => {
    enter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={[styles.row, isSelected && styles.selectedRow]}
        onPress={() => onToggle(person.id)}
      >
        <Avatar name={person.name} size={38} />
        <Text style={[styles.name, isSelected && styles.selectedName]}>{person.name}</Text>
        <View style={[styles.checkbox, isSelected && styles.checkedBox]}>
          {isSelected && (
            <MaterialCommunityIcons name="check" size={16} color={Colors.white} />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export function PersonPicker({ people, selected, onToggle, multiSelect = true }: PersonPickerProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {people.map((person, index) => (
        <PersonRow
          key={String(person.id)}
          person={person}
          isSelected={selected.has(person.id)}
          onToggle={onToggle}
          index={index}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 250,
  },
  content: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  selectedRow: {
    backgroundColor: Colors.primaryLight,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    marginLeft: 12,
  },
  selectedName: {
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
