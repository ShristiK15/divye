import type { OrderStatus, PaymentStatus, StockMovementType } from '../types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURN_REQUESTED: 'Return Requested',
  RETURNED: 'Returned',
  REFUNDED: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'border-[#F59E0B] text-[#F59E0B]',
  CONFIRMED: 'border-[#2F81F7] text-[#2F81F7]',
  PROCESSING: 'border-[#8B5CF6] text-[#8B5CF6]',
  SHIPPED: 'border-[#2F81F7] text-[#2F81F7]',
  OUT_FOR_DELIVERY: 'border-[#F59E0B] text-[#F59E0B]',
  DELIVERED: 'border-[#22C55E] text-[#22C55E]',
  CANCELLED: 'border-[#EF4444] text-[#EF4444]',
  RETURN_REQUESTED: 'border-[#F59E0B] text-[#F59E0B]',
  RETURNED: 'border-[#A3A3A3] text-[#A3A3A3]',
  REFUNDED: 'border-[#A3A3A3] text-[#A3A3A3]',
};

export const ADMIN_ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'border-[#D29922] text-[#D29922]',
  CONFIRMED: 'border-[#2F81F7] text-[#2F81F7]',
  PROCESSING: 'border-[#8B5CF6] text-[#8B5CF6]',
  SHIPPED: 'border-[#2F81F7] text-[#2F81F7]',
  OUT_FOR_DELIVERY: 'border-[#D29922] text-[#D29922]',
  DELIVERED: 'border-[#3FB950] text-[#3FB950]',
  CANCELLED: 'border-[#F85149] text-[#F85149]',
  RETURN_REQUESTED: 'border-[#D29922] text-[#D29922]',
  RETURNED: 'border-[#7D8590] text-[#7D8590]',
  REFUNDED: 'border-[#7D8590] text-[#7D8590]',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  PARTIALLY_REFUNDED: 'Partially Refunded',
};

export const STOCK_MOVEMENT_LABELS: Record<StockMovementType, string> = {
  SALE: 'Sale',
  RESTOCK: 'Restock',
  MANUAL_ADJUSTMENT: 'Manual Adjustment',
  RETURN: 'Return',
  DAMAGE_WRITEOFF: 'Damage Write-off',
};

export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_CHARGE = 49;

export const INDIA_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
] as const;
