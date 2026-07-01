import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Plus } from 'lucide-react';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Category, ProductListItem } from '@/types';
import { formatINR, parseDecimal } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminProductListPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const debouncedSearch = useDebounce(search);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '20' };
    if (debouncedSearch) params.search = debouncedSearch;
    if (category) params.category = category;
    if (status === 'active') params.isActive = 'true';
    if (status === 'draft') params.isActive = 'false';

    api.get<PaginatedResult<ProductListItem>>('/products', { params })
      .then((res) => setProducts((res.data as PaginatedResult<ProductListItem>).data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, category, status]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { api.get<Category[]>('/categories').then((r) => setCategories(r.data as unknown as Category[])); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex flex-wrap gap-3">
          <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-64 bg-admin-bg border-admin-border text-admin-text" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 bg-admin-bg border-admin-border text-admin-text"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32 bg-admin-bg border-admin-border text-admin-text"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="admin" asChild><Link to="/admin/products/new"><Plus className="h-4 w-4 mr-2" />Add Product</Link></Button>
      </div>

      {loading ? <LoadingSpinner /> : products.length === 0 ? (
        <div className="border border-dashed border-admin-border py-16 text-center text-admin-text-muted">No products found</div>
      ) : (
        <div className="bg-admin-surface border border-admin-border rounded-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-admin-surface-2 text-xs font-mono text-admin-text-muted uppercase border-b border-admin-border">
                <th className="p-3 text-left">Image</th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">SKU</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">GST%</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const variant = product.variant;
                const image = product.primaryImage;
                const stock = variant?.stockQty ?? 0;
                return (
                  <tr key={product.id} className="border-b border-admin-border">
                    <td className="p-3">{image && <img src={image} alt="" className="w-10 h-10 object-contain" loading="lazy" width={40} height={40} />}</td>
                    <td className="p-3"><p className="text-admin-text">{product.name}</p><p className="text-xs text-admin-text-muted">{product.brand}</p></td>
                    <td className="p-3 font-mono text-xs text-admin-text-muted">{variant?.sku}</td>
                    <td className="p-3 text-admin-text-muted">{product.category.name}</td>
                    <td className="p-3 font-mono text-admin-text">{variant ? formatINR(parseDecimal(variant.price)) : '—'}</td>
                    <td className="p-3 font-mono text-admin-text-muted">{variant?.gstPercent}%</td>
                    <td className={`p-3 font-mono ${stock === 0 ? 'text-admin-error' : stock <= 5 ? 'text-admin-warning' : 'text-admin-success'}`}>{stock}</td>
                    <td className="p-3"><span className={product.isActive ? 'text-admin-success text-xs' : 'text-admin-text-muted text-xs'}>{product.isActive ? 'Active' : 'Draft'}</span></td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/products/${product.id}/edit`} className="text-admin-text-muted hover:text-admin-accent" aria-label="Edit"><Pencil className="h-4 w-4" /></Link>
                        <button type="button" onClick={() => handleDelete(product.id)} className="text-admin-text-muted hover:text-admin-error" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
