export interface SplitShare {
  friendId: number | null;
  paidAmount: number;
  owedAmount: number;
}

export function splitEqual(
  totalAmount: number,
  paidByFriendId: number | null,
  memberIds: (number | null)[]
): SplitShare[] {
  const perPerson = Math.floor((totalAmount / memberIds.length) * 100) / 100;
  let remainder = Math.round((totalAmount - perPerson * memberIds.length) * 100) / 100;

  return memberIds.map((id, index) => {
    let owed = perPerson;
    if (index === 0 && remainder > 0) {
      owed = Math.round((owed + remainder) * 100) / 100;
    }
    return {
      friendId: id,
      paidAmount: id === paidByFriendId ? totalAmount : 0,
      owedAmount: owed,
    };
  });
}

export function splitExact(
  totalAmount: number,
  paidByFriendId: number | null,
  exactAmounts: Map<number | null, number>
): SplitShare[] {
  return Array.from(exactAmounts.entries()).map(([id, amount]) => ({
    friendId: id,
    paidAmount: id === paidByFriendId ? totalAmount : 0,
    owedAmount: amount,
  }));
}

export function splitPercentage(
  totalAmount: number,
  paidByFriendId: number | null,
  percentages: Map<number | null, number>
): SplitShare[] {
  return Array.from(percentages.entries()).map(([id, pct]) => ({
    friendId: id,
    paidAmount: id === paidByFriendId ? totalAmount : 0,
    owedAmount: Math.round((totalAmount * pct) / 100 * 100) / 100,
  }));
}

export function splitByShares(
  totalAmount: number,
  paidByFriendId: number | null,
  shareUnits: Map<number | null, number>
): SplitShare[] {
  const totalUnits = Array.from(shareUnits.values()).reduce((a, b) => a + b, 0);
  if (totalUnits === 0) return [];

  return Array.from(shareUnits.entries()).map(([id, units]) => ({
    friendId: id,
    paidAmount: id === paidByFriendId ? totalAmount : 0,
    owedAmount: Math.round((totalAmount * units) / totalUnits * 100) / 100,
  }));
}

export function createSettlementShares(
  amount: number,
  fromFriendId: number | null,
  toFriendId: number | null
): SplitShare[] {
  return [
    { friendId: fromFriendId, paidAmount: amount, owedAmount: 0 },
    { friendId: toFriendId, paidAmount: 0, owedAmount: amount },
  ];
}
