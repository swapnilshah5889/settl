import type { SettlementSuggestion, MemberBalance } from '../models';

export function simplifyDebts(balances: MemberBalance[]): SettlementSuggestion[] {
  const creditors: { id: number | null; name: string; amount: number }[] = [];
  const debtors: { id: number | null; name: string; amount: number }[] = [];

  for (const b of balances) {
    if (b.amount > 0.01) {
      creditors.push({ id: b.friendId, name: b.name, amount: b.amount });
    } else if (b.amount < -0.01) {
      debtors.push({ id: b.friendId, name: b.name, amount: Math.abs(b.amount) });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: SettlementSuggestion[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount);
    if (amount > 0.01) {
      settlements.push({
        fromId: debtors[di].id,
        fromName: debtors[di].name,
        toId: creditors[ci].id,
        toName: creditors[ci].name,
        amount: Math.round(amount * 100) / 100,
      });
    }
    creditors[ci].amount -= amount;
    debtors[di].amount -= amount;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return settlements;
}
