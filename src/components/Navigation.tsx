'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut } = useAuth();

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-3">
              <Image
                src="/IMG_4866.png"
                alt="PurePlatter Foods Logo"
                width={50}
                height={50}
                className="h-12 w-auto"
                priority
              />
              <h1 className="text-xl md:text-2xl font-bold text-rice-gold">PurePlatter Foods LTD</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => scrollToSection('home')} className="text-gray-700 hover:text-rice-gold transition duration-300">
              Home
            </button>
            <button onClick={() => scrollToSection('about')} className="text-gray-700 hover:text-rice-gold transition duration-300">
              About
            </button>
            <button onClick={() => scrollToSection('products')} className="text-gray-700 hover:text-rice-gold transition duration-300">
              Products
            </button>
            <button onClick={() => scrollToSection('benefits')} className="text-gray-700 hover:text-rice-gold transition duration-300">
              Benefits
            </button>
            <button onClick={() => scrollToSection('shop')} className="text-gray-700 hover:text-rice-gold transition duration-300">
              Shop
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-gray-700 hover:text-rice-gold transition duration-300">
              Contact
            </button>
            <button onClick={() => setIsCartOpen(true)} className="relative text-gray-700 hover:text-rice-gold transition duration-300">
              <i className="fas fa-shopping-cart text-xl"></i>
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-rice-gold text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-rice-gold transition duration-300">
                  Dashboard
                </Link>
                <button 
                  onClick={signOut}
                  className="text-gray-700 hover:text-rice-gold transition duration-300"
                >
                  Logout
                </button>
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              </div>
            ) : (
              <Link href="/login" className="bg-rice-gold text-white px-4 py-2 rounded hover:bg-yellow-600 transition duration-300">
                Login
              </Link>
            )}
          </div>
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-rice-gold"
            >
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-white border-t`}>
        <div className="px-2 pt-2 pb-3 space-y-1">
          <button onClick={() => scrollToSection('home')} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            Home
          </button>
          <button onClick={() => scrollToSection('about')} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            About
          </button>
          <button onClick={() => scrollToSection('products')} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            Products
          </button>
          <button onClick={() => scrollToSection('benefits')} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            Benefits
          </button>
          <button onClick={() => scrollToSection('shop')} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            Shop
          </button>
          <button onClick={() => scrollToSection('contact')} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            Contact
          </button>
          <button onClick={() => setIsCartOpen(true)} className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
            Cart ({totalItems})
          </button>
          {user ? (
            <>
              <Link href="/dashboard" className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left">
                Dashboard
              </Link>
              <button 
                onClick={signOut}
                className="block px-3 py-2 text-gray-700 hover:text-rice-gold w-full text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <Link href="/login" className="block px-3 py-2 bg-rice-gold text-white mx-3 rounded text-center">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
