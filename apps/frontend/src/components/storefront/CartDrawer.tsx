import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { calculateGstBreakdown } from 'shared';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { setCartOpen, removeItem, updateQuantity } from '@/store/cartSlice';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function CartDrawer() {
  const dispatch = useAppDispatch();
  const { items, isOpen } = useAppSelector((s) => s.cart);

  if (!isOpen) return null;

  const totals = items.reduce(
    (acc, item) => {
      const { subtotal, gstAmount, total } = calculateGstBreakdown(
        item.price,
        item.gstPercent,
        item.quantity
      );
      acc.subtotal += subtotal;
      acc.gst += gstAmount;
      acc.total += total;
      const rate = item.gstPercent;
      acc.gstByRate[rate] = (acc.gstByRate[rate] ?? 0) + gstAmount;
      return acc;
    },
    { subtotal: 0, gst: 0, total: 0, gstByRate: {} as Record<string, number> }
  );

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={() => dispatch(setCartOpen(false))} />
      <aside className="fixed inset-y-0 right-0 w-full max-w-sm bg-[#111111] border-l border-[#262626] z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#262626]">
          <h2 className="font-syne font-bold text-lg text-white">Cart ({items.length})</h2>
          <button type="button" aria-label="Close cart" onClick={() => dispatch(setCartOpen(false))}>
            <X className="h-5 w-5 text-[#A3A3A3] hover:text-white" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-12 w-12 text-[#525252] mb-4" />
            <p className="text-text-secondary">Your cart is empty</p>
            <Button variant="outline" className="mt-4" onClick={() => dispatch(setCartOpen(false))} asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-3 border border-[#262626] p-3">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-contain bg-[#0A0A0A]" loading="lazy" width={64} height={64} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-xs text-[#525252]">{item.variantName}</p>
                    <p className="text-sm font-mono text-white mt-1">{formatINR(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="border border-[#262626] p-1"
                        onClick={() =>
                          dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="border border-[#262626] p-1"
                        onClick={() =>
                          dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))
                        }
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        className="ml-auto text-xs text-[#EF4444]"
                        onClick={() => dispatch(removeItem(item.variantId))}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#262626] p-4 space-y-2">
              <div className="flex justify-between text-sm text-[#A3A3A3]">
                <span>Subtotal (excl. GST)</span>
                <span className="font-mono">{formatINR(totals.subtotal)}</span>
              </div>
              {Object.entries(totals.gstByRate).map(([rate, amount]) => (
                <div key={rate} className="flex justify-between text-sm text-[#A3A3A3]">
                  <span>GST @ {rate}%</span>
                  <span className="font-mono">{formatINR(amount)}</span>
                </div>
              ))}
              <div className="flex justify-between font-mono text-white pt-2 border-t border-[#262626]">
                <span>Total</span>
                <span>{formatINR(totals.total)}</span>
              </div>
              <Button className="w-full mt-2" asChild onClick={() => dispatch(setCartOpen(false))}>
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Button variant="outline" className="w-full" asChild onClick={() => dispatch(setCartOpen(false))}>
                <Link to="/cart">View Cart</Link>
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
