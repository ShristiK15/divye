import { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '@/lib/axios';
import { formatINR, formatINRAbbreviated } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const COLORS = ['#2F81F7', '#8B5CF6', '#3FB950', '#F59E0B', '#F85149', '#7D8590'];
const tooltipStyle = { background: '#1C2333', border: '1px solid #30363D', color: '#E6EDF3', fontFamily: 'JetBrains Mono', fontSize: 12 };

export default function AdminAnalyticsPage() {
  const [revenue, setRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [categoryRevenue, setCategoryRevenue] = useState<{ category: string; revenue: number }[]>([]);
  const [ordersOverTime, setOrdersOverTime] = useState<{ date: string; count: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; units: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/analytics/revenue/monthly').catch(() => ({ data: [] })),
      api.get('/admin/analytics/products/top').catch(() => ({ data: [] })),
      api.get('/admin/analytics/orders/recent').catch(() => ({ data: [] })),
    ])
      .then(([rev, products, orders]) => {
        setRevenue(rev.data as { month: string; revenue: number }[]);
        setTopProducts(products.data as { name: string; units: number; revenue: number }[]);
        const orderData = orders.data as { date: string; count: number }[];
        setOrdersOverTime(orderData);
        setCategoryRevenue([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-admin-surface border border-admin-border p-5 rounded-md">
          <h2 className="text-admin-text font-semibold mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenue}>
              <XAxis dataKey="month" tick={{ fill: '#7D8590', fontSize: 10 }} />
              <YAxis tickFormatter={formatINRAbbreviated} tick={{ fill: '#7D8590', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatINR(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#2F81F7" fill="#2F81F7" fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {categoryRevenue.length > 0 && (
          <div className="bg-admin-surface border border-admin-border p-5 rounded-md">
            <h2 className="text-admin-text font-semibold mb-4">Revenue by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryRevenue}>
                <XAxis dataKey="category" tick={{ fill: '#7D8590', fontSize: 10 }} />
                <YAxis tickFormatter={formatINRAbbreviated} tick={{ fill: '#7D8590', fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue">{categoryRevenue.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="bg-admin-surface border border-admin-border p-5 rounded-md">
          <h2 className="text-admin-text font-semibold mb-4">Orders Over Time</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ordersOverTime}>
              <XAxis dataKey="date" tick={{ fill: '#7D8590', fontSize: 10 }} />
              <YAxis tick={{ fill: '#7D8590', fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="#2F81F7" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-admin-surface border border-admin-border p-5 rounded-md">
          <h2 className="text-admin-text font-semibold mb-4">Best Selling Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-admin-text-muted text-sm">No data available</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 10).map((p, i) => {
                const maxUnits = topProducts[0]?.units ?? 1;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-admin-text truncate">{p.name}</span>
                      <span className="font-mono text-admin-text-muted">{p.units} units</span>
                    </div>
                    <div className="h-2 bg-admin-bg rounded-full overflow-hidden">
                      <div className="h-full bg-admin-accent rounded-full" style={{ width: `${(p.units / maxUnits) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
