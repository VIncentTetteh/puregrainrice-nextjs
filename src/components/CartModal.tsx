'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import CheckoutForm from '@/components/CheckoutForm';

const CartModal = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { user } = useAuth();
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const checkout = () => {
    if (cart.length === 0) return;
    if (!user) return;
    setShowCheckoutForm(true);
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                Your Cart
              </h2>
              <p className="text-xs text-[var(--charcoal-muted)]">
                {cart.length === 0 ? 'Empty' : `${cart.reduce((s, i) => s + i.quantity, 0)} item${cart.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="w-9 h-9 rounded-xl border border-[var(--cream-dark)] flex items-center justify-center text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-20 h-20 rounded-full bg-[var(--cream)] flex items-center justify-center text-4xl mb-4">
                🛒
              </div>
              <h3 className="font-bold text-[var(--charcoal)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                Your cart is empty
              </h3>
              <p className="text-sm text-[var(--charcoal-muted)] mb-6">
                Add some PureGrain Rice to get started.
              </p>
              <button
                onClick={() => setIsCartOpen(false)}
                className="btn-primary !text-sm !py-2.5 !px-6"
              >
                Browse Products
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--cream)] border border-[var(--cream-dark)]"
                >
                  {/* Product icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white text-xl flex-shrink-0">
                    🌾
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--charcoal)] truncate">
                      PureGrain Rice
                    </p>
                    <p className="text-xs text-[var(--charcoal-muted)]">{item.weight_kg}</p>
                    <p className="text-sm font-bold text-[var(--gold-dark)] mt-0.5">
                      ₵{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-[var(--cream-dark)] flex items-center justify-center text-[var(--charcoal-muted)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                      </svg>
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-[var(--charcoal)]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-[var(--cream-dark)] flex items-center justify-center text-[var(--charcoal-muted)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors"
                      aria-label="Increase quantity"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--charcoal-muted)] hover:text-red-500 hover:bg-red-50 transition-colors ml-1"
                      aria-label="Remove item"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-[var(--cream-dark)] px-6 py-5 bg-[var(--off-white)] space-y-4">
            {/* Order summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[var(--charcoal-muted)]">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>₵{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-[var(--charcoal-muted)]">
                <span>Delivery</span>
                <span className="text-[var(--forest)] font-medium">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--charcoal)] pt-2 border-t border-[var(--cream-dark)]">
                <span style={{ fontFamily: 'var(--font-display)' }}>Total</span>
                <span style={{ fontFamily: 'var(--font-display)' }}>₵{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Auth check + CTA */}
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-[var(--cream)] rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-[var(--gold)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <p className="text-xs text-[var(--charcoal-muted)] truncate">
                    Ordering as <span className="font-semibold text-[var(--charcoal)]">{user.email}</span>
                  </p>
                </div>
                <button
                  onClick={checkout}
                  className="btn-primary w-full !rounded-xl !py-3.5"
                >
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    Proceed to Checkout
                  </>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">
                    Sign in to complete your purchase. Your cart is saved!
                  </p>
                </div>
                <Link href="/login" onClick={() => setIsCartOpen(false)}>
                  <button className="btn-primary w-full !rounded-xl !py-3.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In to Checkout
                  </button>
                </Link>
              </div>
            )}

            <button
              onClick={clearCart}
              className="w-full text-xs text-[var(--charcoal-muted)] hover:text-red-500 transition-colors py-1"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>

      {/* Checkout Form Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCheckoutForm(false)}
          />
          <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <CheckoutForm
              onBack={() => setShowCheckoutForm(false)}
              onOrderSuccess={() => setShowCheckoutForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CartModal;
