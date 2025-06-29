'use client'

import { useState, useEffect } from 'react'

interface Review {
  id: string
  rating: number
  review_text: string
  user_name: string
  created_at: string
  products: {
    name: string
    image_url: string
  }
}

export default function ReviewsCarousel() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedReviews()
  }, [])

  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex === reviews.length - 1 ? 0 : prevIndex + 1
        )
      }, 5000) // Auto-slide every 5 seconds

      return () => clearInterval(interval)
    }
  }, [reviews.length])

  const fetchFeaturedReviews = async () => {
    try {
      const response = await fetch('/api/reviews?featured=true')
      const data = await response.json()
      
      if (response.ok) {
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-5 h-5 ${
          index < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading reviews...</p>
          </div>
        </div>
      </div>
    )
  }

  if (reviews.length === 0) {
    return (
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Customer Reviews</h2>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.009 8.009 0 01-7-4.084L0 21l5.916-5.916A7.963 7.963 0 010 12C0 7.582 3.582 4 8 4s8 3.582 8 8z" />
            </svg>
            <p className="text-gray-500 text-lg">Be the first to leave a review!</p>
            <p className="text-gray-400 text-sm mt-2">Order our premium rice and share your experience</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Don&#39;t just take our word for it. Here&#39;s what our satisfied customers have to say about our premium rice.
          </p>
        </div>

        <div className="relative">
          {/* Main Review Display */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto">
            <div className="text-center">
              {/* Stars */}
              <div className="flex justify-center mb-6">
                {renderStars(reviews[currentIndex].rating)}
              </div>

              {/* Review Text */}
              {reviews[currentIndex].review_text && (
                <blockquote className="text-xl md:text-2xl text-gray-700 font-medium mb-8 leading-relaxed">
                  &quot;{reviews[currentIndex].review_text}&quot;
                </blockquote>
              )}

              {/* Customer Info */}
              <div className="flex items-center justify-center space-x-4">
                <div className="text-center">
                  <p className="font-semibold text-gray-900 text-lg">
                    {reviews[currentIndex].user_name}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Verified Purchase • {formatDate(reviews[currentIndex].created_at)}
                  </p>
                </div>
              </div>

              {/* Product Info */}
              <div className="mt-6 flex items-center justify-center space-x-3 text-sm text-gray-500">
                <span>Review for:</span>
                <span className="font-medium text-gray-700">
                  {reviews[currentIndex].products.name}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
          {reviews.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex(currentIndex === 0 ? reviews.length - 1 : currentIndex - 1)}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentIndex(currentIndex === reviews.length - 1 ? 0 : currentIndex + 1)}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Dots Indicator */}
          {reviews.length > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {reviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentIndex
                      ? 'bg-blue-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Review Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">{reviews.length}</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-yellow-500 mb-2">
              {reviews.length > 0 
                ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                : '0.0'
              }
            </div>
            <div className="text-gray-600">Average Rating</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {Math.round((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100)}%
            </div>
            <div className="text-gray-600">5-Star Reviews</div>
          </div>
        </div>
      </div>
    </div>
  )
}
