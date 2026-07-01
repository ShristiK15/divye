import { Link, useLocation } from 'react-router-dom';

const links = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/orders', label: 'Orders' },
];

export function AccountSidebar() {
  const location = useLocation();

  return (
    <nav className="space-y-1">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className={`block px-3 py-2 text-sm ${
            location.pathname.startsWith(link.to)
              ? 'text-white border-l-2 border-white bg-[#111111]'
              : 'text-[#A3A3A3] hover:text-white border-l-2 border-transparent'
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
