import { CurrencyCode } from '../types';

export const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rate: number; label: string }> = {
  GBP: { symbol: '£', rate: 1.0, label: 'GBP (£)' },
  USD: { symbol: '$', rate: 1.30, label: 'USD ($)' },
  EUR: { symbol: '€', rate: 1.18, label: 'EUR (€)' },
};

export function formatPrice(amountInGbp: number, currency: CurrencyCode = 'GBP'): string {
  const { symbol, rate } = CURRENCY_RATES[currency];
  const converted = Math.round(amountInGbp * rate);
  return `${symbol}${converted.toLocaleString()}`;
}
