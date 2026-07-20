# Phase 5 Implementation Plan — Divye Electronic Solutions Frontend Architecture

## Executive Summary & Goal
The objective is to build a high-performance, enterprise-grade, visually stunning e-commerce frontend for **Divye Electronic Solutions** (`@divye/frontend`) inside `apps/frontend`. 

The platform caters to B2C electronics customers in the Indian market with features tailored for electronics components, kits, and consumer devices—including GST invoicing compliance, Razorpay payment gateway integration, Cash on Delivery (COD) workflows, detailed technical specs, and a high-density, utilitarian-premium visual aesthetic.

---

## 1. Monorepo & Backend Architecture Analysis

### 1.1 Monorepo Workspace & Build Chain
- **Root `package.json` Workspaces**: `"apps/*"`, `"packages/*"`
- **Packages**:
  - `@divye/shared` (`packages/shared`): Shared TypeScript types, API response contracts, money/decimal utilities, GST breakdown calculator, and slug generator.
  - `@divye/database` (`packages/database`): Prisma schema, client instance, database migrations, and exported Prisma enums (`Role`, `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `StockMovementType`).
  - `@divye/backend` (`apps/backend`): Express 4 server with modular TypeScript architecture.
  - `@divye/frontend` (`apps/frontend`): **New package to be created** using Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, and Redux Toolkit.
- **Established Monorepo Build Order**:
  1. `npm install`
  2. `npm run db:generate` (`prisma generate` in `packages/database`)
  3. Build `packages/shared`
  4. Build `packages/database`
  5. Build `apps/backend` & `apps/frontend`

### 1.2 Backend Architecture & Conventions
- **Layering**: Express Router $\rightarrow$ Validation Middleware $\rightarrow$ Controller $\rightarrow$ Service $\rightarrow$ Prisma ORM.
- **Response Envelopes**:
  - **Success**: `{ success: true, data: T, message: string }` (`ApiSuccessResponse<T>`)
  - **Paginated**: `{ success: true, data: T[], meta: { total, page, limit, totalPages } }` (`ApiPaginatedResponse<T>`)
  - **Error**: `{ success: false, error: string, code: string, statusCode: number }` (`ApiErrorResponse`)
- **Error Codes**: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `INTERNAL_ERROR`.
- **Validation**: Zod schemas inside `<module>.types.ts` evaluated via `validate(schema, source)`.

---

## 2. Backend API Inventory & Module Stability Audit

| Module | Endpoints Available | Backend Status | Stability Flag | Loose Coupling / Frontend Strategy |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST /api/auth/register`<br>`POST /api/auth/login`<br>`POST /api/auth/logout`<br>`POST /api/auth/refresh`<br>`POST /api/auth/verify-email`<br>`POST /api/auth/forgot-password`<br>`POST /api/auth/reset-password`<br>`GET /api/auth/me` | Audit Complete | **STABLE** | Full integration with Redux auth slice & Axios interceptor token refresh. |
| **Products** | `GET /api/products`<br>`GET /api/products/brands`<br>`GET /api/products/category/:slug`<br>`GET /api/products/:identifier`<br>`POST /api/products` (Admin)<br>`PUT /api/products/:id` (Admin)<br>`DELETE /api/products/:id` (Admin)<br>`POST /api/products/:id/images` (Admin)<br>`DELETE /api/products/:id/images/:imageId` | Audit Complete | **STABLE** | Filter, search, pagination, and multi-variant support fully aligned with API contracts. |
| **Categories** | `GET /api/categories`<br>`GET /api/categories/:slug`<br>`POST /api/categories` (Admin)<br>`PUT /api/categories/:id` (Admin)<br>`DELETE /api/categories/:id` | Audit Complete | **STABLE** | Mega-menu and breadcrumbs powered dynamically by hierarchical tree endpoint. |
| **Cart** | `GET /api/cart`<br>`POST /api/cart/items`<br>`PUT /api/cart/items/:id`<br>`DELETE /api/cart/items/:id`<br>`DELETE /api/cart`<br>`POST /api/cart/validate` | Audit Complete | **STABLE** | Uses row-level atomic locks in SQL. Frontend maintains guest cart in LocalStorage/Redux and syncs upon login. |
| **Orders** | `POST /api/orders`<br>`GET /api/orders`<br>`GET /api/orders/admin`<br>`PUT /api/orders/admin/:id/status`<br>`GET /api/orders/:orderNumber`<br>`POST /api/orders/:id/cancel`<br>`POST /api/orders/:id/return` | Audit Complete | **STABLE** | Atomic stock reservation and price snapshot display. |
| **Payments** | `POST /api/payments/razorpay/create-order`<br>`POST /api/payments/razorpay/verify`<br>`POST /api/payments/cod/confirm`<br>`POST /api/payments/refund/:orderId` | Audit Complete | **STABLE** | Integrated Razorpay Checkout JS SDK + COD confirmation step. |
| **Reviews** | `POST /api/reviews/products/:productId`<br>`GET /api/reviews/products/:productId`<br>`GET /api/reviews/admin/pending`<br>`POST /api/reviews/:id/images`<br>`DELETE /api/reviews/:id/images/:imageId`<br>`PUT /api/reviews/:id/approve`<br>`DELETE /api/reviews/:id/remove` | Audit Complete | **STABLE** | Verified purchase badge, star rating, and image attachments. |
| **SEO** | `GET /api/products/:id/seo`<br>`PUT /api/products/:id/seo` | Audit Complete | **STABLE** | Integrated with `react-helmet-async` for per-product metadata & Schema.org JSON-LD. |
| **Inventory** | `GET /api/inventory`<br>`GET /api/inventory/low-stock`<br>`GET /api/inventory/variant/:variantId/logs`<br>`POST /api/inventory/variant/:variantId/adjust`<br>`POST /api/inventory/variant/:variantId/restock`<br>`POST /api/inventory/bulk-update` | Audit Complete | **STABLE** | Admin inventory table, restock modal, stock movement logs, and CSV bulk import. |
| **Admin Analytics**| `GET /api/admin/analytics/overview`<br>`GET /api/admin/analytics/revenue/monthly`<br>`GET /api/admin/analytics/customers/acquisition`<br>`GET /api/admin/analytics/customers/retention`<br>`GET /api/admin/analytics/products/top`<br>`GET /api/admin/analytics/products/:id/sales`<br>`GET /api/admin/analytics/orders/recent` | Audit Complete | **STABLE** | Dashboard powered by Recharts (monthly revenue, customer acquisition, top products). |
| **Settings** | Code exists in `modules/settings` | **UNMOUNTED IN APP.TS** | **FLAGGED** | Routes not mounted in `app.ts`. Frontend will use safe fallback defaults (free shipping threshold ₹999, flat charge ₹50) and gracefully degrade if `/api/settings` returns 404. |
| **Carriers** | Code exists in `modules/carriers` | **UNMOUNTED IN APP.TS** | **FLAGGED** | Routes not mounted in `app.ts`. Frontend will provide standard carrier link templates (Delhivery, BlueDart, DTDC) with tracking ID copy feature. |
| **Wishlist** | `WishlistItem` Prisma model exists | **NO BACKEND MODULE** | **FLAGGED** | Implemented client-side in Redux Toolkit + LocalStorage with a pluggable service layer ready for backend integration once created. |
| **Addresses**| `Address` Prisma model exists | **EMBEDDED IN ORDERS** | **FLAGGED** | No standalone `/api/addresses` CRUD route. Saved customer addresses will be managed in Redux/LocalStorage and passed inline during order placement. |
| **Coupons** | `Coupon` Prisma model exists | **NO API ENDPOINT** | **FLAGGED** | No coupon validation endpoint available. Coupon code field in checkout passes code to `placeOrderSchema`. UI shows error if order submission rejects invalid coupon. |
| **Notifications**| WhatsApp/SMS service exists in backend | **INTERNAL SERVICE ONLY** | **STABLE** | Triggered server-side on order events. UI provides order status timeline and contact support links. |

---

## 3. Core Business Logic & Non-Negotiable Rules

1. **Decimal & Currency Precision**:
   - Every price field returned from API is a string representing a decimal.
   - All client-side arithmetic MUST use `parseDecimal(value)` from `@divye/shared` combined with `decimal.js`.
   - Never use raw `parseFloat()` or Javascript number operators on money fields.
   - Display formatting MUST use Indian Numbering Format (`en-IN`: `₹1,23,456.00`).
2. **GST Math**:
   - All GST calculations MUST use `calculateGstBreakdown(inclusivePrice, gstPercent, quantity)` from `@divye/shared`.
   - Inclusive price is broken down into base subtotal, GST amount (CGST+SGST or IGST), and total.
3. **Snapshotted Order Prices**:
   - `OrderItem` prices in order detail pages are historical snapshots from the order creation time and MUST NEVER be recalculated from current product catalog prices.
4. **Authentication & Token Storage Architecture**:
   - **Access Token**: Short-lived JWT stored **in-memory** in Redux state (`authSlice`). Attached via `Authorization: Bearer <token>` in Axios request headers.
   - **Refresh Token**: Stored in DB and delivered via `httpOnly`, `sameSite: 'lax'` cookie on `/api/auth` path.
   - **Token Refresh Flow**:
     - Axios response interceptor intercepts `401 Unauthorized`.
     - Automatically calls `POST /api/auth/refresh` with `withCredentials: true`.
     - Upon receiving new `accessToken`, retries the failed request.
     - On refresh failure, clears auth state and redirects user to `/login`.

---

## 4. Frontend Design System — Divye Electronic Solutions Identity

### 4.1 Aesthetic & Typography Guidelines
Inspired by Indian electronics component storefronts (utilitarian, high information density, clean industrial feel):
- **Display Typography**: `Syne` (Headings, Banners, Hero titles)
- **Body Typography**: `Inter` (UI elements, Product titles, Filters, Forms)
- **Monospace Typography**: `JetBrains Mono` (Prices, SKUs, HSN codes, Order Numbers, Technical parameters)

### 4.2 Color Palette Tokens
- **Background Base**: `#0b0f17` (Dark Mode canvas) / `#f8fafc` (Light Mode / Crisp Storefront canvas)
- **Primary Brand / Slate**: `#0f172a` (Deep Obsidian Slate)
- **Accent Primary (Electric Cyan)**: `#0284c7` / `#06b6d4`
- **Accent Secondary (Signal Amber)**: `#d97706` / `#f59e0b` (Low stock warning, badges)
- **Success Highlight (Emerald)**: `#059669` / `#10b981` (In-stock badge, verified review)
- **Borders & Dividers**: Crisp, thin 1px slate borders (`#e2e8f0` / `#1e293b`).

### 4.3 UI Primitives Strategy
We will configure **Tailwind CSS** with CSS variables and leverage **shadcn/ui** (built on Radix UI primitives) for accessible dialogs, drop-down menus, select fields, tabs, tooltips, and data tables.

---

## 5. Technical Stack & State Architecture

### 5.1 Technology Stack
- **Framework**: React 18 + TypeScript + Vite
- **Routing**: React Router v6 (`createBrowserRouter`)
- **State Management**:
  - **Redux Toolkit (`@reduxjs/toolkit`)**: Global cross-cutting state (`authSlice`, `cartSlice`, `wishlistSlice`, `uiSlice`).
  - **TanStack Query v5 (`@tanstack/react-query`)**: Server data fetching, caching, deduplication, and invalidation for product catalog, categories, orders, reviews, and admin dashboard.
- **Forms & Validation**: `react-hook-form` + `@hookform/resolvers` + `zod` (reusing schemas from backend/shared where applicable).
- **Styling & Motion**: Tailwind CSS + `clsx` + `tailwind-merge` + `framer-motion` + `lucide-react`.
- **SEO & Meta**: `react-helmet-async` + Schema.org structured JSON-LD scripts.
- **Data Visualization**: `recharts` for Admin Analytics charts.

### 5.2 Application Folder Structure (`apps/frontend/src`)
```
apps/frontend/src/
├── api/                   # Axios client instance, endpoints registry, interceptors
├── assets/                # Logos, default imagery, placeholder SVGs
├── components/
│   ├── common/            # Header, TopBar, Footer, MegaMenu, SearchBar, Pagination, TrustBadges
│   ├── ui/                # shadcn UI primitives (Button, Input, Card, Badge, Dialog, Select, Table, etc.)
│   └── feedback/          # Toast, Skeleton, EmptyState, ErrorBoundary, LoadingSpinner
├── features/
│   ├── auth/              # LoginForm, RegisterForm, ResetPasswordForm, AuthGuard, RoleGuard
│   ├── products/          # ProductCard, ProductGrid, ProductFilter, ProductGallery, VariantSelector, TechSpecs
│   ├── categories/        # CategoryCard, MegaMenuCategoryTree, CategoryHero
│   ├── cart/              # CartDrawer, CartItemRow, CartSummary, FreeShippingProgress
│   ├── wishlist/          # WishlistButton, WishlistGrid
│   ├── checkout/          # AddressForm, PaymentMethodSelector, OrderSummaryCard, RazorpayPayButton
│   ├── orders/            # OrderStatusBadge, OrderTimeline, OrderItemRow, TrackingCard
│   ├── reviews/           # ReviewCard, ReviewList, AddReviewDialog, RatingStars
│   └── admin/             # InventoryTable, RestockModal, AnalyticsCharts, SeoEditor, HeroImageManager
├── hooks/                 # Custom hooks (useAuth, useCart, useGst, useDebounce, useRazorpay)
├── layouts/               # RootLayout, StorefrontLayout, AccountLayout, AdminLayout
├── lib/                   # Utility helpers, decimal formatters, indianCurrency formatter
├── pages/                 # Route page components
├── providers/             # Redux Provider, QueryClientProvider, HelmetProvider, ThemeProvider
├── routes/                # Router definition (public, protected, admin routes)
├── store/                 # Redux Toolkit store & slices (auth, cart, wishlist, ui)
├── styles/                # index.css with font imports, Tailwind directives, custom CSS tokens
└── types/                 # Frontend-specific UI types & API contract extensions
```

---

## 6. Detailed Page-by-Page Architecture Plan

### 6.1 Storefront Pages

#### Page 1: Home Page (`/`)
- **Purpose**: High-impact landing page featuring hero banner carousel, top categories mega-rail, featured products, newly added components, value propositions, and trust badges.
- **API Dependencies**: `GET /api/categories`, `GET /api/products?isFeatured=true`, `GET /api/products?limit=8&sort=newest`, `GET /api/settings` (or public fallback).
- **State**: Server state (TanStack Query for categories & products), local hero slide index.
- **Components**: `HeroCarousel`, `CategoryGridRail`, `FeaturedProductRail`, `NewArrivalsRail`, `ValuePropsStrip`, `TrustBadgeSection`.

#### Page 2: Product Listing / Search Page (`/products`, `/category/:slug`)
- **Purpose**: High-performance component catalog with faceted sidebar filtering, instant text search, sorting, view toggle (Grid/List), and pagination.
- **API Dependencies**: `GET /api/products` (with query params: `search`, `category`, `brand`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, `limit`), `GET /api/products/brands`.
- **State**: URL query params (search, category, brand, minPrice, maxPrice, inStock, sort, page), syncs with TanStack Query.
- **Components**: `ProductFilterSidebar`, `PriceRangeSlider`, `ActiveFiltersBar`, `ProductGrid`, `ProductCard`, `Pagination`, `EmptySearchResults`.

#### Page 3: Product Detail Page (`/products/:slug`)
- **Purpose**: Deep-dive product showcase featuring image gallery, multi-variant selector (price/stock dynamic updates), GST breakdown calculator preview, tech specifications table, stock status, bulk quantity selector, sticky Add-to-Cart bar, and customer reviews.
- **API Dependencies**: `GET /api/products/:identifier`, `GET /api/reviews/products/:productId`, `GET /api/products/:id/seo`.
- **State**: Selected variant ID, quantity, active image index, tab state (Description / Specs / Reviews).
- **Components**: `ProductGallery`, `VariantSelector`, `GstBreakdownBadge`, `StockIndicator`, `QuantitySelector`, `AddToCartButton`, `WishlistToggleButton`, `TechSpecsTable`, `ReviewList`, `AddReviewModal`, `SchemaOrgJsonLd`.

#### Page 4: Shopping Cart Page & Drawer (`/cart` & Slide-over Drawer)
- **Purpose**: Full review of cart items, unit price, quantity modifier, stock warning indicator, subtotal breakdown, estimated GST, and free shipping progress bar.
- **API Dependencies**: `GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `POST /api/cart/validate`.
- **State**: Redux `cartSlice` synchronized with server cart API for logged-in users, or LocalStorage for guest users.
- **Components**: `CartDrawer`, `CartTable`, `QuantitySelector`, `CartSummaryCard`, `FreeShippingThresholdBar`, `StockAlertToast`.

#### Page 5: Checkout Page (`/checkout`)
- **Purpose**: Multi-step checkout flow: 1. Shipping Address input/selection $\rightarrow$ 2. Order Review & GST calculation $\rightarrow$ 3. Payment Method Selection (Razorpay Online / COD) $\rightarrow$ 4. Order Confirmation.
- **API Dependencies**: `POST /api/cart/validate`, `POST /api/orders`, `POST /api/payments/razorpay/create-order`, `POST /api/payments/razorpay/verify`, `POST /api/payments/cod/confirm`.
- **State**: Selected address, payment method, order processing state, Razorpay modal trigger.
- **Components**: `AddressFormModal`, `SavedAddressSelector`, `CheckoutItemSummary`, `GstTaxBreakdownCard`, `PaymentMethodRadioGroup`, `RazorpayPayButton`, `OrderProcessingOverlay`.

#### Page 6: Order Success & Tracking Page (`/orders/:orderNumber`)
- **Purpose**: Detailed receipt and status tracker for a placed order, including order timeline (PENDING $\rightarrow$ CONFIRMED $\rightarrow$ SHIPPED $\rightarrow$ DELIVERED), snapshotted price breakdown, delivery address, carrier info, and tracking link.
- **API Dependencies**: `GET /api/orders/:orderNumber`, `POST /api/orders/:id/cancel`, `POST /api/orders/:id/return`.
- **State**: Order detail query, cancel/return confirmation dialogs.
- **Components**: `OrderHeaderCard`, `OrderStatusTimeline`, `OrderItemList`, `SnapshottedPriceSummary`, `CarrierTrackingBox`, `CancelOrderDialog`.

#### Page 7: Customer Account & Orders History (`/account/*`)
- **Purpose**: Customer dashboard to view profile info, order history list with filtering by status, saved addresses, and account settings.
- **API Dependencies**: `GET /api/auth/me`, `GET /api/orders` (user orders).
- **State**: Active tab, orders filter.
- **Components**: `AccountSidebar`, `ProfileOverviewCard`, `UserOrdersTable`, `SavedAddressesGrid`.

#### Page 8: Wishlist Page (`/wishlist`)
- **Purpose**: Quick-access page listing bookmarked items with one-click "Move to Cart" button.
- **API Dependencies**: Managed via Redux `wishlistSlice` + LocalStorage with backend sync hook.
- **Components**: `WishlistGrid`, `WishlistCard`, `MoveToCartButton`.

#### Page 9: Auth Pages (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`)
- **Purpose**: Secure, polished user authentication views with Zod form validation, show/hide password toggles, and seamless post-login redirection.
- **API Dependencies**: `POST /api/auth/*`.
- **Components**: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `EmailVerifyStatusCard`.

---

### 6.2 Admin Control Panel Pages (`/admin/*`)

#### Page 10: Admin Dashboard Overview (`/admin`)
- **Purpose**: Executive overview showing total revenue, order metrics, low stock count, monthly sales trend chart, customer acquisition stats, and recent order activity feed.
- **API Dependencies**: `GET /api/admin/analytics/overview`, `GET /api/admin/analytics/revenue/monthly`, `GET /api/admin/analytics/orders/recent`, `GET /api/inventory/low-stock`.
- **Components**: `AnalyticsKpiCard`, `MonthlyRevenueChart`, `RecentOrdersWidget`, `LowStockAlertWidget`.

#### Page 11: Admin Product Management (`/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`)
- **Purpose**: Full CRUD interface for product catalog: multi-variant pricing/GST/stock setup, Cloudinary image uploader, tech specs editor, and SEO metadata manager.
- **API Dependencies**: `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`, `POST /api/products/:id/images`, `DELETE /api/products/:id/images/:imageId`, `PUT /api/products/:id/seo`.
- **Components**: `AdminProductsDataTable`, `ProductFormWizard`, `VariantMatrixEditor`, `CloudinaryImageUploader`, `SeoMetaForm`.

#### Page 12: Admin Inventory Control (`/admin/inventory`)
- **Purpose**: Specialized inventory desk for tracking variant stock levels, low-stock alerts, manual stock adjustments, restock entries, stock movement audit logs, and CSV bulk updates.
- **API Dependencies**: `GET /api/inventory`, `GET /api/inventory/low-stock`, `GET /api/inventory/variant/:variantId/logs`, `POST /api/inventory/variant/:variantId/adjust`, `POST /api/inventory/variant/:variantId/restock`, `POST /api/inventory/bulk-update`.
- **Components**: `InventoryDataTable`, `RestockModal`, `StockAdjustModal`, `StockMovementLogDrawer`, `CsvBulkUpdateModal`.

#### Page 13: Admin Order Management (`/admin/orders`, `/admin/orders/:id`)
- **Purpose**: Order fulfillment desk: view all customer orders, filter by status/date, update order lifecycle state (CONFIRMED $\rightarrow$ PROCESSING $\rightarrow$ SHIPPED), attach tracking ID and carrier information.
- **API Dependencies**: `GET /api/orders/admin`, `PUT /api/orders/admin/:id/status`, `GET /api/carriers/admin`.
- **Components**: `AdminOrdersDataTable`, `OrderStatusUpdateModal`, `CarrierAssignSelect`, `OrderFulfillmentCard`.

#### Page 14: Admin Homepage & Hero Settings (`/admin/settings/homepage`)
- **Purpose**: Upload, reorder, update alt text, and delete hero banner slides that appear on the customer homepage carousel.
- **API Dependencies**: `/api/admin/settings/homepage/hero-images` (POST, PUT order, DELETE, PATCH alt).
- **Components**: `HeroImageGrid`, `DragDropReorderList`, `HeroImageUploadZone`.

---

## 7. Component & Design Primitives Inventory

1. **Header & Navigation**: `TopUtilityBar`, `MainHeader`, `SearchBarWithAutoComplete`, `MegaMenu`, `MobileNavDrawer`, `AccountDropdown`.
2. **Product Display**: `ProductCard`, `ProductGrid`, `ProductGallery`, `VariantBadgeGroup`, `GstBreakdownBadge`, `TechSpecsTable`, `StockStatusBadge`.
3. **Cart & Checkout**: `CartDrawer`, `CartSummary`, `FreeShippingProgressBar`, `AddressCard`, `PaymentMethodRadio`, `RazorpayPayButton`.
4. **Order Management**: `OrderTimeline`, `OrderStatusBadge`, `OrderItemRow`, `TrackingCard`.
5. **Feedback & Primitives**: `Toast`, `SkeletonLoader`, `EmptyState`, `ConfirmDialog`, `Modal`, `DataTable` (TanStack Table + shadcn), `RechartsCard`.

---

## 8. Development Milestones & Execution Plan

```
Milestone 1: Project Setup & Infrastructure (Vite + TS + Tailwind + shadcn inside apps/frontend)
Milestone 2: Design Tokens & Shared UI Primitives (Syne/Inter/JetBrains Mono + Buttons + Cards + Modals)
Milestone 3: Authentication & Authorization Flow (Redux auth slice + Login/Register + Axios interceptors)
Milestone 4: Storefront Shell & Navigation (TopBar + Header + MegaMenu + Footer)
Milestone 5: Product Catalog, Filters & Search (Product listing + Facets + Search + Pagination)
Milestone 6: Product Detail Page & Tech Specs (Gallery + Variant Selector + Specs + Reviews)
Milestone 7: Shopping Cart Architecture (Drawer + LocalStorage/Server Cart Sync + GST math)
Milestone 8: Checkout Flow & Razorpay Integration (Address selection + Payment method + Razorpay SDK)
Milestone 9: Order Tracking & Customer Account (Order timeline + User order history + Profile)
Milestone 10: Wishlist Client Feature (Redux slice + LocalStorage + Move to Cart)
Milestone 11: Admin Control Panel — Inventory & Analytics (Recharts + Inventory Table + Restock Modal)
Milestone 12: Admin Control Panel — Product Catalog, Orders & SEO Management (Product Form + Order Fulfillment)
```

---

## 9. Verification & Quality Assurance Plan

1. **Type Safety Verification**: Run `tsc --noEmit` across `@divye/shared`, `@divye/database`, `@divye/backend`, and `@divye/frontend` to ensure 100% type compliance without `any` overrides.
2. **Build Verification**: Run `npm run build:frontend` to confirm Vite production bundle completes cleanly without bundling errors or missing imports.
3. **Decimal & Money Verification**: Verify that no standard floating point arithmetic (`+`, `-`, `*`, `/`) is performed on currency values; verify all GST calculations output exact 2-decimal rounded outputs matching `@divye/shared`.
4. **Responsive UI Verification**: Test layout rendering across Desktop (1440px+), Tablet (768px), and Mobile (375px) breakpoints.

---
