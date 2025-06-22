'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut } = useAuth();
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    // Navigate to home page first if not already there
    if (window.location.pathname !== '/') {
      router.push('/');
      // Wait for navigation then scroll
      setTimeout(() => {
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }, 100);
    } else {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 bg-rice-gold text-white p-3 rounded-lg shadow-lg hover:bg-yellow-600 transition duration-300 lg:hidden"
      >
        <i className={`fas ${isOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-40 border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center">
              <h1 className="text-xl font-bold text-rice-gold">PureGrain Rice</h1>
            </Link>
            <div className="mt-2">
              <p className="text-sm text-gray-600">Welcome back!</p>
              <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            <button
              onClick={() => scrollToSection('home')}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-home w-5 mr-3"></i>
              Home
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-info-circle w-5 mr-3"></i>
              About
            </button>
            <button
              onClick={() => scrollToSection('products')}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-box w-5 mr-3"></i>
              Products
            </button>
            <button
              onClick={() => scrollToSection('benefits')}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-star w-5 mr-3"></i>
              Benefits
            </button>
            <button
              onClick={() => scrollToSection('shop')}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-shopping-bag w-5 mr-3"></i>
              Shop
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-envelope w-5 mr-3"></i>
              Contact
            </button>
            
            <div className="border-t border-gray-200 my-4"></div>
            
            <Link href="/dashboard" className="block">
              <div className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center">
                <i className="fas fa-chart-line w-5 mr-3"></i>
                Dashboard
              </div>
            </Link>
            
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center justify-between"
            >
              <div className="flex items-center">
                <i className="fas fa-shopping-cart w-5 mr-3"></i>
                Cart
              </div>
              {totalItems > 0 && (
                <span className="bg-rice-gold text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-300 flex items-center"
            >
              <i className="fas fa-sign-out-alt w-5 mr-3"></i>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <Link href="/" className="flex items-center">
                  <h1 className="text-xl font-bold text-rice-gold">PureGrain Rice</h1>
                </Link>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Welcome back!</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                <button
                  onClick={() => scrollToSection('home')}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-home w-5 mr-3"></i>
                  Home
                </button>
                <button
                  onClick={() => scrollToSection('about')}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-info-circle w-5 mr-3"></i>
                  About
                </button>
                <button
                  onClick={() => scrollToSection('products')}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-box w-5 mr-3"></i>
                  Products
                </button>
                <button
                  onClick={() => scrollToSection('benefits')}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-star w-5 mr-3"></i>
                  Benefits
                </button>
                <button
                  onClick={() => scrollToSection('shop')}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-shopping-bag w-5 mr-3"></i>
                  Shop
                </button>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-envelope w-5 mr-3"></i>
                  Contact
                </button>
                
                <div className="border-t border-gray-200 my-4"></div>
                
                <Link href="/dashboard" className="block" onClick={() => setIsOpen(false)}>
                  <div className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center">
                    <i className="fas fa-chart-line w-5 mr-3"></i>
                    Dashboard
                  </div>
                </Link>
                
                <button
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:bg-rice-gold hover:text-white rounded-lg transition duration-300 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <i className="fas fa-shopping-cart w-5 mr-3"></i>
                    Cart
                  </div>
                  {totalItems > 0 && (
                    <span className="bg-rice-gold text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition duration-300 flex items-center"
                >
                  <i className="fas fa-sign-out-alt w-5 mr-3"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
