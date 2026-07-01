import type { Review } from './review';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductSpec {
  id: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface ProductSeo {
  id: string;
  metaTitle: string | null;
  metaDescription: string | null;
  slug: string;
  focusKeyword: string | null;
  keywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  structuredData: Record<string, unknown> | null;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  mrp: string;
  gstPercent: string;
  hsnCode: string | null;
  stockQty: number;
  reservedQty: number;
  lowStockThreshold: number;
  isActive: boolean;
  supplierId: string | null;
  attributes: Record<string, string>;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  specifications: ProductSpec[];
  seo: ProductSeo | null;
  reviews?: Review[];
}

// export interface ProductListItem {
//   id: string;
//   name: string;
//   brand: string;
//   isActive: boolean;
//   isFeatured: boolean;
//   category: Pick<Category, 'id' | 'name' | 'slug'>;
//   images: ProductImage[];
//   variants: Pick<
//     ProductVariant,
//     'id' | 'sku' | 'price' | 'mrp' | 'gstPercent' | 'stockQty' | 'isActive'
//   >[];
//   seo: Pick<ProductSeo, 'slug'> | null;
// }

export interface ProductListVariant {
  id: string;
  sku: string;
  price: string;
  mrp: string;
  gstPercent: string;
  stockQty: number; // already net of reserved
}

export interface ProductListItem {
  id: string;
  name: string;
  brand: string;
  isActive: boolean;
  isFeatured: boolean;
  slug: string | null;
  primaryImage: string | null;
  category: Pick<Category, 'id' | 'name' | 'slug'>;
  variant: ProductListVariant | null;
}
