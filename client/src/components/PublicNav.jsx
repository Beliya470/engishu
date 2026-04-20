import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
import { individualProducts, corporateProducts } from '../lib/products';

export default function PublicNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-[#1DB8A8] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-[#633806] text-lg hidden sm:block">Engishu Insurance</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium ${isActive('/') ? 'text-[#1DB8A8]' : 'text-slate-600 hover:text-[#633806]'}`}>Home</Link>

            {/* Products Dropdown */}
            <div className="relative" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
              <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-[#633806]">
                Products <ChevronDown size={14} />
              </button>
              {productsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-[600px]">
                  <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-6 grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-[#633806] uppercase tracking-wider mb-3">Individual</p>
                      <div className="space-y-1">
                        {individualProducts.map(p => (
                          <Link key={p.slug} to={`/products/${p.slug}`} className="block text-sm text-slate-600 hover:text-[#1DB8A8] py-1"
                            onClick={() => setProductsOpen(false)}>{p.name}</Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#633806] uppercase tracking-wider mb-3">Corporate</p>
                      <div className="space-y-1">
                        {corporateProducts.map(p => (
                          <Link key={p.slug} to={`/products/${p.slug}`} className="block text-sm text-slate-600 hover:text-[#1DB8A8] py-1"
                            onClick={() => setProductsOpen(false)}>{p.name}</Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link to="/about" className={`text-sm font-medium ${isActive('/about') ? 'text-[#1DB8A8]' : 'text-slate-600 hover:text-[#633806]'}`}>About Us</Link>
            <Link to="/contact" className={`text-sm font-medium ${isActive('/contact') ? 'text-[#1DB8A8]' : 'text-slate-600 hover:text-[#633806]'}`}>Contact</Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login" className="text-xs text-slate-400 hover:text-slate-600">Staff Login</Link>
            <Link to="/#quote" className="bg-[#1DB8A8] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#28bfb3] transition-colors">
              Get a Quote
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto">
          <div className="p-6 space-y-4">
            <Link to="/" className="block text-lg font-medium text-slate-800" onClick={() => setMobileOpen(false)}>Home</Link>

            <div>
              <p className="text-xs font-semibold text-[#633806] uppercase tracking-wider mb-2">Individual Products</p>
              {individualProducts.map(p => (
                <Link key={p.slug} to={`/products/${p.slug}`} className="block text-sm text-slate-600 py-1.5"
                  onClick={() => setMobileOpen(false)}>{p.name}</Link>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#633806] uppercase tracking-wider mb-2">Corporate Products</p>
              {corporateProducts.map(p => (
                <Link key={p.slug} to={`/products/${p.slug}`} className="block text-sm text-slate-600 py-1.5"
                  onClick={() => setMobileOpen(false)}>{p.name}</Link>
              ))}
            </div>

            <Link to="/about" className="block text-lg font-medium text-slate-800" onClick={() => setMobileOpen(false)}>About Us</Link>
            <Link to="/contact" className="block text-lg font-medium text-slate-800" onClick={() => setMobileOpen(false)}>Contact</Link>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <Link to="/#quote" className="block w-full text-center bg-[#1DB8A8] text-white py-3 rounded-full font-medium"
                onClick={() => setMobileOpen(false)}>Get a Quote</Link>
              <Link to="/login" className="block w-full text-center text-sm text-slate-400"
                onClick={() => setMobileOpen(false)}>Staff Login</Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
