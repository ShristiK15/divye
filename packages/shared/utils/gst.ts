import Decimal from 'decimal.js';

type DecimalLike = { toString(): string };

export interface GstBreakdown {
  subtotal: Decimal;
  gstAmount: Decimal;
  total: Decimal;
}

export function calculateGstBreakdown(
  inclusivePrice: DecimalLike,
  gstPercent: DecimalLike,
  quantity: number
): GstBreakdown {
  if (typeof inclusivePrice === 'number' || typeof gstPercent === 'number') {
    throw new TypeError(
      'calculateGstBreakdown received a plain number — pass a Decimal or decimal string to avoid float precision loss'
    );
  }

  const price = new Decimal(inclusivePrice.toString());
  const gst = new Decimal(gstPercent.toString());

  const lineTotal = price.times(quantity);
  const divisor = new Decimal(1).plus(gst.div(100));
  const subtotal = lineTotal.div(divisor);
  const gstAmount = lineTotal.minus(subtotal);

  return {
    subtotal: roundMoney(subtotal),
    gstAmount: roundMoney(gstAmount),
    total: roundMoney(lineTotal),
  };
}

export function roundMoney(value: Decimal | number): Decimal {
  const d = value instanceof Decimal ? value : new Decimal(value);
  return d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}