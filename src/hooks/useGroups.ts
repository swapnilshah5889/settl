import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';
import { groupRepo } from '../repositories/groupRepo';
import type { Group } from '../models';

export function useGroups() {
  const { db } = useDatabase();
  const [groups, setGroups] = useState<Group[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!db) return;
    setGroups(groupRepo.getAll(db));
  }, [db, version]);

  const createGroup = useCallback(
    async (
      data: { name: string; group_type?: string; simplify_debts?: boolean },
      memberIds: (number | null)[]
    ) => {
      if (!db) return 0;
      const id = await groupRepo.create(db, data, memberIds);
      refresh();
      return id;
    },
    [db, refresh]
  );

  return { groups, createGroup, refresh };
}
