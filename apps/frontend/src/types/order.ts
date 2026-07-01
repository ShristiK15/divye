import type { OrderStatus, PaymentMethod, PaymentStatus } from './enums';
import type { Address, User } from './user';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  gstPercent: string;
  totalPrice: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: string;
  currency: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  failureReason: string | null;
  refundId: string | null;
  refundAmount: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  addressId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: string;
  discountAmount: string;
  shippingCharge: string;
  gstAmount: string;
  totalAmount: string;
  couponCode: string | null;
  notes: string | null;
  trackingId: string | null;
  carrier: string | null;
  createdAt: string;
  updatedAt: string;
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  address?: Address;
  items?: OrderItem[];
  payment?: Payment;
  statusHistory?: OrderStatusHistory[];
}
