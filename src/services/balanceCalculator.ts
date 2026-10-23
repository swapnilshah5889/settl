import type { SQLiteDatabase } from 'expo-sqlite';
import type { MemberBalance } from '../models';

export function getFriendBalance(db: SQLiteDatabase, friendId: number): number {
  const rows = db.getAllSync<{ expense_id: number; paid_amount: number; owed_amount: number; friend_id: number | null }>(
    `SELECT s.expense_id, s.paid_amount, s.owed_amount, s.friend_id
     FROM shares s
     JOIN expenses e ON e.id = s.expense_id
     WHERE e.deleted_at IS NULL
       AND s.expense_id IN (
         SELECT expense_id FROM shares WHERE friend_id = ?
         INTERSECT
         SELECT expense_id FROM shares WHERE friend_id IS NULL
       )
     ORDER BY s.expense_id`,
    friendId
  );

  const byExpense = new Map<number, typeof rows>();
  for (const row of rows) {
    const list = byExpense.get(row.expense_id) ?? [];
    list.push(row);
    byExpense.set(row.expense_id, list);
  }

  let balance = 0;

  for (const [, shares] of byExpense) {
    const userShare = shares.find(s => s.friend_id === null);
    const friendShare = shares.find(s => s.friend_id === friendId);
    if (!userShare || !friendShare) continue;

    const userNet = userShare.paid_amount - userShare.owed_amount;
    const friendNet = friendShare.paid_amount - friendShare.owed_amount;

    const totalCredit = shares.reduce((sum, s) => {
      const net = s.paid_amount - s.owed_amount;
      return sum + (net > 0 ? net : 0);
    }, 0);

    if (totalCredit === 0) continue;

    if (userNet > 0 && friendNet < 0) {
      balance += Math.abs(friendNet) * userNet / totalCredit;
    } else if (userNet < 0 && friendNet > 0) {
      balance -= Math.abs(userNet) * friendNet / totalCredit;
    }
  }

  return Math.round(balance * 100) / 100;
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
  const friends = db.getAllSync<{ id: number }>('SELECT id FROM friends');

  let owe = 0;
  let owed = 0;

  for (const friend of friends) {
    const bal = getFriendBalance(db, friend.id);
    if (bal > 0) {
      owed += bal;
    } else if (bal < 0) {
      owe += Math.abs(bal);
    }
  }

  return {
    owe: Math.round(owe * 100) / 100,
    owed: Math.round(owed * 100) / 100,
  };
}
