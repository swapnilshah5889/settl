import type { SQLiteDatabase } from 'expo-sqlite';
import type { Expense, Share, ExpenseWithShares, Category } from '../models';

export const expenseRepo = {
  getByGroup(db: SQLiteDatabase, groupId: number): Expense[] {
    return db.getAllSync<Expense>(
      'SELECT * FROM expenses WHERE group_id = ? AND deleted_at IS NULL ORDER BY date DESC, created_at DESC',
      groupId
    );
  },

  getById(db: SQLiteDatabase, id: number): Expense | null {
    return db.getFirstSync<Expense>('SELECT * FROM expenses WHERE id = ?', id);
  },

  getWithShares(db: SQLiteDatabase, id: number): ExpenseWithShares | null {
    const expense = db.getFirstSync<Expense>('SELECT * FROM expenses WHERE id = ?', id);
    if (!expense) return null;

    const shares = db.getAllSync<Share>('SELECT * FROM shares WHERE expense_id = ?', id);
    const category = expense.category_id
      ? db.getFirstSync<Category>('SELECT * FROM categories WHERE id = ?', expense.category_id)
      : undefined;

    let creatorName = 'You';
    if (expense.created_by) {
      const friend = db.getFirstSync<{ first_name: string; last_name: string | null }>(
        'SELECT first_name, last_name FROM friends WHERE id = ?',
        expense.created_by
      );
      if (friend) creatorName = friend.last_name ? `${friend.first_name} ${friend.last_name}` : friend.first_name;
    }

    return { ...expense, shares, category: category ?? undefined, creatorName };
  },

  async create(
    db: SQLiteDatabase,
    data: {
      group_id?: number;
      description: string;
      amount: number;
      currency: string;
      date: string;
      category_id?: number;
      created_by?: number;
      is_payment?: boolean;
      notes?: string;
      receipt_uri?: string;
      split_type: string;
    },
    shares: { friend_id: number | null; paid_amount: number; owed_amount: number }[]
  ): Promise<number> {
    const result = await db.runAsync(
      `INSERT INTO expenses (group_id, description, amount, currency, date, category_id, created_by, is_payment, notes, receipt_uri, split_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.group_id ?? null,
      data.description,
      data.amount,
      data.currency,
      data.date,
      data.category_id ?? null,
      data.created_by ?? null,
      data.is_payment ? 1 : 0,
      data.notes ?? null,
      data.receipt_uri ?? null,
      data.split_type
    );
    const expenseId = result.lastInsertRowId;

    for (const share of shares) {
      await db.runAsync(
        'INSERT INTO shares (expense_id, friend_id, paid_amount, owed_amount) VALUES (?, ?, ?, ?)',
        expenseId,
        share.friend_id,
        share.paid_amount,
        share.owed_amount
      );
    }

    if (data.group_id) {
      await db.runAsync(
        "UPDATE groups_ SET updated_at = datetime('now') WHERE id = ?",
        data.group_id
      );
    }

    return expenseId;
  },

  async softDelete(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync("UPDATE expenses SET deleted_at = datetime('now') WHERE id = ?", id);
  },

  async addComment(
    db: SQLiteDatabase,
    expenseId: number,
    friendId: number | null,
    content: string
  ): Promise<number> {
    const result = await db.runAsync(
      'INSERT INTO comments (expense_id, friend_id, content) VALUES (?, ?, ?)',
      expenseId,
      friendId,
      content
    );
    return result.lastInsertRowId;
  },

  getComments(db: SQLiteDatabase, expenseId: number) {
    return db.getAllSync<{
      id: number;
      content: string;
      created_at: string;
      friend_id: number | null;
      first_name: string | null;
    }>(
      `SELECT c.id, c.content, c.created_at, c.friend_id, f.first_name
       FROM comments c
       LEFT JOIN friends f ON f.id = c.friend_id
       WHERE c.expense_id = ?
       ORDER BY c.created_at ASC`,
      expenseId
    );
  },

  getAll(db: SQLiteDatabase): Expense[] {
    return db.getAllSync<Expense>(
      'SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY date DESC, created_at DESC'
    );
  },
};
