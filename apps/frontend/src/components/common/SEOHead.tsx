import { Helmet } from 'react-helmet-async';
import type { Product } from '@/types';
import { parseDecimal, getActiveVariant, getPrimaryImageUrl } from '@/lib/utils';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  slug?: string;
  schema?: Record<string, unknown>;
  noIndex?: boolean;
}

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://divyeelectronics.in';

export function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  slug,
  schema,
  noIndex = false,
}: SEOHeadProps) {
  const fullTitle = `${title} | Divye Electronics`;
  const canonical = slug ? `${APP_URL}/${slug}` : APP_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords?.length ? <meta name="keywords" content={keywords.join(', ')} /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      {schema ? (
        <script type="application/ld+json">{JSON.stringify(schema)}</script>
      ) : null}
    </Helmet>
  );
}

export function buildProductSchema(product: Product): Record<string, unknown> {
  const variant = getActiveVariant(product.variants);
  const image = getPrimaryImageUrl(product.images);
  const reviews = product.reviews?.filter((r) => r.isApproved) ?? [];
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : undefined;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image,
    brand: { '@type': 'Brand', name: product.brand },
    offers: variant
      ? {
          '@type': 'Offer',
          price: parseDecimal(variant.price),
          priceCurrency: 'INR',
          availability:
            variant.stockQty > variant.reservedQty
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
        }
      : undefined,
  };

  if (avgRating && reviews.length) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
    };
  }

  return schema;
}
