'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const { user } = useAuth();
  const supabase = createClient();

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('pureplatter_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pureplatter_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync cart with Supabase when user logs in
  const syncCartToSupabase = useCallback(async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    try {
      const { data: existingItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      let finalCart = [...cart];
      if (cart.length === 0 && existingItems && existingItems.length > 0) {
        finalCart = existingItems.map(dbItem => ({
          product_id: dbItem.product_id,
          price: dbItem.price,
          quantity: dbItem.quantity,
          weight_kg: dbItem.product_weight_kg,
        }));
      } else if (cart.length > 0) {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);

        const cartItemsToInsert = cart.map(item => ({
          user_id: user.id,
          product_id: item.product_id,
          price: item.price,
          quantity: item.quantity,
          weight_kg: item.weight_kg
        }));

        await supabase
          .from('cart_items')
          .insert(cartItemsToInsert);

        finalCart = cart;
      }

      setCart(finalCart);
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error syncing cart to Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, supabase, cart]);

  const loadCartFromSupabase = useCallback(async () => {
    if (!user || isSyncing) return;
    setIsSyncing(true);
    try {
      const { data: cartItems } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id);

      if (cartItems && cartItems.length > 0) {
        const loadedCart = cartItems.map(item => ({
          product_id: item.product_id,
          price: item.price,
          quantity: item.quantity,
          weight_kg: item.product_weight_kg,
        }));
        setCart(loadedCart);
      }
      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error loading cart from Supabase:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isSyncing, supabase]);

  useEffect(() => {
    if (user && !isSyncing) {
      const now = Date.now();
      if (now - lastSyncTime > 1000) {
        if (cart.length > 0) {
          syncCartToSupabase();
        } else {
          loadCartFromSupabase();
        }
        setLastSyncTime(now);
      }
    }
  }, [user, isSyncing, lastSyncTime, cart.length, syncCartToSupabase, loadCartFromSupabase]);

  const syncCart = async () => {
    if (user) {
      await syncCartToSupabase();
    }
  };

  const addToCart = useCallback(async (productId: string, price: number, weight_kg: string, quantity: number) => {
    setCart(prevCart => {
      const newCart = [...prevCart];
      const existingItem = newCart.find(item => item.product_id === productId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        const newItem: CartItem = {
          product_id: productId,
          price: price,
          quantity: quantity,
          weight_kg: weight_kg,
        };
        newCart.push(newItem);
      }

      return newCart;
    });

    // If user is logged in, also update Supabase with the correct quantity
    if (user) {
      try {
        // Check if item exists first
        const { data: existingItem } = await supabase
          .from('cart_items')
          .select('quantity')
          .eq('user_id', user.id)
          .eq('product_id', productId)
          .single();

        if (existingItem) {
          // Update existing item by incrementing quantity
          await supabase
            .from('cart_items')
            .update({ quantity: existingItem.quantity + 1 })
            .eq('user_id', user.id)
            .eq('product_id', productId);
            
        } else {
          // Insert new item
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: productId,
              price: price,
              quantity: quantity,
              weight_kg: weight_kg
            });
        }
      } catch (error) {
        console.error('Error updating cart in Supabase:', error);
      }
    }
  }, [user, supabase]);

  const removeFromCart = useCallback(async (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product_id !== productId));

    // If user is logged in, also remove from Supabase
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (error) {
        console.error('Error removing cart item from Supabase:', error);
      }
    }
  }, [user, supabase]);

  const updateQuantity = useCallback(async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.product_id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );

    // If user is logged in, also update Supabase
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('product_id', productId);
      } catch (error) {
        console.error('Error updating cart quantity in Supabase:', error);
      }
    }
  }, [removeFromCart, user, supabase]);

  const clearCart = useCallback(async () => {
    setCart([]);
    localStorage.removeItem('pureplatter_cart');

    // If user is logged in, also clear from Supabase
    if (user) {
      try {
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error clearing cart from Supabase:', error);
      }
    }
  }, [user, supabase]);

  const clearCartOnOrderSuccess = useCallback(() => {
    // Force immediate clearing without database call since it's already handled in createOrder
    setCart([]);
    localStorage.removeItem('pureplatter_cart');
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const value = {
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
    syncCart
  };

  return (
    <CartContext.Provider value={value}>
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
