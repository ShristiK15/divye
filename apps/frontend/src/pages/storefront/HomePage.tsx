import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Category, ProductListItem } from '@/types';
import { SEOHead } from '@/components/common/SEOHead';
import { ProductCard } from '@/components/storefront/ProductCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Smartphone, Laptop, Headphones, Tv, Watch, Cpu } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  phones: <Smartphone className="h-8 w-8" />,
  laptops: <Laptop className="h-8 w-8" />,
  audio: <Headphones className="h-8 w-8" />,
  tvs: <Tv className="h-8 w-8" />,
  wearables: <Watch className="h-8 w-8" />,
  default: <Cpu className="h-8 w-8" />,
};

const tabs = ['All', 'New Arrivals', 'Best Sellers', 'On Sale'] as const;

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Category[]>('/categories'),
      api.get<PaginatedResult<ProductListItem>>('/products', {
        params: { isFeatured: true, limit: 8 },
      }),
    ])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data as unknown as Category[]);
        setProducts((prodRes.data as PaginatedResult<ProductListItem>).data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <SEOHead
        title="Premium Electronics in Bihar"
        description="Premium electronics, genuine products, delivered across Bihar. Shop smartphones, laptops, audio & more."
        slug=""
      />

      <section className="min-h-screen bg-[#0A0A0A] flex items-center">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center py-20">
          <div>
            <h1 className="font-syne font-extrabold text-5xl md:text-7xl text-white leading-tight">
              Power.<br />
              Precision.<br />
              <span className="text-[#525252]">Performance.</span>
            </h1>
            <p className="mt-6 text-text-secondary text-lg max-w-md">
              Premium electronics, genuine products, delivered across Bihar.
            </p>
            <div className="mt-8 flex gap-4">
              <Button asChild>
                <Link to="/products">Shop Now</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/products?isFeatured=true">View Deals</Link>
              </Button>
            </div>
          </div>
          <div className="hidden lg:flex justify-center">
            {products[0] && products[0].primaryImage && (
              <img
                // src={products[0].images.find((i) => i.isPrimary)?.url ?? products[0].images[0]?.url}
                src={products[0].primaryImage ?? '/placeholder.png'}
                alt={products[0].name}
                className="max-h-[500px] object-contain"
                loading="eager"
                width={500}
                height={500}
              />
            )}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4">
        <h2 className="font-syne font-bold text-2xl text-white mb-8">Shop by Category</h2>
        {loading ? (
          <LoadingSpinner className="py-12" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="border border-[#262626] p-6 hover:border-white transition-all cursor-pointer group text-center"
              >
                <div className="text-[#A3A3A3] group-hover:text-white transition-colors flex justify-center mb-3">
                  {cat.image ? (
                    <img src={cat.image} alt={cat.name} className="h-8 w-8 object-contain" loading="lazy" width={32} height={32} />
                  ) : (
                    categoryIcons[cat.slug] ?? categoryIcons.default
                  )}
                </div>
                <p className="text-sm text-white font-inter">{cat.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <h2 className="font-syne font-bold text-2xl text-white">Featured Products</h2>
          <div className="flex gap-2 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm rounded-full transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-black'
                    : 'border border-[#262626] text-[#A3A3A3] hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <div className="bg-[#111111] border-y border-[#262626] overflow-hidden marquee-container">
        <div className="marquee-track flex whitespace-nowrap animate-marquee py-3">
          {[...Array(2)].map((_, i) => (
            <span key={i} className="font-mono text-sm text-[#A3A3A3] px-8">
              Free Shipping above ₹999 • COD Available • GST Invoice on Every Order • 7-Day Returns
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
