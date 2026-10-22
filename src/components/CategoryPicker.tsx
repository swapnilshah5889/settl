import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useDatabase } from '../hooks/useDatabase';
import { categoryRepo } from '../repositories/categoryRepo';
import type { Category } from '../models';

interface CategoryPickerProps {
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function CategoryPicker({ selectedId, onSelect }: CategoryPickerProps) {
  const { db } = useDatabase();
  const [visible, setVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<Category | null>(null);

  useEffect(() => {
    if (!db) return;
    setCategories(categoryRepo.getAll(db));
    if (selectedId) {
      setSelected(categoryRepo.getById(db, selectedId));
    }
  }, [db, selectedId]);

  return (
    <>
      <Pressable style={styles.trigger} onPress={() => setVisible(true)}>
        <MaterialCommunityIcons
          name={(selected?.icon as any) || 'tag'}
          size={20}
          color={Colors.primary}
        />
        <Text style={styles.triggerText}>
          {selected?.name || 'Category'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={18} color={Colors.textSecondary} />
      </Pressable>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Category</Text>
            <Pressable onPress={() => setVisible(false)} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={categories}
            keyExtractor={(item) => String(item.id)}
            numColumns={3}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.categoryItem,
                  selectedId === item.id && styles.selectedItem,
                ]}
                onPress={() => {
                  onSelect(item.id);
                  setSelected(item);
                  setVisible(false);
                }}
              >
                <View style={[styles.categoryIcon, selectedId === item.id && styles.selectedIcon]}>
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={28}
                    color={selectedId === item.id ? Colors.white : Colors.primary}
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.gray50,
    borderRadius: 12,
    gap: 8,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  modal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  grid: {
    padding: 12,
  },
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
  },
  selectedItem: {
    backgroundColor: Colors.primaryLight,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedIcon: {
    backgroundColor: Colors.primary,
  },
  categoryName: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
});
