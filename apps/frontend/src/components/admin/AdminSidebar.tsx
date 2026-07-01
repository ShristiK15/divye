import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { logout } from '@/store/authSlice';
import { cn } from '@/lib/utils';

const navGroups = [
  {
    label: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { to: '/admin/products', label: 'Products', icon: Package },
      { to: '/admin/inventory', label: 'Inventory', icon: Warehouse },
    ],
  },
  {
    label: 'Sales',
    items: [
      { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
      { to: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [{ to: '/admin/analytics', label: 'Analytics', icon: BarChart3 }],
  },
  {
    label: 'Config',
    items: [{ to: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <aside className="bg-admin-surface border-r border-admin-border fixed top-0 left-0 h-screen w-60 flex flex-col z-40">
      <div className="p-4 border-b border-admin-border">
        <div className="font-syne font-bold text-base text-admin-text">DIVYE</div>
        <div className="text-xs font-mono text-admin-text-muted">Admin</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-mono text-admin-text-muted tracking-[0.15em] uppercase px-3 mb-2">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
                        active
                          ? 'bg-admin-surface-2 text-admin-text border-l-2 border-admin-accent'
                          : 'text-admin-text-muted hover:text-admin-text hover:bg-admin-surface-2 border-l-2 border-transparent'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-admin-border">
        <p className="text-sm text-admin-text truncate">{user?.name}</p>
        <button
          type="button"
          onClick={() => dispatch(logout())}
          className="flex items-center gap-2 text-xs text-admin-text-muted hover:text-admin-error mt-2"
        >
          <LogOut className="h-3 w-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}
