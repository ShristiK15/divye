import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PaginationMeta } from 'shared';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Order } from '@/types';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { SEOHead } from '@/components/common/SEOHead';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AccountSidebar } from '@/components/storefront/AccountSidebar';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get<PaginatedResult<Order>>('/orders', { params: { page, limit: 10 } })
      .then((res) => {
        const result = res.data as PaginatedResult<Order>;
        setOrders(result.data);
        setMeta(result.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid md:grid-cols-[200px_1fr] gap-8">
      <SEOHead title="My Orders" description="View your order history" noIndex />
      <AccountSidebar />
      <div>
        <h1 className="font-syne font-bold text-2xl text-white mb-6">Order History</h1>
        {loading ? (
          <LoadingSpinner />
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-[#262626] py-16 text-center">
            <p className="text-text-secondary">No orders yet</p>
            <Link to="/products" className="text-white underline text-sm mt-2 inline-block">Start shopping</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-left text-[#525252] font-mono text-xs">
                  <th className="pb-3 pr-4">Order #</th>
                  <th className="pb-3 pr-4">Date</th>
                  <th className="pb-3 pr-4 hidden sm:table-cell">Items</th>
                  <th className="pb-3 pr-4">Total</th>
                  <th className="pb-3 pr-4 hidden md:table-cell">Payment</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-[#262626]">
                    <td className="py-3 pr-4 font-mono text-white">{order.orderNumber}</td>
                    <td className="py-3 pr-4 text-[#A3A3A3]">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 pr-4 hidden sm:table-cell text-[#A3A3A3]">{order.items?.length ?? '—'}</td>
                    <td className="py-3 pr-4 font-mono text-white">{formatINR(order.totalAmount)}</td>
                    <td className="py-3 pr-4 hidden md:table-cell font-mono text-xs text-[#A3A3A3]">{order.paymentMethod}</td>
                    <td className="py-3 pr-4">
                      <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${ORDER_STATUS_COLORS[order.status]}`}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      <Link to={`/account/orders/${order.id}`} className="text-white text-xs hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" onClick={() => setPage(p)} className={`w-8 h-8 border text-xs font-mono ${p === page ? 'bg-white text-black' : 'border-[#262626]'}`}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
