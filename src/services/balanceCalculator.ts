import type { SQLiteDatabase } from 'expo-sqlite';
import type { MemberBalance } from '../models';

export function getFriendBalance(db: SQLiteDatabase, friendId: number): number {
  const rows = db.getAllSync<{ paid_amount: number; owed_amount: number; friend_id: number | null }>(
    `SELECT s.paid_amount, s.owed_amount, s.friend_id
     FROM shares s
     JOIN expenses e ON e.id = s.expense_id
     WHERE e.deleted_at IS NULL
       AND e.id IN (
         SELECT expense_id FROM shares WHERE friend_id = ?
         INTERSECT
         SELECT expense_id FROM shares WHERE friend_id IS NULL
       )
       AND (s.friend_id = ? OR s.friend_id IS NULL)`,
    friendId,
    friendId
  );

  let youPaid = 0;
  let youOwe = 0;
  let theyPaid = 0;
  let theyOwe = 0;

  for (const row of rows) {
    if (row.friend_id === null) {
      youPaid += row.paid_amount;
      youOwe += row.owed_amount;
    } else {
      theyPaid += row.paid_amount;
      theyOwe += row.owed_amount;
    }
  }

  return Math.round(((youPaid - youOwe) - (theyPaid - theyOwe)) * 100) / 100;
}

export function getGroupBalances(db: SQLiteDatabase, groupId: number): MemberBalance[] {
  const members = db.getAllSync<{ friend_id: number | null }>(
    'SELECT friend_id FROM group_members WHERE group_id = ?',
    groupId
  );

  const balances: MemberBalance[] = [];

  for (const member of members) {
    const row = db.getFirstSync<{ net: number }>(
      `SELECT COALESCE(SUM(s.paid_amount - s.owed_amount), 0) as net
       FROM shares s
       JOIN expenses e ON e.id = s.expense_id
       WHERE e.group_id = ? AND e.deleted_at IS NULL
         AND (s.friend_id = ? OR (? IS NULL AND s.friend_id IS NULL))`,
      groupId,
      member.friend_id,
      member.friend_id
    );

    let name = 'You';
    if (member.friend_id !== null) {
      const friend = db.getFirstSync<{ first_name: string; last_name: string | null }>(
        'SELECT first_name, last_name FROM friends WHERE id = ?',
        member.friend_id
      );
      if (friend) {
        name = friend.last_name ? `${friend.first_name} ${friend.last_name}` : friend.first_name;
      }
    }

    balances.push({
      friendId: member.friend_id,
      name,
      amount: Math.round((row?.net ?? 0) * 100) / 100,
    });
  }

  return balances;
}

export function getTotalBalance(db: SQLiteDatabase): { owe: number; owed: number } {
  const row = db.getFirstSync<{ total_paid: number; total_owed: number }>(
    `SELECT
       COALESCE(SUM(s.paid_amount), 0) as total_paid,
       COALESCE(SUM(s.owed_amount), 0) as total_owed
     FROM shares s
     JOIN expenses e ON e.id = s.expense_id
     WHERE e.deleted_at IS NULL AND s.friend_id IS NULL`
  );

  const net = (row?.total_paid ?? 0) - (row?.total_owed ?? 0);
  return {
    owe: net < 0 ? Math.abs(net) : 0,
    owed: net > 0 ? net : 0,
  };
}
