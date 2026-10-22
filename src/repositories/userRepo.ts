import type { SQLiteDatabase } from 'expo-sqlite';
import type { User } from '../models';

export const userRepo = {
  getUser(db: SQLiteDatabase): User | null {
    return db.getFirstSync<User>('SELECT * FROM users LIMIT 1');
  },

  async createUser(
    db: SQLiteDatabase,
    data: { first_name: string; last_name?: string; email?: string; default_currency: string }
  ): Promise<number> {
    const result = await db.runAsync(
      'INSERT INTO users (first_name, last_name, email, default_currency) VALUES (?, ?, ?, ?)',
      data.first_name,
      data.last_name ?? null,
      data.email ?? null,
      data.default_currency
    );
    return result.lastInsertRowId;
  },

  async updateUser(
    db: SQLiteDatabase,
    id: number,
    data: Partial<Pick<User, 'first_name' | 'last_name' | 'email' | 'default_currency' | 'image_uri'>>
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | null)[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }
    if (fields.length === 0) return;
    values.push(String(id));
    await db.runAsync(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },
};
