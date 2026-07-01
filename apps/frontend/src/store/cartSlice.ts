import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  sku: string;
  price: string;
  mrp: string;
  gstPercent: string;
  quantity: number;
  image: string;
  stockQty: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

const initialState: CartState = {
  items: [],
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find((i) => i.variantId === action.payload.variantId);
      if (existing) {
        existing.quantity = Math.min(
          existing.quantity + action.payload.quantity,
          action.payload.stockQty
        );
      } else {
        state.items.push(action.payload);
      }
      state.isOpen = true;
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.variantId !== action.payload);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ variantId: string; quantity: number }>
    ) => {
      const item = state.items.find((i) => i.variantId === action.payload.variantId);
      if (item) {
        item.quantity = Math.max(1, Math.min(action.payload.quantity, item.stockQty));
      }
    },
    clearCart: (state) => {
      state.items = [];
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    setCartOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, toggleCart, setCartOpen } =
  cartSlice.actions;
export default cartSlice.reducer;
