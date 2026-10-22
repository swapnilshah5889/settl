import { getCurrencySymbol } from '../constants/currencies';

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(amount);
  const formatted = abs.toFixed(2);
  if (amount < 0) {
    return `-${symbol}${formatted}`;
  }
  return `${symbol}${formatted}`;
}

export function formatAmount(amount: number): string {
  return Math.abs(amount).toFixed(2);
}
