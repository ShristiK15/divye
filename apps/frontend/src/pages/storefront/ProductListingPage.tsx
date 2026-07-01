import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PaginationMeta } from 'shared';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Category, ProductListItem } from '@/types';
import { SEOHead } from '@/components/common/SEOHead';
import { ProductCard } from '@/components/storefront/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GST_RATES } from '@/lib/constants';
import { formatINR } from '@/lib/utils';
import { X } from 'lucide-react';

export default function ProductListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [showFilters, setShowFilters] = useState(false);

  const category = searchParams.get('category') ?? '';
  const brand = searchParams.get('brand') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const params: Record<string, string | number | boolean> = { page, limit: 12 };
    if (category) params.category = category;
    if (brand) params.brand = brand;
    if (sort) params.sort = sort;
    if (searchParams.get('isFeatured')) params.isFeatured = true;
    if (searchParams.get('minPrice')) params.minPrice = searchParams.get('minPrice')!;
    if (searchParams.get('maxPrice')) params.maxPrice = searchParams.get('maxPrice')!;
    if (searchParams.get('inStock')) params.inStock = true;

    api
      .get<PaginatedResult<ProductListItem>>('/products', { params })
      .then((res) => {
        const result = res.data as PaginatedResult<ProductListItem>;
        setProducts(result.data);
        setMeta(result.meta);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, brand, sort, page, searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    api.get<Category[]>('/categories').then((r) => setCategories(r.data as unknown as Category[]));
    api.get<string[]>('/products/brands').then((r) => setBrands(r.data as unknown as string[])).catch(() => {});
  }, []);

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const activeFilters: { key: string; label: string }[] = [];
  if (category) activeFilters.push({ key: 'category', label: `Category: ${category}` });
  if (brand) activeFilters.push({ key: 'brand', label: `Brand: ${brand}` });

  const FilterSidebar = () => (
    <aside className="bg-[#111111] border-r border-[#262626] p-6 space-y-6">
      <div>
        <h3 className="font-mono text-xs text-[#525252] uppercase mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateParam('category', category === cat.slug ? null : cat.slug)}
              className={`block text-sm w-full text-left ${category === cat.slug ? 'text-white' : 'text-[#A3A3A3] hover:text-white'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-mono text-xs text-[#525252] uppercase mb-3">Brand</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {brands.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => updateParam('brand', brand === b ? null : b)}
                className={`block text-sm w-full text-left ${brand === b ? 'text-white' : 'text-[#A3A3A3] hover:text-white'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-mono text-xs text-[#525252] uppercase mb-3">Price Range</h3>
        <Slider
          min={0}
          max={100000}
          step={500}
          value={priceRange}
          onValueChange={setPriceRange}
          onValueCommit={(v) => {
            updateParam('minPrice', String(v[0]));
            updateParam('maxPrice', String(v[1]));
          }}
          className="mb-2"
        />
        <p className="font-mono text-xs text-[#A3A3A3]">
          {formatINR(priceRange[0])} – {formatINR(priceRange[1])}
        </p>
      </div>

      <div>
        <h3 className="font-mono text-xs text-[#525252] uppercase mb-3">GST Rate</h3>
        {GST_RATES.map((rate) => (
          <label key={rate} className="flex items-center gap-2 text-sm text-[#A3A3A3] mb-2">
            <Checkbox />
            {rate}%
          </label>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-[#A3A3A3]">
        <Checkbox
          checked={searchParams.get('inStock') === 'true'}
          onCheckedChange={(c) => updateParam('inStock', c ? 'true' : null)}
        />
        In Stock
      </label>
    </aside>
  );

  return (
    <>
      <SEOHead title="All Products" description="Browse our full range of premium electronics." slug="products" />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-syne font-bold text-3xl text-white">Products</h1>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(true)}>
              Filters
            </Button>
            <Select value={sort} onValueChange={(v) => updateParam('sort', v || null)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="rating">Best Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => updateParam(f.key, null)}
                className="flex items-center gap-1 border border-[#262626] px-3 py-1 text-xs font-mono text-[#A3A3A3] hover:border-white"
              >
                {f.label} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-[240px_1fr] gap-0">
          <div className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
            <FilterSidebar />
          </div>

          <div className="p-4 lg:p-6">
            {loading ? (
              <LoadingSpinner className="py-20" />
            ) : products.length === 0 ? (
              <div className="border border-dashed border-[#262626] py-16 text-center">
                <p className="text-text-secondary">No products found</p>
                <Button variant="outline" className="mt-4" onClick={() => setSearchParams({})}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {meta && meta.totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => updateParam('page', String(p))}
                        className={`w-10 h-10 border text-sm font-mono ${
                          p === meta.page ? 'bg-white text-black border-white' : 'border-[#262626] text-[#A3A3A3]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-[#111111] max-h-[80vh] overflow-y-auto">
            <FilterSidebar />
          </div>
        </div>
      )}
    </>
  );
}
