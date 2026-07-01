import { Outlet, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopbar } from './AdminTopbar';

const pageTitles: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/orders': 'Orders',
  '/admin/customers': 'Customers',
  '/admin/inventory': 'Inventory',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
};

export function AdminLayout() {
  const location = useLocation();
  const title =
    Object.entries(pageTitles).find(([path]) => location.pathname.startsWith(path))?.[1] ??
    'Admin';

  return (
    <div className="bg-admin-bg min-h-screen">
      <AdminSidebar />
      <div className="ml-60">
        <AdminTopbar title={title} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
