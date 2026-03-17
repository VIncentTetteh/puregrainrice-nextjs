'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1592997572594-34be01bc36c7?q=80&w=3540&auto=format&fit=crop',
    headline: 'PureGrain Rice',
    sub: 'Aromatic Long Grain',
  },
  {
    image: 'https://images.unsplash.com/photo-1549888728-c4df900ccba7?q=80&w=2370&auto=format&fit=crop',
    headline: 'Farm to Table',
    sub: 'Straight from Ghana\'s Fertile Lands',
  },
  {
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?q=80&w=2370&auto=format&fit=crop',
    headline: 'Premium Quality',
    sub: 'Carefully Processed & Packaged',
  },
  {
    image: 'https://images.unsplash.com/photo-1686820740687-426a7b9b2043?q=80&w=2370&auto=format&fit=crop',
    headline: 'Proudly Ghanaian',
    sub: 'Supporting Local Farmers & Communities',
  },
];

const stats = [
  { value: '20+', label: 'Cities Delivered' },
  { value: '5,000+', label: 'Happy Families' },
  { value: '100%', label: 'Natural & Pure' },
  { value: '3', label: 'Package Sizes' },
];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setAnimating(false);
      }, 600);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const slide = slides[current];

  return (
    <section id="home" className="relative w-full min-h-screen flex flex-col overflow-hidden">

      {/* Background Images */}
      <div className="absolute inset-0 z-0">
        {slides.map((s, i) => (
          <Image
            key={i}
            src={s.image}
            alt={s.headline}
            fill
            sizes="100vw"
            priority={i === 0}
            className={`absolute inset-0 object-cover transition-opacity duration-1000 ${
              i === current ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ))}

        {/* Multi-layer dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        {/* Warm tint at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-[#0D0B07]/80 to-transparent" />
      </div>

      {/* Decorative grain texture */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '200px 200px',
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pt-24 pb-32">
        <div className="max-w-5xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse-gold" />
            <span className="text-white/90 text-sm font-medium tracking-wide">
              Proudly Made in Ghana
            </span>
          </div>

          {/* Main Headline */}
          <div
            className={`transition-all duration-600 ${
              animating ? 'opacity-0 translate-y-3' : 'opacity-100 translate-y-0'
            }`}
          >
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {slide.headline}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-white/75 mb-3 font-light tracking-wide">
              {slide.sub}
            </p>
          </div>

          {/* Slogan */}
          <p
            className="text-[var(--gold-light)] text-xl sm:text-2xl font-semibold mb-10 tracking-wider uppercase"
            style={{ letterSpacing: '0.15em' }}
          >
            Eat Ghana · Love Ghana
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('shop')}
              className="btn-primary !text-base !py-4 !px-8 w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Shop Now
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 hover:bg-white/20 hover:border-white/50 w-full sm:w-auto"
            >
              Our Story
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Slide Indicators */}
          <div className="flex items-center justify-center gap-2 mt-12">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-8 h-2 bg-[var(--gold)]'
                    : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="relative z-10 border-t border-white/10">
        <div className="glass-dark">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
              {stats.map((stat, i) => (
                <div key={i} className="px-4 sm:px-8 py-2 text-center">
                  <span
                    className="block text-2xl sm:text-3xl font-bold text-[var(--gold-light)]"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {stat.value}
                  </span>
                  <span className="block text-xs text-white/50 mt-1 tracking-wider uppercase font-medium">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 hidden md:flex flex-col items-center gap-1">
        <div
          className="w-6 h-9 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5 cursor-pointer"
          onClick={() => scrollToSection('about')}
        >
          <div className="w-1 h-2.5 rounded-full bg-white/70" style={{ animation: 'scrollDown 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
