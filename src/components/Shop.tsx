'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

type Product = {
  id: string;
  name: string;
  price: number;
  weight: string;
  weightDisplay: string;
  description: string;
  features: string[];
  popular?: boolean;
  savings?: string;
  theme: 'gold' | 'forest' | 'charcoal';
  emoji: string;
  perKg: string;
};

const products: Product[] = [
  {
    id: 'puregrain-5kg',
    name: 'PureGrain Rice',
    price: 120,
    weight: '5KG',
    weightDisplay: '5 KG',
    description: 'Perfect for small households and those who love freshness with every cook.',
    features: ['Premium aromatic grain', 'Vacuum-sealed freshness', 'Perfect for 2–4 people', 'Fast home delivery'],
    theme: 'gold',
    emoji: '🌾',
    perKg: '₵24/kg',
  },
  {
    id: 'puregrain-10kg',
    name: 'PureGrain Rice',
    price: 240,
    weight: '10KG',
    weightDisplay: '10 KG',
    description: 'Our most popular size — the sweet spot for families who love great rice.',
    features: ['Premium aromatic grain', 'Family-sized package', 'Best value per kg', 'Locally sourced & pure'],
    popular: true,
    theme: 'forest',
    emoji: '🌾',
    perKg: '₵24/kg',
  },
  {
    id: 'puregrain-25kg',
    name: 'PureGrain Rice',
    price: 575,
    weight: '25KG',
    weightDisplay: '25 KG',
    description: 'Ideal for large families, caterers, restaurants, and bulk buyers.',
    features: ['Premium aromatic grain', 'Bulk economy pack', 'Ideal for businesses', 'Lowest cost per kg'],
    savings: 'Best Deal',
    theme: 'charcoal',
    emoji: '🌾',
    perKg: '₵23/kg',
  },
];

const themeMap = {
  gold: {
    header: 'bg-gradient-to-br from-[var(--gold-dark)] via-[var(--gold)] to-[var(--gold-light)]',
    price: 'text-[var(--gold-dark)]',
    badge: 'bg-[var(--gold-muted)] text-[var(--gold-dark)]',
    check: 'text-[var(--gold-dark)]',
    btn: 'bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] hover:from-[var(--gold)] hover:to-[var(--gold-light)] text-white shadow-gold hover:shadow-gold-lg',
  },
  forest: {
    header: 'bg-gradient-to-br from-[var(--forest)] via-[var(--forest-light)] to-[#3a7a58]',
    price: 'text-[var(--forest)]',
    badge: 'bg-[var(--forest-muted)] text-[var(--forest)]',
    check: 'text-[var(--forest)]',
    btn: 'bg-gradient-to-r from-[var(--forest)] to-[var(--forest-light)] hover:opacity-90 text-white shadow-md hover:shadow-lg',
  },
  charcoal: {
    header: 'bg-gradient-to-br from-[var(--charcoal)] to-[var(--charcoal-light)]',
    price: 'text-[var(--charcoal)]',
    badge: 'bg-gray-100 text-[var(--charcoal)]',
    check: 'text-[var(--charcoal-muted)]',
    btn: 'bg-gradient-to-r from-[var(--charcoal)] to-[var(--charcoal-light)] hover:opacity-90 text-white shadow-md hover:shadow-lg',
  },
};

const Shop = () => {
  const { addToCart, setIsCartOpen } = useCart();
  const { user } = useAuth();

  const handleAddToCart = async (product: Product) => {
    await addToCart(product.id, product.price, product.weight, 1);
    toast.success(`${product.name} ${product.weight} added to cart!`, {
      icon: '🛒',
      style: { fontFamily: 'var(--font-body)' },
    });
    if (!user) {
      setTimeout(() => setIsCartOpen(true), 500);
    }
  };

  return (
    <section
      id="shop"
      className="bg-[var(--cream)] overflow-hidden"
      style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge badge-gold mb-4">Order Now</span>
          <h2 className="section-heading mb-4">
            Choose Your <span className="text-gradient-gold">PureGrain Pack</span>
          </h2>
          <div className="gold-divider my-6" />
          <p className="section-subheading">
            Fresh delivery to your doorstep across 20+ cities in Ghana.
            All packages use advanced freshness-seal technology.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {products.map((product) => {
            const theme = themeMap[product.theme];
            return (
              <div
                key={product.id}
                className={`relative bg-white rounded-2xl overflow-hidden shadow-premium border border-[var(--gold-muted)]/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_rgba(0,0,0,0.12)] flex flex-col ${
                  product.popular ? 'ring-2 ring-[var(--forest)]' : ''
                }`}
              >
                {/* Popular / Savings Badge */}
                {product.popular && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="badge bg-[var(--forest)] text-white text-xs shadow-md">
                      ⭐ Most Popular
                    </span>
                  </div>
                )}
                {product.savings && !product.popular && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="badge bg-[var(--ghana-red)] text-white text-xs shadow-md">
                      {product.savings}
                    </span>
                  </div>
                )}

                {/* Card Header */}
                <div className={`${theme.header} p-10 text-center relative overflow-hidden pt-14`}>
                  <div className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.4) 0%, transparent 60%)',
                    }}
                  />
                  <div className="relative">
                    <span className="text-5xl block mb-3 animate-float">{product.emoji}</span>
                    <h3
                      className="text-2xl font-bold text-white mb-1"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {product.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full mt-2">
                      <span className="text-white font-bold text-lg">{product.weightDisplay}</span>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-7 flex flex-col flex-1">
                  {/* Price */}
                  <div className="text-center mb-6 pb-6 border-b border-[var(--cream-dark)]">
                    <div className="flex items-end justify-center gap-1">
                      <span className={`text-4xl font-bold ${theme.price}`} style={{ fontFamily: 'var(--font-display)' }}>
                        ₵{product.price}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--charcoal-muted)] mt-1 font-medium">{product.perKg}</p>
                    <p className="text-xs text-[var(--charcoal-muted)] mt-1 leading-relaxed">{product.description}</p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-7 flex-1">
                    {product.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <svg className={`w-4 h-4 flex-shrink-0 ${theme.check}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-[var(--charcoal-muted)]">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${theme.btn}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Add to Cart
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Delivery Info Strip */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 border border-[var(--gold-muted)]/50 shadow-sm">
            {[
              { icon: '🚚', label: 'Fast Delivery', sub: '20+ cities in Ghana' },
              { icon: '🔒', label: 'Secure Payment', sub: 'Paystack protected' },
              { icon: '📦', label: 'Freshness Guaranteed', sub: 'Sealed packaging' },
              { icon: '↩️', label: 'Easy Returns', sub: 'Satisfaction or refund' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-center sm:text-left">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-[var(--charcoal)]">{item.label}</p>
                  <p className="text-xs text-[var(--charcoal-muted)]">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Shop;
