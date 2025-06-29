'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useEffect, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

interface CartItem {
  quantity: number;
  [key: string]: unknown;
}

const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  const { user, loading, shouldShowCart, setShouldShowCart } = useAuth();
  const { setIsCartOpen } = useCart();

  // Show cart after login if user had items
  const checkCartAndShow = useCallback(() => {
    if (shouldShowCart && user) {
      const savedCart = localStorage.getItem('pureplatter_cart');
      let cartItemCount = 0;

      if (savedCart) {
        try {
          const cart: CartItem[] = JSON.parse(savedCart);
          cartItemCount = cart.reduce((total, item) => total + (item.quantity || 0), 0);
        } catch (error) {
          console.error('Error parsing cart from localStorage:', error);
        }
      }

      if (cartItemCount > 0) {
        setTimeout(() => {
          setIsCartOpen(true);
          setShouldShowCart(false);
          toast.success(
            `Welcome back! You have ${cartItemCount} item${cartItemCount !== 1 ? 's' : ''} in your cart.`
          );
        }, 1500);
      } else {
        setShouldShowCart(false);
      }
    }
  }, [shouldShowCart, user, setIsCartOpen, setShouldShowCart]);

  useEffect(() => {
    checkCartAndShow();
  }, [checkCartAndShow]);

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
        <>
          <Sidebar />
          <div className="lg:ml-64" key="auth-layout">
            {children}
          </div>
        </>
      ) : (
        <>
          <Navigation />
          {children}
        </>
      )}
    </>
  );
};

export default LayoutWrapper;