import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { calculateGstBreakdown } from 'shared';
import api, { type PaginatedResult } from '@/lib/axios';
import type { Product, ProductVariant, Review } from '@/types';
import { SEOHead, buildProductSchema } from '@/components/common/SEOHead';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch } from '@/hooks/useStore';
import { addItem } from '@/store/cartSlice';
import { formatINR, parseDecimal, getPrimaryImageUrl } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const dispatch = useAppDispatch();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api
      .get<Product>(`/products/${slug}`)
      .then((res) => {
        const p = res.data as unknown as Product;
        setProduct(p);
        const active = p.variants.find((v) => v.isActive) ?? p.variants[0];
        setSelectedVariant(active ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    api
      .get<PaginatedResult<Review>>(`/reviews/products/${product.id}`, { params: { limit: 20 } })
      .then((res) => {
        const data = (res.data as PaginatedResult<Review>).data;
        setReviews(data.filter((r) => r.isApproved));
      })
      .catch(() => {});
  }, [product]);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (notFound || !product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="font-syne text-2xl text-white">Product not found</h1>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const variant = selectedVariant ?? product.variants[0];
  const available = variant ? variant.stockQty - variant.reservedQty : 0;
  const price = variant ? parseDecimal(variant.price) : 0;
  const mrp = variant ? parseDecimal(variant.mrp) : 0;
  const savings = mrp - price;
  const savingsPct = mrp > 0 ? Math.round((savings / mrp) * 100) : 0;
  const gstBreakdown = variant ? calculateGstBreakdown(variant.price, variant.gstPercent, 1) : null;

  const handleAddToCart = () => {
    if (!variant) return;
    dispatch(
      addItem({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantName: variant.name,
        sku: variant.sku,
        price: variant.price,
        mrp: variant.mrp,
        gstPercent: variant.gstPercent,
        quantity,
        image: getPrimaryImageUrl(product.images) ?? '',
        stockQty: variant.stockQty,
      })
    );
  };

  return (
    <>
      <SEOHead
        title={product.seo?.metaTitle ?? product.name}
        description={product.seo?.metaDescription ?? product.description.slice(0, 160)}
        keywords={product.seo?.keywords}
        ogImage={product.seo?.ogImage ?? getPrimaryImageUrl(product.images)}
        slug={`products/${product.seo?.slug ?? slug}`}
        schema={product.seo?.structuredData ?? buildProductSchema(product)}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-12">
          <div>
            <div className="aspect-square bg-[#111111] border border-[#262626] p-8 mb-4">
              {images[selectedImage] && (
                <img
                  src={images[selectedImage].url}
                  alt={images[selectedImage].altText ?? product.name}
                  className="w-full h-full object-contain"
                  loading="eager"
                  width={600}
                  height={600}
                />
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 border p-1 ${selectedImage === i ? 'border-white' : 'border-[#262626]'}`}
                >
                  <img src={img.url} alt={img.altText ?? ''} className="w-full h-full object-contain" loading="lazy" width={64} height={64} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-xs text-[#525252] mb-2">
              <Link to="/" className="hover:text-white">Home</Link> / {product.category.name} / {product.name}
            </p>
            <span className="border border-[#262626] text-xs font-mono text-[#A3A3A3] px-2 py-0.5">{product.brand}</span>
            <h1 className="font-syne font-bold text-3xl text-white mt-3 mb-4">{product.name}</h1>

            {product.variants.length > 1 && (
              <div className="mb-4">
                <p className="text-xs font-mono text-[#525252] mb-2">Select Variant</p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 py-1.5 text-sm ${
                        selectedVariant?.id === v.id
                          ? 'bg-white text-black'
                          : 'border border-[#262626] text-[#A3A3A3] hover:border-white'
                      }`}
                    >
                      {Object.values(v.attributes).join(' / ') || v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {variant && (
              <div className="mb-6">
                {savings > 0 && (
                  <span className="text-xs font-mono text-[#525252] line-through mr-2">{formatINR(mrp)}</span>
                )}
                <span className="font-mono text-3xl text-white">{formatINR(price)}</span>
                {savings > 0 && (
                  <span className="ml-2 border border-[#22C55E] text-[#22C55E] text-xs font-mono px-2 py-0.5">
                    {savingsPct}% off
                  </span>
                )}
                <p className="text-xs text-[#525252] mt-1">Price inclusive of {variant.gstPercent}% GST</p>
              </div>
            )}

            <p className={`text-sm font-mono mb-4 ${available > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {available > 0 ? `${available} in stock` : 'Out of stock'}
            </p>

            {variant?.hsnCode && (
              <p className="font-mono text-xs text-[#525252] mb-4">HSN: {variant.hsnCode}</p>
            )}

            <div className="flex items-center gap-3 mb-6">
              <button type="button" className="border border-[#262626] p-2" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease">
                <Minus className="h-4 w-4" />
              </button>
              <span className="font-mono w-8 text-center">{quantity}</span>
              <button type="button" className="border border-[#262626] p-2" onClick={() => setQuantity(Math.min(available, quantity + 1))} aria-label="Increase">
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button className="w-full mb-4" onClick={handleAddToCart} disabled={available <= 0}>
              Add to Cart
            </Button>

            <div className="border border-[#262626] p-4 text-sm text-[#A3A3A3] space-y-1">
              <p>✓ COD Available</p>
              <p>✓ Free shipping above ₹999</p>
              <p>✓ Estimated delivery: 3-5 business days</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="mt-12">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="gst">GST & Pricing</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{product.description}</p>
          </TabsContent>

          <TabsContent value="specs">
            <table className="w-full text-sm">
              <tbody>
                {[...product.specifications].sort((a, b) => a.sortOrder - b.sortOrder).map((spec) => (
                  <tr key={spec.id} className="border-b border-[#262626]">
                    <td className="py-3 font-mono text-[#525252] w-1/3">{spec.key}</td>
                    <td className="py-3 text-white">{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="gst">
            {gstBreakdown && variant && (
              <table className="w-full text-sm font-mono">
                <tbody>
                  <tr className="border-b border-[#262626]">
                    <td className="py-2 text-[#A3A3A3]">Base Price (excl. GST)</td>
                    <td className="py-2 text-right text-white">{formatINR(gstBreakdown.subtotal)}</td>
                  </tr>
                  <tr className="border-b border-[#262626]">
                    <td className="py-2 text-[#A3A3A3]">GST @ {variant.gstPercent}%</td>
                    <td className="py-2 text-right text-white">{formatINR(gstBreakdown.gstAmount)}</td>
                  </tr>
                  <tr className="border-b border-[#262626]">
                    <td className="py-2 text-[#A3A3A3]">HSN Code</td>
                    <td className="py-2 text-right text-white">{variant.hsnCode ?? '—'}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-[#A3A3A3]">Final Price</td>
                    <td className="py-2 text-right text-white font-bold">{formatINR(gstBreakdown.total)}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <p className="text-text-secondary">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-[#262626] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-[#F59E0B]">{'★'.repeat(review.rating)}</span>
                      <span className="text-sm text-white">{review.user?.name}</span>
                      {review.isVerified && <span className="text-xs text-[#525252]">Verified</span>}
                    </div>
                    {review.title && <p className="font-semibold text-white text-sm">{review.title}</p>}
                    {review.body && <p className="text-text-secondary text-sm mt-1">{review.body}</p>}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
