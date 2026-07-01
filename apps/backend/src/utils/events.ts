import { EventEmitter } from 'events';

export const appEvents = new EventEmitter();

export const AppEventTypes = {
  LOW_STOCK: 'low_stock',
  ORDER_PLACED: 'order_placed',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
} as const;

export type LowStockEventPayload = {
  variantId: string;
  productId: string;
  stockQty: number;
  threshold: number;
};
