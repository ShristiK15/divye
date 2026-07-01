import { roundMoney } from 'shared';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(num);
}

export function parseDecimal(value: string | number): number {
  return roundMoney(parseFloat(String(value)));
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export function isValidPincode(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}

export function formatINRAbbreviated(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return formatINR(num);
}

export function getPrimaryImageUrl(
  images: { url: string; isPrimary: boolean }[]
): string | undefined {
  return images.find((i) => i.isPrimary)?.url ?? images[0]?.url;
}

export function getActiveVariant<T extends { isActive: boolean }>(variants: T[]): T | undefined {
  return variants.find((v) => v.isActive) ?? variants[0];
}
