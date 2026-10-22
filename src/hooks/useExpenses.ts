import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';
import { expenseRepo } from '../repositories/expenseRepo';
import type { Expense } from '../models';

export function useExpenses(groupId?: number) {
  const { db } = useDatabase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!db) return;
    if (groupId) {
      setExpenses(expenseRepo.getByGroup(db, groupId));
    } else {
      setExpenses(expenseRepo.getAll(db));
    }
  }, [db, groupId, version]);

  return { expenses, refresh };
}
