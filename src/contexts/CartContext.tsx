'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export interface CartItem {
  product_id: string;
  price: number;
  quantity: number;
  weight_kg: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (productId: string, price: number, weight_kg: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQuantity: number) => void;
  clearCart: () => void;
  clearCartOnOrderSuccess: () => void;
  totalItems: number;
  totalAmount: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  syncCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();
  // Track whether we've already done the one-time login sync
  const syncedUserRef = useRef<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pureplatter_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem('pureplatter_cart');
      }
    }
  }, []);

  // Persist cart to localStorage on every change
  useEffect(() => {
    localStorage.setItem('pureplatter_cart', JSON.stringify(cart));
  }, [cart]);

  // One-time sync when user logs in — do NOT re-run on cart changes
  useEffect(() => {
    if (!user) {
      syncedUserRef.current = null;
      return;
    }
    // Already synced for this user session
    if (syncedUserRef.current === user.id) return;
    syncedUserRef.current = user.id;

    const syncOnLogin = async () => {
      try {
        const { data: dbItems } = await supabase
          .from('cart_items')
          .select('*')
          .eq('user_id', user.id);

        // Read the latest local cart directly from localStorage to avoid stale closure
        const raw = localStorage.getItem('pureplatter_cart');
        const localCart: CartItem[] = raw ? JSON.parse(raw) : [];

        if (localCart.length > 0) {
          // Push local cart to DB (replace whatever was there)
          await supabase.from('cart_items').delete().eq('user_id', user.id);
          await supabase.from('cart_items').insert(
            localCart.map(item => ({
              user_id: user.id,
              product_id: item.product_id,
              price: item.price,
              quantity: item.quantity,
              weight_kg: item.weight_kg,
            }))
          );
        } else if (dbItems && dbItems.length > 0) {
          // No local cart — load from DB
          const loaded = dbItems.map(item => ({
            product_id: item.product_id,
            price: item.price,
            quantity: item.quantity,
            weight_kg: item.weight_kg,
          }));
          setCart(loaded);
        }
      } catch (err) {
        console.error('Error syncing cart on login:', err);
      }
    };

    syncOnLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only fires when user ID changes (login / logout)

  const syncCart = useCallback(async () => {
    if (!user) return;
    try {
      const { data: dbItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);
      if (dbItems && dbItems.length > 0) {
        setCart(dbItems.map(item => ({
          product_id: item.product_id,
          price: item.price,
          quantity: item.quantity,
          weight_kg: item.weight_kg,
        })));
      }
    } catch (err) {
      console.error('Error in syncCart:', err);
    }
  }, [user, supabase]);

  const addToCart = useCallback(async (productId: string, price: number, weight_kg: string, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === productId);
      if (existing) {
        return prev.map(i =>
          i.product_id === productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product_id: productId, price, quantity, weight_kg }];
    });

    if (user) {
      try {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + quantity })
            .eq('user_id', user.id)
            .eq('product_id', productId);
        } else {
          await supabase
            .from('cart_items')
            .insert({ user_id: user.id, product_id: productId, price, quantity, weight_kg });
        }
      } catch (err) {
        console.error('Error updating cart in Supabase:', err);
      }
    }
  }, [user, supabase]);

  const removeFromCart = useCallback(async (productId: string) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (err) {
        console.error('Error removing cart item from Supabase:', err);
      }
    }
  }, [user, supabase]);

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev =>
      prev.map(i => i.product_id === productId ? { ...i, quantity: newQuantity } : i)
    );

    if (user) {
      try {
        await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (err) {
        console.error('Error updating cart quantity in Supabase:', err);
      }
    }
  }, [removeFromCart, user, supabase]);

  const clearCart = useCallback(async () => {
    setCart([]);
    localStorage.removeItem('pureplatter_cart');

    if (user) {
      try {
        await supabase.from('cart_items').delete().eq('user_id', user.id);
      } catch (err) {
        console.error('Error clearing cart from Supabase:', err);
      }
    }
  }, [user, supabase]);

  const clearCartOnOrderSuccess = useCallback(() => {
    setCart([]);
    localStorage.removeItem('pureplatter_cart');
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      clearCartOnOrderSuccess,
      totalItems,
      totalAmount,
      isCartOpen,
      setIsCartOpen,
      syncCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
