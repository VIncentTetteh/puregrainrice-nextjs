'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  orderId: string
  productId: string
  productName: string
  onClose: () => void
  onReviewSubmitted: () => void
}

export default function ReviewForm({ 
  orderId, 
  productId, 
  productName, 
  onClose, 
  onReviewSubmitted 
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          productId,
          rating,
          reviewText: reviewText.trim() || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Thank you for your review!')
        onReviewSubmitted()
        onClose()
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      toast.error('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isFilled = starValue <= (hoveredRating || rating)
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className={`text-3xl transition-colors duration-200 ${
            isFilled ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'
          }`}
        >
          ★
        </button>
      )
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40" onClick={onClose}></div>
      {/* Modal content */}
      <div className="relative z-50 inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className="w-full">
              <div className="text-center sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Leave a Review
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  How was your experience with <span className="font-medium">{productName}</span>?
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating *
                  </label>
                  <div className="flex space-x-1 mb-2">
                    {renderStars()}
                  </div>
                  <p className="text-xs text-gray-500">
                    {rating === 0 && 'Click to rate'}
                    {rating === 1 && 'Poor'}
                    {rating === 2 && 'Fair'}
                    {rating === 3 && 'Good'}
                    {rating === 4 && 'Very Good'}
                    {rating === 5 && 'Excellent'}
                  </p>
                </div>

                {/* Review Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review (Optional)
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Tell other customers about your experience with this product..."
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {reviewText.length}/500 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
