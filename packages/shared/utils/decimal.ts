import Decimal from 'decimal.js';

/**
 * Anything that can represent a money value coming out of Prisma or across
 * the API boundary: a Prisma.Decimal instance (backend, pre-serialization),
 * a numeric string (post-JSON-serialization), or a plain number.
 */
export type DecimalLike = string | number | { toString(): string };

/**
 * Parses a DecimalLike value into a decimal.js Decimal for safe arithmetic.
 * Use this on every Prisma Decimal field before doing any math with it —
 * never operate on the raw Prisma.Decimal or a parseFloat'd number directly.
 *
 * Throws on null/undefined rather than silently producing NaN, since a
 * missing money value should fail loudly, not compute a wrong total.
 */
export function parseDecimal(value: DecimalLike | null | undefined): Decimal {
  if (value === null || value === undefined) {
    throw new Error('parseDecimal: cannot parse null or undefined');
  }
  const str = value.toString().trim();
  if (str === '') {
    throw new Error('parseDecimal: cannot parse empty string');
  }
  const decimal = new Decimal(str);
  if (!decimal.isFinite()) {
    throw new Error(`parseDecimal: value "${str}" is not a finite number`);
  }
  return decimal;
}