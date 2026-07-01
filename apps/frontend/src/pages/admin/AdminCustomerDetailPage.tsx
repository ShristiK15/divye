import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Address, Order, User } from '@/types';
import { ADMIN_ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type CustomerDetail = User & {
  orderCount?: number;
  totalSpent?: string;
  avgOrderValue?: string;
  lastOrderAt?: string;
};

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get<CustomerDetail>(`/admin/customers/${id}`),
      api.get<PaginatedResult<Order>>('/orders/admin', { params: { userId: id } }),
    ])
      .then(([custRes, ordRes]) => {
        setCustomer(custRes.data as unknown as CustomerDetail);
        setOrders((ordRes.data as PaginatedResult<Order>).data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;
  if (!customer) return <div className="text-admin-text-muted text-center py-20">Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-admin-surface-2 border border-admin-border flex items-center justify-center text-xl font-mono text-admin-text">
          {customer.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-xl text-admin-text font-semibold">{customer.name}</h1>
          <p className="text-sm text-admin-text-muted">{customer.email} · {customer.phone ?? 'No phone'}</p>
          <p className="text-xs font-mono text-admin-text-muted">Joined {new Date(customer.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: String(customer.orderCount ?? 0) },
          { label: 'Total Spent', value: customer.totalSpent ? formatINR(customer.totalSpent) : '—' },
          { label: 'Avg. Order Value', value: customer.avgOrderValue ? formatINR(customer.avgOrderValue) : '—' },
          { label: 'Last Order', value: customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('en-IN') : '—' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-admin-surface border border-admin-border p-4 rounded-md">
            <p className="text-xs font-mono text-admin-text-muted">{kpi.label}</p>
            <p className="font-mono text-lg text-admin-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="border-admin-border">
          <TabsTrigger value="orders" className="data-[state=active]:border-admin-accent data-[state=active]:text-admin-text text-admin-text-muted">Orders</TabsTrigger>
          <TabsTrigger value="addresses" className="data-[state=active]:border-admin-accent data-[state=active]:text-admin-text text-admin-text-muted">Addresses</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <p className="text-admin-text-muted py-8">No orders</p>
          ) : (
            <table className="w-full text-sm mt-4">
              <thead>
                <tr className="text-xs font-mono text-admin-text-muted border-b border-admin-border">
                  <th className="pb-2 text-left">Order #</th>
                  <th className="pb-2 text-left">Date</th>
                  <th className="pb-2 text-left">Total</th>
                  <th className="pb-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-admin-border">
                    <td className="py-2 font-mono text-admin-text">{o.orderNumber}</td>
                    <td className="py-2 text-admin-text-muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-2 font-mono text-admin-text">{formatINR(o.totalAmount)}</td>
                    <td className="py-2">
                      <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${ADMIN_ORDER_STATUS_COLORS[o.status]}`}>
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TabsContent>
        <TabsContent value="addresses">
          {addresses.length === 0 ? (
            <p className="text-admin-text-muted py-8">No addresses on file</p>
          ) : (
            addresses.map((a) => (
              <div key={a.id} className="border border-admin-border p-4 mb-2 rounded-md">
                <p className="text-admin-text">{a.name}</p>
                <p className="text-sm text-admin-text-muted">{a.line1}, {a.city}, {a.state} {a.pincode}</p>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
