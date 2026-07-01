import type { StockMovementType } from './enums';

export interface InventoryLog {
  id: string;
  variantId: string;
  type: StockMovementType;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason: string | null;
  reference: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface InventoryVariant {
  id: string;
  sku: string;
  name: string;
  price: string;
  stockQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  product: {
    id: string;
    name: string;
    category: { id: string; name: string };
  };
  supplier?: Supplier | null;
  updatedAt?: string;
}
