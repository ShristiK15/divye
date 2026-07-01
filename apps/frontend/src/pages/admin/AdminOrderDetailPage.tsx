import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { calculateGstBreakdown } from 'shared';
import api from '@/lib/axios';
import type { Order, OrderStatus } from '@/types';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<OrderStatus>('PENDING');
  const [trackingId, setTrackingId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Order>(`/orders/admin/${id}`).catch(() => api.get<Order>(`/orders/${id}`))
      .then((res) => {
        const o = res.data as unknown as Order;
        setOrder(o);
        setStatus(o.status);
        setTrackingId(o.trackingId ?? '');
        setCarrier(o.carrier ?? '');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.put(`/orders/admin/${id}/status`, { status, trackingId, carrier, note: internalNote });
      const res = await api.get<Order>(`/orders/${id}`);
      setOrder(res.data as unknown as Order);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!order) return <div className="text-admin-text-muted text-center py-20">Order not found</div>;

  const history = [...(order.statusHistory ?? [])].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-admin-surface border border-admin-border p-4 rounded-md">
          <p className="text-xs font-mono text-admin-text-muted uppercase mb-2">Customer</p>
          {order.user && (
            <>
              <p className="text-admin-text">{order.user.name}</p>
              <p className="text-sm text-admin-text-muted">{order.user.email}</p>
              <Link to={`/admin/customers/${order.userId}`} className="text-xs text-admin-accent hover:underline">View customer</Link>
            </>
          )}
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-md">
          <p className="text-xs font-mono text-admin-text-muted uppercase mb-2">Delivery Address</p>
          {order.address && (
            <p className="text-sm text-admin-text-muted">
              {order.address.name}, {order.address.line1}, {order.address.city}, {order.address.state} {order.address.pincode}
            </p>
          )}
        </div>
        <div className="bg-admin-surface border border-admin-border p-4 rounded-md">
          <p className="text-xs font-mono text-admin-text-muted uppercase mb-2">Payment</p>
          <p className="font-mono text-admin-text">{formatINR(order.payment?.amount ?? order.totalAmount)}</p>
          <p className="text-xs font-mono text-admin-text-muted">{order.payment?.razorpayPaymentId}</p>
        </div>
      </div>

      {order.notes && (
        <div>
          <p className="text-xs font-mono text-admin-text-muted mb-1">Customer&apos;s Delivery Instructions</p>
          <p className="bg-admin-bg border border-admin-border p-3 text-sm text-admin-text-muted italic">{order.notes}</p>
        </div>
      )}

      <p className="text-xs text-admin-text-muted italic">All prices are locked at the time of order placement and reflect GST at that moment.</p>

      <div className="bg-admin-surface border border-admin-border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-admin-surface-2 text-xs font-mono text-admin-text-muted uppercase border-b border-admin-border">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Qty</th>
              <th className="p-3 text-right">Unit Price</th>
              <th className="p-3 text-right">GST%</th>
              <th className="p-3 text-right">GST Amt</th>
              <th className="p-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item) => {
              const { gstAmount } = calculateGstBreakdown(item.unitPrice, item.gstPercent, item.quantity);
              return (
                <tr key={item.id} className="border-b border-admin-border">
                  <td className="p-3 text-admin-text">{item.productName}<br /><span className="text-xs text-admin-text-muted">{item.variantName}</span></td>
                  <td className="p-3 font-mono text-xs text-admin-text-muted">{item.sku}</td>
                  <td className="p-3 text-admin-text-muted">{item.quantity}</td>
                  <td className="p-3 font-mono text-right text-admin-text">{formatINR(item.unitPrice)}</td>
                  <td className="p-3 font-mono text-right text-admin-text-muted">{item.gstPercent}%</td>
                  <td className="p-3 font-mono text-right text-admin-text-muted">{formatINR(gstAmount)}</td>
                  <td className="p-3 font-mono text-right text-admin-text">{formatINR(item.totalPrice)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-admin-border">
              <td colSpan={6} className="p-3 text-right text-admin-text-muted">Subtotal (excl. GST)</td>
              <td className="p-3 font-mono text-right text-admin-text">{formatINR(order.subtotal)}</td>
            </tr>
            <tr>
              <td colSpan={6} className="p-3 text-right text-admin-text-muted">GST Total</td>
              <td className="p-3 font-mono text-right text-admin-text">{formatINR(order.gstAmount)}</td>
            </tr>
            <tr>
              <td colSpan={6} className="p-3 text-right text-admin-text-muted">Shipping</td>
              <td className="p-3 font-mono text-right text-admin-text">{formatINR(order.shippingCharge)}</td>
            </tr>
            <tr className="font-semibold">
              <td colSpan={6} className="p-3 text-right text-admin-text">Grand Total</td>
              <td className="p-3 font-mono text-right text-admin-text">{formatINR(order.totalAmount)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="bg-admin-surface border border-admin-border p-6 rounded-md space-y-4">
        <h2 className="text-admin-text font-semibold">Order Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus)}>
              <SelectTrigger className="bg-admin-bg border-admin-border text-admin-text"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                  <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Tracking ID</Label><Input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
          <div><Label>Carrier</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} className="bg-admin-bg border-admin-border text-admin-text" /></div>
          <div><Label>Internal Note</Label><textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} rows={2} className="w-full bg-admin-bg border border-admin-border text-admin-text rounded-md px-3 py-2 text-sm" /></div>
        </div>
        <Button variant="admin" onClick={handleUpdate} disabled={saving}>{saving ? 'Updating...' : 'Update Order'}</Button>
      </div>

      <div>
        <h2 className="text-admin-text font-semibold mb-4">Status Timeline</h2>
        <div className="space-y-4 border-l-2 border-admin-border ml-2 pl-4">
          {history.map((entry, i) => (
            <div key={entry.id} className={i === history.length - 1 ? 'border-l-2 border-admin-accent -ml-[18px] pl-4' : ''}>
              <p className="text-sm text-admin-text">{ORDER_STATUS_LABELS[entry.status]}</p>
              <p className="font-mono text-xs text-admin-text-muted">{new Date(entry.createdAt).toLocaleString('en-IN')}</p>
              {entry.note && <p className="text-xs text-admin-text-muted mt-1">{entry.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
