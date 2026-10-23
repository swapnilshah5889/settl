import { useState, useEffect, useCallback } from 'react';
import { useDatabase } from './useDatabase';
import { friendRepo } from '../repositories/friendRepo';
import { getFriendBalance } from '../services/balanceCalculator';
import type { FriendWithBalance } from '../models';

export function useFriends() {
  const { db } = useDatabase();
  const [friends, setFriends] = useState<FriendWithBalance[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!db) return;
    const raw = friendRepo.getAll(db);
    const withBalances: FriendWithBalance[] = raw.map((f) => ({
      ...f,
      balance: getFriendBalance(db, f.id),
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFriends(withBalances);
  }, [db, version]);

  const addFriend = useCallback(
    async (data: { first_name: string; last_name?: string; email?: string; phone?: string }) => {
      if (!db) return;
      await friendRepo.create(db, data);
      refresh();
    },
    [db, refresh]
  );

  const removeFriend = useCallback(
    async (id: number) => {
      if (!db) return;
      await friendRepo.remove(db, id);
      refresh();
    },
    [db, refresh]
  );

  return { friends, addFriend, removeFriend, refresh };
}
