import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { type PaginatedResult } from '@/lib/axios';
import type { User } from '@/types';
import { formatINR } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Input } from '@/components/ui/input';

type CustomerRow = User & { orderCount?: number; totalSpent?: string };

export default function AdminCustomerListPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    api.get<PaginatedResult<CustomerRow>>('/admin/customers', { params: { search: debouncedSearch, limit: 20 } })
      .then((res) => setCustomers((res.data as PaginatedResult<CustomerRow>).data))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="space-y-4">
      <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 bg-admin-bg border-admin-border text-admin-text" />

      {loading ? <LoadingSpinner /> : customers.length === 0 ? (
        <div className="border border-dashed border-admin-border py-16 text-center text-admin-text-muted">No customers found</div>
      ) : (
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-admin-surface-2 text-xs font-mono text-admin-text-muted uppercase border-b border-admin-border">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Orders</th>
                <th className="p-3 text-left">Total Spent</th>
                <th className="p-3 text-left">Registered</th>
                <th className="p-3 text-left">View</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-admin-border">
                  <td className="p-3 text-admin-text">{c.name}</td>
                  <td className="p-3 text-admin-text-muted">{c.email}</td>
                  <td className="p-3 font-mono text-xs text-admin-text-muted">{c.phone ?? '—'}</td>
                  <td className="p-3 text-admin-text-muted">{c.orderCount ?? 0}</td>
                  <td className="p-3 font-mono text-admin-text">{c.totalSpent ? formatINR(c.totalSpent) : '—'}</td>
                  <td className="p-3 font-mono text-xs text-admin-text-muted">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3"><Link to={`/admin/customers/${c.id}`} className="text-admin-accent text-xs hover:underline">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
