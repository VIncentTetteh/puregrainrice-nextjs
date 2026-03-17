'use client';

import { useState, useEffect } from 'react';

interface Review {
  id: string;
  rating: number;
  review_text: string;
  user_name: string;
  created_at: string;
  product_id: string;
}

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-4 h-4 ${filled ? 'text-[var(--gold)]' : 'text-[var(--cream-dark)]'}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, i) => <StarIcon key={i} filled={i < rating} />);

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedReviews();
  }, []);

  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [reviews.length]);

  const fetchFeaturedReviews = async () => {
    try {
      const response = await fetch('/api/reviews?featured=true');
      const data = await response.json();
      if (response.ok) setReviews(data.reviews || []);
    } catch {
      // silently fail — reviews section is non-critical
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const pct5star = reviews.length > 0
    ? Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)
    : 0;

  if (loading) {
    return (
      <section className="bg-[var(--off-white)]" style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="w-10 h-10 border-3 border-[var(--gold)] border-t-transparent rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite', borderWidth: '3px' }} />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading reviews…</p>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="bg-[var(--off-white)]" style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="badge badge-gold mb-4">Reviews</span>
          <h2 className="section-heading mb-4">What Our Customers Say</h2>
          <div className="gold-divider my-6" />
          <div className="card p-12 max-w-md mx-auto mt-8">
            <span className="text-5xl block mb-4">💬</span>
            <p className="text-[var(--charcoal)] font-semibold mb-2">Be the First to Review</p>
            <p className="text-sm text-[var(--charcoal-muted)]">
              Order PureGrain Rice and share your experience with our community.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="bg-[var(--off-white)] overflow-hidden"
      style={{ paddingTop: 'var(--section-py)', paddingBottom: 'var(--section-py)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="badge badge-gold mb-4">Customer Reviews</span>
          <h2 className="section-heading mb-4">
            Trusted by Ghanaian <span className="text-gradient-gold">Families</span>
          </h2>
          <div className="gold-divider my-6" />
          <p className="section-subheading">
            Don&apos;t just take our word for it — hear from the families who bring PureGrain
            Rice to their tables every day.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">

          {/* Stats Sidebar */}
          <div className="space-y-4">
            {/* Rating summary */}
            <div className="card p-6 text-center">
              <span
                className="block text-6xl font-bold text-[var(--gold-dark)] mb-1"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {avgRating}
              </span>
              <div className="flex justify-center gap-1 mb-2">
                {renderStars(Math.round(parseFloat(avgRating)))}
              </div>
              <p className="text-sm text-[var(--charcoal-muted)]">out of 5 stars</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card p-5 text-center">
                <span
                  className="block text-3xl font-bold text-[var(--gold-dark)] mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {reviews.length}
                </span>
                <span className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">Reviews</span>
              </div>
              <div className="card p-5 text-center">
                <span
                  className="block text-3xl font-bold text-[var(--forest)] mb-1"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {pct5star}%
                </span>
                <span className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">Positive</span>
              </div>
            </div>

            {/* Verified badge */}
            <div className="card p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--forest-muted)] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[var(--forest)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--charcoal)]">Verified Reviews</p>
                <p className="text-xs text-[var(--charcoal-muted)]">From real customers only</p>
              </div>
            </div>
          </div>

          {/* Review Card */}
          <div className="lg:col-span-2">
            <div className="card p-8 md:p-10 relative">
              {/* Quote mark */}
              <div
                className="absolute top-6 right-8 text-8xl leading-none font-bold text-[var(--gold-muted)] select-none pointer-events-none"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                &ldquo;
              </div>

              <div className="relative">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {renderStars(reviews[currentIndex].rating)}
                </div>

                {/* Review text */}
                {reviews[currentIndex].review_text && (
                  <blockquote
                    className="text-lg md:text-xl text-[var(--charcoal)] leading-relaxed mb-8"
                    style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
                  >
                    {reviews[currentIndex].review_text}
                  </blockquote>
                )}

                {/* Reviewer info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white font-bold text-lg">
                      {reviews[currentIndex].user_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--charcoal)]">
                        {reviews[currentIndex].user_name}
                      </p>
                      <p className="text-xs text-[var(--charcoal-muted)]">
                        Verified Purchase · {formatDate(reviews[currentIndex].created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="badge badge-forest text-xs">
                    {reviews[currentIndex].product_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            {reviews.length > 1 && (
              <div className="flex items-center justify-between mt-5 px-1">
                {/* Prev / Next */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentIndex(currentIndex === 0 ? reviews.length - 1 : currentIndex - 1)}
                    className="w-9 h-9 rounded-full border border-[var(--gold-muted)] flex items-center justify-center text-[var(--charcoal-muted)] hover:bg-[var(--gold-muted)] hover:text-[var(--gold-dark)] transition-all duration-200"
                    aria-label="Previous review"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentIndex(currentIndex === reviews.length - 1 ? 0 : currentIndex + 1)}
                    className="w-9 h-9 rounded-full border border-[var(--gold-muted)] flex items-center justify-center text-[var(--charcoal-muted)] hover:bg-[var(--gold-muted)] hover:text-[var(--gold-dark)] transition-all duration-200"
                    aria-label="Next review"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Dots */}
                <div className="flex gap-1.5">
                  {reviews.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        i === currentIndex
                          ? 'w-6 bg-[var(--gold)]'
                          : 'w-2 bg-[var(--cream-dark)] hover:bg-[var(--gold-muted)]'
                      }`}
                      aria-label={`Review ${i + 1}`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <p className="text-xs text-[var(--charcoal-muted)]">
                  {currentIndex + 1} / {reviews.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
