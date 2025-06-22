'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const { user, loading, shouldShowCart, setShouldShowCart } = useAuth();
  const { setIsCartOpen, totalItems } = useCart();

  // Show cart after login if user had items
  useEffect(() => {
    if (shouldShowCart && user) {
      // Check if there are items in localStorage cart
      const savedCart = localStorage.getItem('pureplatter_cart');
      let cartItemCount = 0;
      
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          cartItemCount = cart.reduce((total: number, item: any) => total + item.quantity, 0);
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
        }
      }
      
      if (cartItemCount > 0) {
        // Give time for cart synchronization to complete
        setTimeout(() => {
          setIsCartOpen(true);
          setShouldShowCart(false);
          toast.success(`Welcome back! You have ${cartItemCount} item${cartItemCount > 1 ? 's' : ''} in your cart.`);
        }, 1500); // Increased delay to ensure cart sync completes
      } else {
        setShouldShowCart(false);
      }
    }
  }, [shouldShowCart, user, setIsCartOpen, setShouldShowCart]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rice-gold mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        // Authenticated layout with sidebar
        <>
          <Sidebar />
          <div className="lg:ml-64">
            {children}
          </div>
        </>
      ) : (
        // Unauthenticated layout with top navigation
        <>
          <Navigation />
          {children}
        </>
      )}
    </>
  );
};

export default LayoutWrapper;
