'use client';

import { useState } from 'react';
import QuoteModal from './QuoteModal';

const features = [
  'Pure perfumed aromatic long grain',
  'Locally grown on Ghanaian farms',
  'Carefully milled & sorted by hand',
  'Sealed for maximum freshness',
  'No artificial additives or bleaching',
  'Trusted by 5,000+ families',
];

const certBadges = [
  { icon: '🌿', label: '100% Natural' },
  { icon: '🇬🇭', label: 'Made in Ghana' },
  { icon: '✅', label: 'Quality Assured' },
];

const Products = () => {
  const [showQuote, setShowQuote] = useState(false);

  return (
    <section
      id="products"
      className="bg-[var(--cream)] overflow-hidden"
      style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <span className="badge badge-gold mb-4">
            Flagship Product
          </span>
          <h2 className="section-heading mb-4">
            Meet <span className="text-gradient-gold">PureGrain Rice</span>
          </h2>
          <div className="gold-divider my-6" />
          <p className="section-subheading">
            Our signature aromatic long grain rice — fragrant, fluffy, and full of the
            natural goodness Ghana&apos;s fertile soil provides.
          </p>
        </div>

        {/* Product Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">

          {/* Visual Side */}
          <div className="relative">
            {/* Main product card */}
            <div
              className="relative rounded-3xl overflow-hidden shadow-premium aspect-square max-w-md mx-auto"
              style={{
                background: 'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 50%, var(--gold-light) 100%)',
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/08" />

              <div className="relative h-full flex flex-col items-center justify-center p-12 text-white text-center">
                <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-6 animate-float">
                  <span className="text-6xl">🌾</span>
                </div>

                <h3
                  className="text-4xl font-bold text-white mb-2"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  PureGrain
                </h3>
                <p className="text-white/80 text-lg font-medium mb-2">Perfume Rice</p>
                <p className="text-white/60 text-sm">Aromatic Long Grain Variety</p>

                {/* Mini price tags */}
                <div className="mt-8 flex flex-wrap gap-2 justify-center">
                  {[
                    { size: '5KG', price: '₵120' },
                    { size: '10KG', price: '₵240' },
                    { size: '25KG', price: '₵575' },
                  ].map((p) => (
                    <span
                      key={p.size}
                      className="bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-semibold px-3 py-1.5 rounded-full"
                    >
                      {p.size} · {p.price}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating cert badges */}
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 space-y-3 hidden lg:block">
              {certBadges.map((b, i) => (
                <div
                  key={i}
                  className="bg-white shadow-premium rounded-xl px-4 py-3 flex items-center gap-2.5 animate-fade-in"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-sm font-semibold text-[var(--charcoal)] whitespace-nowrap">{b.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Side */}
          <div>
            <div className="mb-8">
              <h3
                className="text-3xl font-bold text-[var(--charcoal)] mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Why Chefs &amp; Families Choose Us
              </h3>
              <p className="text-[var(--charcoal-muted)] leading-relaxed">
                PureGrain Rice isn&apos;t just a staple — it&apos;s a premium dining experience.
                The rich aroma fills your kitchen the moment you open the bag.
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[var(--charcoal-muted)] text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>

            {/* Coming Soon Products */}
            <div className="p-5 rounded-2xl bg-[var(--forest-muted)] border border-[var(--forest)]/10 mb-8">
              <p className="text-xs font-semibold text-[var(--forest)] uppercase tracking-wider mb-3">
                🚀 Expanding Range — Coming Soon
              </p>
              <div className="flex flex-wrap gap-2">
                {['Fresh Fish', 'Chicken & Meats', 'Tomato Paste', 'Cooking Oil', 'Tin Fish', 'Shrimp & Lobster'].map((item) => (
                  <span
                    key={item}
                    className="text-xs bg-white text-[var(--forest)] font-medium px-3 py-1.5 rounded-full border border-[var(--forest)]/15"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowQuote(true)}
                className="btn-primary flex-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Bulk Quote
              </button>
              <button
                onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-secondary flex-1"
              >
                Shop Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <QuoteModal open={showQuote} onClose={() => setShowQuote(false)} />
    </section>
  );
};

export default Products;
