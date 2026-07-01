import { useEffect, useState } from 'react';
import api, { type PaginatedResult } from '@/lib/axios';
import type { InventoryVariant } from '@/types';
import { formatINR, parseDecimal } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminInventoryPage() {
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockVariant, setRestockVariant] = useState<InventoryVariant | null>(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockReason, setRestockReason] = useState('Restock');
  const [restockRef, setRestockRef] = useState('');

  useEffect(() => {
    api.get<PaginatedResult<InventoryVariant>>('/inventory', { params: { limit: 50 } })
      .then((res) => setVariants((res.data as PaginatedResult<InventoryVariant>).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const outOfStock = variants.filter((v) => v.stockQty === 0).length;
  const lowStock = variants.filter((v) => v.stockQty > 0 && v.stockQty <= v.lowStockThreshold).length;
  const totalValue = variants.reduce((sum, v) => sum + v.stockQty * parseDecimal(v.price), 0);

  const handleRestock = async () => {
    if (!restockVariant || !restockQty) return;
    await api.post(`/inventory/variant/${restockVariant.id}/restock`, {
      quantity: Number(restockQty),
      reason: restockReason,
      reference: restockRef,
    });
    setRestockVariant(null);
    setRestockQty('');
    const res = await api.get<PaginatedResult<InventoryVariant>>('/inventory', { params: { limit: 50 } });
    setVariants((res.data as PaginatedResult<InventoryVariant>).data);
  };

  if (loading) return <LoadingSpinner className="min-h-[50vh]" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total SKUs', value: variants.length },
          { label: 'Out of Stock', value: outOfStock },
          { label: 'Low Stock', value: lowStock },
          { label: 'Total Stock Value', value: formatINR(totalValue) },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-admin-surface border border-admin-border p-5 rounded-md">
            <p className="text-xs font-mono text-admin-text-muted uppercase">{kpi.label}</p>
            <p className="font-mono text-2xl text-admin-text">{kpi.value}</p>
          </div>
        ))}
      </div>

      {variants.filter((v) => v.stockQty <= v.lowStockThreshold).map((v) => (
        <div key={v.id} className="border-l-2 border-admin-error bg-admin-surface p-4 flex items-center justify-between">
          <p className="text-sm text-admin-text">{v.product.name} — <span className="font-mono">{v.sku}</span> ({v.stockQty} left)</p>
          <Button variant="admin" size="sm" onClick={() => setRestockVariant(v)}>Restock</Button>
        </div>
      ))}

      <div className="bg-admin-surface border border-admin-border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-admin-surface-2 text-xs font-mono text-admin-text-muted uppercase border-b border-admin-border">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Stock</th>
              <th className="p-3 text-left">Reserved</th>
              <th className="p-3 text-left">Available</th>
              <th className="p-3 text-left">Threshold</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {variants.map((v) => {
              const available = v.stockQty - v.reservedQty;
              const stockClass = v.stockQty === 0 ? 'text-admin-error' : v.stockQty <= v.lowStockThreshold ? 'text-admin-warning' : 'text-admin-success';
              return (
                <tr key={v.id} className="border-b border-admin-border">
                  <td className="p-3 text-admin-text">{v.product.name}</td>
                  <td className="p-3 font-mono text-xs text-admin-text-muted">{v.sku}</td>
                  <td className={`p-3 font-mono ${stockClass}`}>{v.stockQty}</td>
                  <td className="p-3 font-mono text-admin-text-muted">{v.reservedQty}</td>
                  <td className="p-3 font-mono text-admin-text">{available}</td>
                  <td className="p-3 font-mono text-admin-text-muted">{v.lowStockThreshold}</td>
                  <td className="p-3"><Button variant="adminOutline" size="sm" onClick={() => setRestockVariant(v)}>Restock</Button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={!!restockVariant} onOpenChange={() => setRestockVariant(null)}>
        <DialogContent className="bg-admin-surface border-admin-border">
          <DialogHeader><DialogTitle className="text-admin-text">Restock {restockVariant?.sku}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Quantity to Add</Label><Input type="number" value={restockQty} onChange={(e) => setRestockQty(e.target.value)} className="bg-admin-bg border-admin-border text-admin-text" /></div>
            <div><Label>Reference / Invoice No.</Label><Input value={restockRef} onChange={(e) => setRestockRef(e.target.value)} className="bg-admin-bg border-admin-border text-admin-text font-mono" /></div>
            <div><Label>Reason</Label><Input value={restockReason} onChange={(e) => setRestockReason(e.target.value)} className="bg-admin-bg border-admin-border text-admin-text" /></div>
            <Button variant="admin" onClick={handleRestock}>Confirm Restock</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
