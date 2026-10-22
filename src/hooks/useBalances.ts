import { useState, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { getTotalBalance, getGroupBalances } from '../services/balanceCalculator';
import type { MemberBalance } from '../models';

export function useTotalBalance() {
  const { db } = useDatabase();
  const [balance, setBalance] = useState({ owe: 0, owed: 0 });

  useEffect(() => {
    if (!db) return;
    setBalance(getTotalBalance(db));
  }, [db]);

  return balance;
}

export function useGroupBalances(groupId: number) {
  const { db } = useDatabase();
  const [balances, setBalances] = useState<MemberBalance[]>([]);

  useEffect(() => {
    if (!db) return;
    setBalances(getGroupBalances(db, groupId));
  }, [db, groupId]);

  return balances;
}
