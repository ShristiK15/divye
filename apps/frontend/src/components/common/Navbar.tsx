import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, X } from 'lucide-react';
import api, { type PaginatedResult } from '@/lib/axios';
import { useAppDispatch, useAppSelector } from '@/hooks/useStore';
import { toggleCart } from '@/store/cartSlice';
import { toggleMobileMenu, setMobileMenuOpen, toggleSearch, setSearchOpen } from '@/store/uiSlice';
import { useDebounce } from '@/hooks/useDebounce';
import type { ProductListItem } from '@/types';
import { formatINR, parseDecimal } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const navLinks = [
  { to: '/products', label: 'Products' },
  { to: '/products?isFeatured=true', label: 'Deals' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const { mobileMenuOpen, searchOpen } = useAppSelector((s) => s.ui);
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<ProductListItem[]>([]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      return;
    }
    api
      .get<PaginatedResult<ProductListItem>>('/products', {
        params: { search: debouncedQuery, limit: 6 },
      })
      .then((res) => setSearchResults((res.data as PaginatedResult<ProductListItem>).data))
      .catch(() => setSearchResults([]));
  }, [debouncedQuery]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex flex-col leading-none">
            <span className="font-syne font-extrabold text-xl tracking-[0.15em] text-white">DIVYE</span>
            <span className="text-xs font-inter text-[#525252] tracking-[0.3em]">ELECTRONICS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-inter text-[#A3A3A3] hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Search"
              onClick={() => dispatch(toggleSearch())}
              className="text-[#A3A3A3] hover:text-white transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Wishlist" className="hidden sm:block text-[#A3A3A3] hover:text-white transition-colors">
              <Heart className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Cart"
              onClick={() => dispatch(toggleCart())}
              className="relative text-[#A3A3A3] hover:text-white transition-colors"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-white text-black text-[10px] font-mono rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              to={isAuthenticated ? '/account/profile' : '/account/login'}
              aria-label="Account"
              className="text-[#A3A3A3] hover:text-white transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              type="button"
              aria-label="Menu"
              className="md:hidden text-[#A3A3A3] hover:text-white"
              onClick={() => dispatch(toggleMobileMenu())}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="fixed inset-0 z-[60] bg-black/80" onClick={() => dispatch(setSearchOpen(false))}>
          <div className="max-w-2xl mx-auto mt-24 px-4" onClick={(e) => e.stopPropagation()}>
            <Input
              autoFocus
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 text-base"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 border border-[#262626] bg-[#111111] max-h-80 overflow-y-auto">
                {searchResults.map((product) => {
                  const variant = product.variant;
                  const image = product.primaryImage;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="w-full flex items-center gap-4 p-4 hover:bg-[#1A1A1A] text-left"
                      onClick={() => {
                        dispatch(setSearchOpen(false));
                        navigate(`/products/${product.slug ?? product.id}`);
                      }}
                    >
                      {image && (
                        <img src={image} alt={product.name} className="w-12 h-12 object-contain bg-[#0A0A0A]" loading="lazy" width={48} height={48} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{product.name}</p>
                        {variant && (
                          <p className="text-xs font-mono text-[#A3A3A3]">{formatINR(parseDecimal(variant.price))}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-[#111111] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute top-4 right-4 text-white"
            onClick={() => dispatch(setMobileMenuOpen(false))}
          >
            <X className="h-6 w-6" />
          </button>
          <nav className="flex flex-col gap-6 p-8 pt-20">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-syne text-2xl text-white"
                onClick={() => dispatch(setMobileMenuOpen(false))}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
