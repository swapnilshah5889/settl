import type { SQLiteDatabase } from 'expo-sqlite';
import type { Friend } from '../models';

export const friendRepo = {
  getAll(db: SQLiteDatabase): Friend[] {
    return db.getAllSync<Friend>('SELECT * FROM friends ORDER BY first_name, last_name');
  },

  getById(db: SQLiteDatabase, id: number): Friend | null {
    return db.getFirstSync<Friend>('SELECT * FROM friends WHERE id = ?', id);
  },

  async create(
    db: SQLiteDatabase,
    data: { first_name: string; last_name?: string; email?: string; phone?: string }
  ): Promise<number> {
    const result = await db.runAsync(
      'INSERT INTO friends (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
      data.first_name,
      data.last_name ?? null,
      data.email ?? null,
      data.phone ?? null
    );
    return result.lastInsertRowId;
  },

  async update(
    db: SQLiteDatabase,
    id: number,
    data: Partial<Pick<Friend, 'first_name' | 'last_name' | 'email' | 'phone' | 'image_uri'>>
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
    await db.runAsync(`UPDATE friends SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },

  async remove(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM friends WHERE id = ?', id);
  },

  getByGroup(db: SQLiteDatabase, groupId: number): Friend[] {
    return db.getAllSync<Friend>(
      `SELECT f.* FROM friends f
       JOIN group_members gm ON gm.friend_id = f.id
       WHERE gm.group_id = ?
       ORDER BY f.first_name`,
      groupId
    );
  },

  getBalance(db: SQLiteDatabase, friendId: number): number {
    const result = db.getFirstSync<{ balance: number }>(
      `SELECT COALESCE(SUM(
        CASE WHEN s.friend_id IS NULL THEN s.paid_amount - s.owed_amount ELSE 0 END
        - CASE WHEN s.friend_id = ? THEN s.paid_amount - s.owed_amount ELSE 0 END
      ), 0) as balance
      FROM expenses e
      JOIN shares s ON s.expense_id = e.id
      WHERE e.deleted_at IS NULL
        AND e.id IN (
          SELECT expense_id FROM shares WHERE friend_id = ?
          INTERSECT
          SELECT expense_id FROM shares WHERE friend_id IS NULL
        )`,
      friendId,
      friendId
    );
    return result?.balance ?? 0;
  },
};
