import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { calculateGstBreakdown } from 'shared';
import api from '@/lib/axios';
import type { Order } from '@/types';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { SEOHead } from '@/components/common/SEOHead';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AccountSidebar } from '@/components/storefront/AccountSidebar';
import { Button } from '@/components/ui/button';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get<Order>(`/orders/${id}`).then((res) => setOrder(res.data as unknown as Order)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!order) return <div className="text-center py-20 text-text-secondary">Order not found</div>;

  const history = [...(order.statusHistory ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <SEOHead title={`Order ${order.orderNumber}`} description="Order details" noIndex />
      <AccountSidebar />
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-syne font-bold text-2xl text-white">Order #{order.orderNumber}</h1>
          <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${ORDER_STATUS_COLORS[order.status]}`}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {order.trackingId && (
          <div className="border border-[#262626] p-4 mb-6">
            <p className="text-xs text-[#525252] mb-1">Tracking</p>
            <p className="font-mono text-white">{order.carrier} — {order.trackingId}</p>
          </div>
        )}

        <div className="border border-[#262626] p-4 mb-6">
          <p className="text-xs text-[#525252] mb-2">Delivery Address</p>
          {order.address && (
            <p className="text-sm text-[#A3A3A3]">
              {order.address.name}, {order.address.line1}, {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          )}
        </div>

        <p className="text-xs text-[#525252] mb-4 italic">Prices shown are locked at the time of order placement.</p>

        <div className="space-y-3 mb-6">
          {order.items?.map((item) => {
            const { subtotal, gstAmount } = calculateGstBreakdown(item.unitPrice, item.gstPercent, item.quantity);
            return (
              <div key={item.id} className="flex justify-between border border-[#262626] p-4">
                <div>
                  <p className="text-white text-sm">{item.productName}</p>
                  <p className="text-xs text-[#525252]">{item.variantName} · Qty: {item.quantity}</p>
                  <p className="text-xs font-mono text-[#525252] mt-1">GST @ {item.gstPercent}%: {formatINR(gstAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-white">{formatINR(item.totalPrice)}</p>
                  <p className="text-xs font-mono text-[#525252]">Base: {formatINR(subtotal)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border border-[#262626] p-4 space-y-2 text-sm mb-6">
          <div className="flex justify-between text-[#A3A3A3]"><span>Subtotal (excl. GST)</span><span className="font-mono">{formatINR(order.subtotal)}</span></div>
          <div className="flex justify-between text-[#A3A3A3]"><span>GST</span><span className="font-mono">{formatINR(order.gstAmount)}</span></div>
          <div className="flex justify-between text-[#A3A3A3]"><span>Shipping</span><span className="font-mono">{formatINR(order.shippingCharge)}</span></div>
          <div className="flex justify-between font-mono text-white pt-2 border-t border-[#262626]"><span>Total</span><span>{formatINR(order.totalAmount)}</span></div>
        </div>

        <div className="mb-6">
          <h2 className="font-syne text-lg text-white mb-4">Status Timeline</h2>
          <div className="space-y-4 border-l-2 border-[#262626] ml-2 pl-4">
            {history.map((entry) => (
              <div key={entry.id}>
                <p className="text-sm text-white">{ORDER_STATUS_LABELS[entry.status]}</p>
                <p className="font-mono text-xs text-[#525252]">{new Date(entry.createdAt).toLocaleString('en-IN')}</p>
                {entry.note && <p className="text-xs text-[#A3A3A3] mt-1">{entry.note}</p>}
              </div>
            ))}
          </div>
        </div>

        <Button variant="outline" asChild>
          <Link to="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    </div>
  );
}
