import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Order, OrderStatus, PaymentMethod } from '@/types';
import { ADMIN_ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminOrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const debouncedSearch = useDebounce(search);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '20' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (status) params.status = status;
    if (paymentMethod) params.paymentMethod = paymentMethod;

    api.get<PaginatedResult<Order>>('/orders/admin', { params })
      .then((res) => setOrders((res.data as PaginatedResult<Order>).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, status, paymentMethod]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search orders..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 bg-admin-bg border-admin-border text-admin-text" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 bg-admin-bg border-admin-border text-admin-text"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
          <SelectTrigger className="w-36 bg-admin-bg border-admin-border text-admin-text"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            {(['RAZORPAY', 'COD'] as PaymentMethod[]).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : orders.length === 0 ? (
        <div className="border border-dashed border-admin-border py-16 text-center text-admin-text-muted">No orders found</div>
      ) : (
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-admin-surface-2 text-xs font-mono text-admin-text-muted uppercase border-b border-admin-border">
                <th className="p-3 text-left">Order #</th>
                <th className="p-3 text-left">Customer</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Items</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Payment</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-admin-border">
                  <td className="p-3 font-mono text-admin-text">{order.orderNumber}</td>
                  <td className="p-3 text-admin-text-muted">{order.user?.name ?? '—'}</td>
                  <td className="p-3 font-mono text-xs text-admin-text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3 text-admin-text-muted">{order.items?.length ?? '—'}</td>
                  <td className="p-3 font-mono text-admin-text">{formatINR(order.totalAmount)}</td>
                  <td className="p-3 font-mono text-xs text-admin-text-muted">{order.paymentMethod === 'RAZORPAY' ? 'Razorpay' : 'COD'}</td>
                  <td className="p-3">
                    <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${ADMIN_ORDER_STATUS_COLORS[order.status]}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="p-3"><Link to={`/admin/orders/${order.id}`} className="text-admin-accent text-xs hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
