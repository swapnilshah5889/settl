import type { SQLiteDatabase } from 'expo-sqlite';
import type { ActivityItem } from '../models';

export const activityRepo = {
  getAll(db: SQLiteDatabase, limit: number = 50): ActivityItem[] {
    return db.getAllSync<ActivityItem>(
      `SELECT
        e.id,
        CASE WHEN e.is_payment = 1 THEN 'payment' ELSE 'expense' END as type,
        e.description,
        e.amount,
        e.currency,
        e.date,
        e.created_at,
        g.name as group_name,
        CASE WHEN e.created_by IS NULL THEN 'You'
             ELSE COALESCE(f.first_name || ' ' || COALESCE(f.last_name, ''), 'Unknown')
        END as creator_name,
        COALESCE(
          (SELECT s.owed_amount - s.paid_amount FROM shares s WHERE s.expense_id = e.id AND s.friend_id IS NULL),
          0
        ) as your_share
      FROM expenses e
      LEFT JOIN groups_ g ON g.id = e.group_id
      LEFT JOIN friends f ON f.id = e.created_by
      WHERE e.deleted_at IS NULL
      ORDER BY e.date DESC, e.created_at DESC
      LIMIT ?`,
      limit
    );
  },
};
