'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useOrders } from '@/app/hooks/useOrders'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import LayoutWrapper from '@/components/LayoutWrapper'
import ReviewForm from '@/components/ReviewForm'
// import Image from 'next/image'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { orders, loading: ordersLoading, refetch } = useOrders()
  const router = useRouter()
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [selectedReview, setSelectedReview] = useState<{
    orderId: string
    productId: string
    productName: string
  } | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  if (authLoading || ordersLoading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rice-gold mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        </div>
      </LayoutWrapper>
    )
  }

  if (!user) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return `GH₵${amount.toFixed(2)}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'fas fa-clock'
      case 'confirmed':
        return 'fas fa-check-circle'
      case 'shipped':
        return 'fas fa-shipping-fast'
      case 'delivered':
        return 'fas fa-box-open'
      case 'cancelled':
        return 'fas fa-times-circle'
      default:
        return 'fas fa-question-circle'
    }
  }

  const getStatusMessage = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        // sent email to notify user about pending order
        return 'Your order is being processed'
      case 'confirmed':
        return 'Your order has been confirmed and will be prepared for shipping'
      case 'shipped':
        return 'Your order is on its way to you'
      case 'delivered':
        return 'Your order has been delivered successfully'
      case 'cancelled':
        return 'This order has been cancelled'
      default:
        return 'Order status unknown'
    }
  }

  const handleReviewClick = (orderId: string, productId: string, productName: string) => {
    setSelectedReview({ orderId, productId, productName })
    setShowReviewForm(true)
  }

  const handleReviewSubmitted = () => {
    refetch() // Refresh orders to update review status
  }

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {user.email}</p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Order History</h2>
              
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="mx-auto h-12 w-12 text-gray-400">
                    <i className="fas fa-shopping-bag text-4xl"></i>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start shopping to see your orders here.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => router.push('/#shop')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-rice-gold hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rice-gold"
                    >
                      <i className="fas fa-plus mr-2"></i>
                      Start Shopping
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Placed on {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-medium text-gray-900 mb-2">
                            {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Status Section */}
                      <div className={`border-l-4 pl-4 py-3 mb-4 rounded-r-lg ${getStatusColor(order.status)} bg-opacity-50`}>
                        <div className="flex items-center">
                          <i className={`${getStatusIcon(order.status)} text-lg mr-3`}></i>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {getStatusMessage(order.status)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex items-center space-x-4">
                                  {/* <div className="flex-shrink-0">
                                    <Image
                                      className="h-12 w-12 rounded-md object-cover border border-gray-200"
                                      src={item.product_image_url || '/placeholder-product.jpg'}
                                      alt={item.product_name}
                                    />
                                  </div> */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900">
                                      {item.product_name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Qty: {item.quantity} × {formatCurrency(item.price ?? 0.00)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900 mb-2">
                                    {formatCurrency((item.price ?? 0.00) * item.quantity)}
                                  </div>
                                  {order.status === 'delivered' && (
                                    <button
                                      onClick={() => handleReviewClick(order.id, item.id || item.product_id, item.product_name)}
                                      className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded border border-blue-200 transition-colors"
                                    >
                                      <i className="fas fa-star mr-1"></i>
                                      Write Review
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                            <span className="text-lg font-bold text-gray-900">{formatCurrency(order.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Review Form Modal */}
      {showReviewForm && selectedReview && (
        <ReviewForm
          orderId={selectedReview.orderId}
          productId={selectedReview.productId}
          productName={selectedReview.productName}
          onClose={() => {
            setShowReviewForm(false)
            setSelectedReview(null)
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </LayoutWrapper>
  )
}
