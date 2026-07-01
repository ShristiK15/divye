import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/useStore';
import { addItem } from '@/store/cartSlice';
import type { ProductListItem } from '@/types';
import { formatINR, parseDecimal } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const variant = product.variant;
  const image = product.primaryImage;
  const slug = product.slug ?? product.id;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!variant) return;
    dispatch(
      addItem({
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantName: variant.sku,
        sku: variant.sku,
        price: variant.price,
        mrp: variant.mrp,
        gstPercent: variant.gstPercent,
        quantity: 1,
        image: image ?? '',
        stockQty: variant.stockQty,
      })
    );
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/products/${slug}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${slug}`)}
      className="border border-[#262626] hover:border-white bg-[#111111] p-4 flex flex-col group transition-all duration-300 hover:shadow-[0_0_0_1px_#F5F5F5] cursor-pointer"
    >
      <div className="aspect-square bg-[#0A0A0A] p-4 mb-4 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            width={300}
            height={300}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#525252] text-xs">No image</div>
        )}
      </div>

      <p className="text-xs font-mono text-[#525252] mb-1">{product.brand}</p>
      <h3 className="font-syne font-semibold text-white text-sm mb-2 line-clamp-2 flex-1">{product.name}</h3>

      {variant && (
        <div className="mb-3">
          {parseDecimal(variant.mrp) > parseDecimal(variant.price) && (
            <span className="text-xs font-mono text-[#525252] line-through mr-2">
              {formatINR(parseDecimal(variant.mrp))}
            </span>
          )}
          <span className="font-mono text-white">{formatINR(parseDecimal(variant.price))}</span>
          <p className="text-[10px] text-[#525252] mt-0.5">(incl. {variant.gstPercent}% GST)</p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleAddToCart}
        disabled={!variant || variant.stockQty <= 0}
      >
        Add to Cart
      </Button>
    </div>
  );
}
