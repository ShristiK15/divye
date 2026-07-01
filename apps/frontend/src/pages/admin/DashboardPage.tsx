import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Order } from '@/types';
import { ADMIN_ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/constants';
import { formatINR, formatINRAbbreviated } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

interface Overview {
  totalRevenue: number;
  ordersToday: number;
  newCustomers: number;
  lowStockCount: number;
  revenueDelta?: number;
  ordersDelta?: number;
  customersDelta?: number;
}

const PIE_COLORS = ['#2F81F7', '#8B5CF6', '#3FB950', '#D29922', '#F85149', '#7D8590'];

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [revenue, setRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Overview>('/admin/analytics/overview'),
      api.get<{ date: string; revenue: number }[]>('/admin/analytics/revenue/monthly', { params: { period } }),
      api.get<PaginatedResult<Order>>('/orders/admin', { params: { limit: 5, sort: 'createdAt_desc' } }),
    ])
      .then(([ov, rev, ord]) => {
        setOverview(ov.data as unknown as Overview);
        setRevenue(rev.data as unknown as { date: string; revenue: number }[]);
        setOrders((ord.data as PaginatedResult<Order>).data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  const kpis = [
    { label: 'Total Revenue', value: formatINR(overview?.totalRevenue ?? 0), border: 'border-l-[#2F81F7]', delta: overview?.revenueDelta },
    { label: 'Orders Today', value: String(overview?.ordersToday ?? 0), border: 'border-l-[#8B5CF6]', delta: overview?.ordersDelta },
    { label: 'New Customers', value: String(overview?.newCustomers ?? 0), border: 'border-l-[#3FB950]', delta: overview?.customersDelta },
    { label: 'Low Stock Alerts', value: String(overview?.lowStockCount ?? 0), border: 'border-l-[#D29922]', link: '/admin/inventory' },
  ];

  const statusCounts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status,
    value: count,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`bg-admin-surface border border-admin-border p-5 rounded-md border-l-4 ${kpi.border}`}>
            <p className="text-xs font-mono text-admin-text-muted uppercase">{kpi.label}</p>
            {kpi.link ? (
              <Link to={kpi.link} className="font-mono text-2xl text-admin-text hover:text-admin-accent">{kpi.value}</Link>
            ) : (
              <p className="font-mono text-2xl text-admin-text">{kpi.value}</p>
            )}
            {kpi.delta !== undefined && (
              <p className={`text-xs font-mono mt-1 ${kpi.delta >= 0 ? 'text-admin-success' : 'text-admin-error'}`}>
                {kpi.delta >= 0 ? '↑' : '↓'} {Math.abs(kpi.delta)}%
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="bg-admin-surface border border-admin-border p-5 rounded-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-admin-text font-semibold">Revenue</h2>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map((p) => (
              <button key={p} type="button" onClick={() => setPeriod(p)} className={`px-3 py-1 text-xs rounded-full font-mono ${period === p ? 'bg-admin-accent text-white' : 'border border-admin-border text-admin-text-muted'}`}>
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={revenue}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2F81F7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2F81F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <YAxis tickFormatter={(v) => formatINRAbbreviated(v)} tick={{ fill: '#7D8590', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #30363D', fontFamily: 'JetBrains Mono', fontSize: 12 }} formatter={(v: number) => [formatINR(v), 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="#2F81F7" fill="url(#revGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-admin-surface border border-admin-border rounded-md overflow-hidden">
        <div className="p-4 flex items-center justify-between border-b border-admin-border">
          <h2 className="text-admin-text font-semibold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs text-admin-accent hover:underline">View All Orders</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-admin-surface-2 text-xs font-mono text-admin-text-muted uppercase border-b border-admin-border">
              <th className="p-3 text-left">Order #</th>
              <th className="p-3 text-left">Customer</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-admin-border">
                <td className="p-3 font-mono text-admin-text">
                  <Link to={`/admin/orders/${order.id}`} className="hover:text-admin-accent">{order.orderNumber}</Link>
                </td>
                <td className="p-3 text-admin-text-muted">{order.user?.name ?? '—'}</td>
                <td className="p-3 font-mono text-admin-text">{formatINR(order.totalAmount)}</td>
                <td className="p-3">
                  <span className={`font-mono text-xs px-2 py-0.5 border rounded-sm ${ADMIN_ORDER_STATUS_COLORS[order.status]}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td className="p-3 font-mono text-xs text-admin-text-muted">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pieData.length > 0 && (
        <div className="bg-admin-surface border border-admin-border p-5 rounded-md">
          <h2 className="text-admin-text font-semibold mb-4">Order Status Distribution</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1C2333', border: '1px solid #30363D', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
