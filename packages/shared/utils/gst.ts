type DecimalLike = { toString(): string };

export function calculateGstBreakdown(
  inclusivePrice: DecimalLike,
  gstPercent: DecimalLike,
  quantity: number
): { subtotal: number; gstAmount: number; total: number } {
  const price = Number(inclusivePrice.toString());
  const gst = Number(gstPercent.toString());
  const lineTotal = price * quantity;
  const subtotal = lineTotal / (1 + gst / 100);
  const gstAmount = lineTotal - subtotal;

  return {
    subtotal: roundMoney(subtotal),
    gstAmount: roundMoney(gstAmount),
    total: roundMoney(lineTotal),
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
