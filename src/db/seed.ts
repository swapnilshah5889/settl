import type { SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '../constants/categories';

export async function seedCategories(db: SQLiteDatabase): Promise<void> {
  const count = db.getFirstSync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM categories');
  if (count && count.cnt > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    const result = await db.runAsync(
      'INSERT INTO categories (name, icon) VALUES (?, ?)',
      cat.name,
      cat.icon
    );
    if (cat.subcategories) {
      for (const sub of cat.subcategories) {
        await db.runAsync(
          'INSERT INTO categories (name, icon, parent_id) VALUES (?, ?, ?)',
          sub,
          cat.icon,
          result.lastInsertRowId
        );
      }
    }
  }
}
