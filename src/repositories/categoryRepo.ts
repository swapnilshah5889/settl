import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category } from '../models';

export const categoryRepo = {
  getAll(db: SQLiteDatabase): Category[] {
    return db.getAllSync<Category>('SELECT * FROM categories WHERE parent_id IS NULL ORDER BY name');
  },

  getSubcategories(db: SQLiteDatabase, parentId: number): Category[] {
    return db.getAllSync<Category>('SELECT * FROM categories WHERE parent_id = ? ORDER BY name', parentId);
  },

  getById(db: SQLiteDatabase, id: number): Category | null {
    return db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?', id);
  },

  getAllFlat(db: SQLiteDatabase): Category[] {
    return db.getAllSync<Category>('SELECT * FROM categories ORDER BY parent_id NULLS FIRST, name');
  },
};
