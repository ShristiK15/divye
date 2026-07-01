import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { PageLoader } from '@/components/common/LoadingSpinner';
import { StorefrontLayout } from '@/components/storefront/StorefrontLayout';
import { AdminLayout } from '@/components/admin/AdminLayout';

const HomePage = lazy(() => import('@/pages/storefront/HomePage'));
const ProductListingPage = lazy(() => import('@/pages/storefront/ProductListingPage'));
const ProductDetailPage = lazy(() => import('@/pages/storefront/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/storefront/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/storefront/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@/pages/storefront/OrderSuccessPage'));
const LoginPage = lazy(() => import('@/pages/storefront/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/storefront/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/storefront/ForgotPasswordPage'));
const OrderHistoryPage = lazy(() => import('@/pages/storefront/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('@/pages/storefront/OrderDetailPage'));
const ProfilePage = lazy(() => import('@/pages/storefront/ProfilePage'));

const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminProductListPage = lazy(() => import('@/pages/admin/AdminProductListPage'));
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage'));
const AdminOrderListPage = lazy(() => import('@/pages/admin/AdminOrderListPage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminInventoryPage = lazy(() => import('@/pages/admin/AdminInventoryPage'));
const AdminCustomerListPage = lazy(() => import('@/pages/admin/AdminCustomerListPage'));
const AdminCustomerDetailPage = lazy(() => import('@/pages/admin/AdminCustomerDetailPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    element: <StorefrontLayout />,
    children: [
      { path: '/', element: <Lazy><HomePage /></Lazy> },
      { path: '/products', element: <Lazy><ProductListingPage /></Lazy> },
      { path: '/products/:slug', element: <Lazy><ProductDetailPage /></Lazy> },
      { path: '/cart', element: <Lazy><CartPage /></Lazy> },
      { path: '/checkout', element: <Lazy><ProtectedRoute><CheckoutPage /></ProtectedRoute></Lazy> },
      { path: '/checkout/success', element: <Lazy><OrderSuccessPage /></Lazy> },
      { path: '/account/login', element: <Lazy><LoginPage /></Lazy> },
      { path: '/account/register', element: <Lazy><RegisterPage /></Lazy> },
      { path: '/account/forgot-password', element: <Lazy><ForgotPasswordPage /></Lazy> },
      {
        path: '/account/orders',
        element: <Lazy><ProtectedRoute><OrderHistoryPage /></ProtectedRoute></Lazy>,
      },
      {
        path: '/account/orders/:id',
        element: <Lazy><ProtectedRoute><OrderDetailPage /></ProtectedRoute></Lazy>,
      },
      {
        path: '/account/profile',
        element: <Lazy><ProtectedRoute><ProfilePage /></ProtectedRoute></Lazy>,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute role="ADMIN">
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/admin/dashboard" replace /> },
      { path: 'dashboard', element: <Lazy><DashboardPage /></Lazy> },
      { path: 'products', element: <Lazy><AdminProductListPage /></Lazy> },
      { path: 'products/new', element: <Lazy><AdminProductFormPage /></Lazy> },
      { path: 'products/:id/edit', element: <Lazy><AdminProductFormPage /></Lazy> },
      { path: 'orders', element: <Lazy><AdminOrderListPage /></Lazy> },
      { path: 'orders/:id', element: <Lazy><AdminOrderDetailPage /></Lazy> },
      { path: 'customers', element: <Lazy><AdminCustomerListPage /></Lazy> },
      { path: 'customers/:id', element: <Lazy><AdminCustomerDetailPage /></Lazy> },
      { path: 'inventory', element: <Lazy><AdminInventoryPage /></Lazy> },
      { path: 'analytics', element: <Lazy><AdminAnalyticsPage /></Lazy> },
      { path: 'settings', element: <Lazy><AdminSettingsPage /></Lazy> },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
