import { Link } from 'react-router-dom';
import { calculateGstBreakdown } from 'shared';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { removeItem, updateQuantity } from '@/store/cartSlice';
import { formatINR } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from '@/lib/constants';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((s) => s.cart.items);

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
      acc.gstByRate[item.gstPercent] = (acc.gstByRate[item.gstPercent] ?? 0) + gstAmount;
      return acc;
    },
    { subtotal: 0, gst: 0, total: 0, gstByRate: {} as Record<string, number> }
  );

  const shipping = totals.total >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
  const grandTotal = totals.total + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <SEOHead title="Cart" description="Your shopping cart" noIndex />
        <div className="border border-dashed border-[#262626] py-16">
          <p className="text-text-secondary mb-4">Your cart is empty</p>
          <Button asChild>
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEOHead title="Cart" description="Your shopping cart" noIndex />
      <h1 className="font-syne font-bold text-3xl text-white mb-8">Shopping Cart</h1>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 border border-[#262626] p-4 bg-[#111111]">
              <img src={item.image} alt={item.name} className="w-24 h-24 object-contain bg-[#0A0A0A]" loading="lazy" width={96} height={96} />
              <div className="flex-1">
                <Link to={`/products/${item.productId}`} className="font-syne text-white hover:underline">{item.name}</Link>
                <p className="text-xs text-[#525252]">{item.variantName} · {item.sku}</p>
                <p className="font-mono text-white mt-1">{formatINR(item.price)}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button type="button" className="border border-[#262626] p-1" onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity - 1 }))} aria-label="Decrease">
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
                  <button type="button" className="border border-[#262626] p-1" onClick={() => dispatch(updateQuantity({ variantId: item.variantId, quantity: item.quantity + 1 }))} aria-label="Increase">
                    <Plus className="h-3 w-3" />
                  </button>
                  <button type="button" className="ml-4 text-[#EF4444]" onClick={() => dispatch(removeItem(item.variantId))} aria-label="Remove">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border border-[#262626] bg-[#111111] p-6 h-fit sticky top-24">
          <h2 className="font-syne font-bold text-lg text-white mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-[#A3A3A3]">
              <span>Subtotal (excl. GST)</span>
              <span className="font-mono">{formatINR(totals.subtotal)}</span>
            </div>
            {Object.entries(totals.gstByRate).map(([rate, amount]) => (
              <div key={rate} className="flex justify-between text-[#A3A3A3]">
                <span>GST @ {rate}%</span>
                <span className="font-mono">{formatINR(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between text-[#A3A3A3]">
              <span>Shipping</span>
              <span className="font-mono">{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
            </div>
            <div className="flex justify-between font-mono text-white text-lg pt-3 border-t border-[#262626]">
              <span>Total</span>
              <span>{formatINR(grandTotal)}</span>
            </div>
          </div>
          <Button className="w-full mt-6" asChild>
            <Link to="/checkout">Proceed to Checkout</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
