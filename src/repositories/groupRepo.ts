import type { SQLiteDatabase } from 'expo-sqlite';
import type { Group, GroupMember, Friend } from '../models';

export const groupRepo = {
  getAll(db: SQLiteDatabase): Group[] {
    return db.getAllSync<Group>('SELECT * FROM groups_ ORDER BY updated_at DESC');
  },

  getById(db: SQLiteDatabase, id: number): Group | null {
    return db.getFirstSync<Group>('SELECT * FROM groups_ WHERE id = ?', id);
  },

  async create(
    db: SQLiteDatabase,
    data: { name: string; group_type?: string; simplify_debts?: boolean },
    memberFriendIds: (number | null)[]
  ): Promise<number> {
    const result = await db.runAsync(
      'INSERT INTO groups_ (name, group_type, simplify_debts) VALUES (?, ?, ?)',
      data.name,
      data.group_type ?? 'other',
      data.simplify_debts ? 1 : 0
    );
    const groupId = result.lastInsertRowId;
    for (const fid of memberFriendIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO group_members (group_id, friend_id) VALUES (?, ?)',
        groupId,
        fid
      );
    }
    return groupId;
  },

  async update(
    db: SQLiteDatabase,
    id: number,
    data: Partial<Pick<Group, 'name' | 'group_type' | 'simplify_debts'>>
  ): Promise<void> {
    const fields: string[] = ['updated_at = datetime(\'now\')'];
    const values: (string | number | null)[] = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val as string | number);
      }
    }
    values.push(id);
    await db.runAsync(`UPDATE groups_ SET ${fields.join(', ')} WHERE id = ?`, ...values);
  },

  async setMembers(db: SQLiteDatabase, groupId: number, friendIds: (number | null)[]): Promise<void> {
    await db.runAsync('DELETE FROM group_members WHERE group_id = ?', groupId);
    for (const fid of friendIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO group_members (group_id, friend_id) VALUES (?, ?)',
        groupId,
        fid
      );
    }
  },

  getMembers(db: SQLiteDatabase, groupId: number): GroupMember[] {
    return db.getAllSync<GroupMember>('SELECT * FROM group_members WHERE group_id = ?', groupId);
  },

  getMemberFriends(db: SQLiteDatabase, groupId: number): (Friend | null)[] {
    const members = db.getAllSync<GroupMember>('SELECT * FROM group_members WHERE group_id = ?', groupId);
    return members.map((m) => {
      if (m.friend_id === null) return null;
      return db.getFirstSync<Friend>('SELECT * FROM friends WHERE id = ?', m.friend_id);
    });
  },

  async remove(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM groups_ WHERE id = ?', id);
  },
};
