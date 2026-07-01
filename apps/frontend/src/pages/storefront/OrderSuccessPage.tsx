import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '@/lib/axios';
import type { Order } from '@/types';
import { SEOHead } from '@/components/common/SEOHead';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    api.get<Order>(`/orders/${orderId}`).then((res) => setOrder(res.data as unknown as Order)).catch(() => {});
  }, [orderId]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <SEOHead title="Order Confirmed" description="Your order has been placed" noIndex />

      <svg className="w-20 h-20 mb-6" viewBox="0 0 52 52">
        <circle className="stroke-[#22C55E] fill-none" cx="26" cy="26" r="25" strokeWidth="2" />
        <path
          className="stroke-[#22C55E] fill-none animate-check-draw"
          strokeWidth="3"
          strokeLinecap="round"
          d="M14 27l8 8 16-16"
          style={{ strokeDasharray: 100, strokeDashoffset: 100 }}
        />
      </svg>

      <h1 className="font-syne font-bold text-3xl text-white mb-2">Order Confirmed</h1>
      {order ? (
        <p className="font-mono text-[#A3A3A3] mb-8">Order #{order.orderNumber}</p>
      ) : orderId ? (
        <LoadingSpinner className="mb-8" />
      ) : null}

      <div className="flex gap-4">
        {order && (
          <Button variant="outline" asChild>
            <Link to={`/account/orders/${order.id}`}>Track Order</Link>
          </Button>
        )}
        <Button asChild>
          <Link to="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
