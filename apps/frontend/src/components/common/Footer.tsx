import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[#262626] bg-[#0A0A0A] mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="font-syne font-extrabold text-lg tracking-[0.15em] text-white">DIVYE</div>
          <div className="text-xs font-inter text-[#525252] tracking-[0.3em]">ELECTRONICS</div>
          <p className="mt-4 text-sm text-text-secondary">
            Premium electronics, genuine products, delivered across Bihar.
          </p>
        </div>
        <div>
          <h4 className="font-mono text-xs text-[#525252] uppercase tracking-wider mb-4">Shop</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><Link to="/products" className="hover:text-white transition-colors">All Products</Link></li>
            <li><Link to="/products?isFeatured=true" className="hover:text-white transition-colors">Deals</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-xs text-[#525252] uppercase tracking-wider mb-4">Account</h4>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li><Link to="/account/login" className="hover:text-white transition-colors">Login</Link></li>
            <li><Link to="/account/orders" className="hover:text-white transition-colors">Orders</Link></li>
            <li><Link to="/account/profile" className="hover:text-white transition-colors">Profile</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-mono text-xs text-[#525252] uppercase tracking-wider mb-4">Contact</h4>
          <p className="text-sm text-text-secondary">support@divyeelectronics.in</p>
          <p className="text-sm text-text-secondary mt-1">+91 98765 43210</p>
        </div>
      </div>
      <div className="border-t border-[#262626] py-4 text-center text-xs font-mono text-[#525252]">
        © {new Date().getFullYear()} Divye Electronics Solutions. All rights reserved.
      </div>
    </footer>
  );
}
