import { Prisma } from '@divye/database';

type Decimal = Prisma.Decimal;

export function toDecimal(value: number | string): Decimal {
  return new Prisma.Decimal(value);
}

export function decimalToNumber(value: Decimal): number {
  return Number(value.toString());
}

export function addDecimals(...values: Decimal[]): Decimal {
  return values.reduce((sum, val) => sum.add(val), new Prisma.Decimal(0));
}

export function multiplyDecimal(value: Decimal, multiplier: number): Decimal {
  return value.mul(multiplier);
}

export function getAvailableQty(stockQty: number, reservedQty: number): number {
  return Math.max(0, stockQty - reservedQty);
}
