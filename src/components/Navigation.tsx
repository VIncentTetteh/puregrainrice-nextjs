'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const navLinks = [
  { label: 'Home', id: 'home' },
  { label: 'About', id: 'about' },
  { label: 'Products', id: 'products' },
  { label: 'Benefits', id: 'benefits' },
  { label: 'Shop', id: 'shop' },
  { label: 'Contact', id: 'contact' },
];

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-[var(--gold-muted)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">

          {/* Logo */}
          <button
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-3 flex-shrink-0 group"
          >
            <div className={`rounded-xl p-1.5 transition-all duration-300 ${scrolled ? 'bg-[var(--gold-muted)]' : 'bg-white/15 backdrop-blur-sm'}`}>
              <Image
                src="/IMG_4866.png"
                alt="PurePlatter Foods Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
            <div className="text-left">
              <span
                className={`block text-base font-bold leading-tight transition-colors duration-300 ${
                  scrolled ? 'text-[var(--charcoal)]' : 'text-white'
                }`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                PurePlatter Foods
              </span>
              <span
                className={`block text-xs font-medium transition-colors duration-300 ${
                  scrolled ? 'text-[var(--gold)]' : 'text-[var(--gold-light)]'
                }`}
              >
                Eat Ghana, Love Ghana
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 hover:bg-[var(--gold-muted)] hover:text-[var(--gold-dark)] ${
                  scrolled
                    ? 'text-[var(--charcoal-muted)] hover:text-[var(--gold-dark)]'
                    : 'text-white/90 hover:text-white hover:bg-white/15'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2.5 rounded-full transition-all duration-200 ${
                scrolled
                  ? 'text-[var(--charcoal-muted)] hover:bg-[var(--cream)] hover:text-[var(--gold-dark)]'
                  : 'text-white/90 hover:bg-white/15 hover:text-white'
              }`}
              aria-label="Shopping cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--gold)] text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 w-5 h-5 flex items-center justify-center leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    scrolled
                      ? 'text-[var(--charcoal-muted)] hover:bg-[var(--cream)] hover:text-[var(--gold-dark)]'
                      : 'text-white/90 hover:bg-white/15'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Dashboard
                </Link>
                <button
                  onClick={signOut}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    scrolled
                      ? 'text-[var(--charcoal-muted)] hover:bg-[var(--cream)]'
                      : 'text-white/80 hover:bg-white/15'
                  }`}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="btn-primary !py-2 !px-5 !text-sm"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile: Cart + Hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2.5 rounded-full transition-all ${
                scrolled ? 'text-[var(--charcoal-muted)]' : 'text-white'
              }`}
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[var(--gold)] text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2.5 rounded-full transition-all ${
                scrolled ? 'text-[var(--charcoal)]' : 'text-white'
              }`}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white/98 backdrop-blur-md border-t border-[var(--gold-muted)] px-4 pb-4 pt-2">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-[var(--charcoal-muted)] hover:bg-[var(--cream)] hover:text-[var(--gold-dark)] transition-all duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--cream-dark)] space-y-2">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-medium text-[var(--charcoal-muted)] hover:bg-[var(--cream)] hover:text-[var(--gold-dark)] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Dashboard
                </Link>
                <button
                  onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                  className="w-full px-4 py-3 rounded-xl text-sm font-medium text-[var(--charcoal-muted)] hover:bg-[var(--cream)] text-left transition-all"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-primary w-full !rounded-xl !py-3 text-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
