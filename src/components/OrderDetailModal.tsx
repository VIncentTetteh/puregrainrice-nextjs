'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  shipping_address: any
  payment_reference: string
  admin_notes?: string
  order_items: {
    id: string
    quantity: number
    price: number
    products: {
      name: string
      image_url: string
    }
  }[]
}

interface OrderDetailModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (orderId: string, status: string, notes?: string) => void
  updateLoading: boolean
}

export default function OrderDetailModal({ 
  order, 
  isOpen, 
  onClose, 
  onStatusUpdate, 
  updateLoading 
}: OrderDetailModalProps) {
  const [notes, setNotes] = useState(order.admin_notes || '')

  if (!isOpen) return null

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

  const handleStatusUpdate = (newStatus: string) => {
    onStatusUpdate(order.id, newStatus, notes)
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  Order #{order.id.slice(-8)}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Placed on {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Order Items */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <img
                          className="h-16 w-16 rounded-lg object-cover"
                          src={item.products.image_url || '/placeholder-product.jpg'}
                          alt={item.products.name}
                        />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{item.products.name}</h5>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                        <p className="text-sm text-gray-500">Unit Price: {formatCurrency(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-medium text-gray-900">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-medium text-gray-900">
                    <span>Total Amount</span>
                    <span>{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.payment_reference && (
                    <p className="text-sm text-gray-500 mt-2">
                      Payment Reference: {order.payment_reference}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column - Customer & Admin Info */}
              <div className="space-y-6">
                {/* Customer Information */}
                {order.shipping_address && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">Email:</span>{' '}
                          <span className="text-gray-700">{order.shipping_address.email}</span>
                        </p>
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">Phone:</span>{' '}
                          <span className="text-gray-700">{order.shipping_address.phone || 'Not provided'}</span>
                        </p>
                        {order.shipping_address.address && (
                          <p className="text-sm">
                            <span className="font-medium text-gray-900">Address:</span>{' '}
                            <span className="text-gray-700">{order.shipping_address.address}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Admin Notes</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add notes about this order..."
                  />
                </div>

                {/* Status Actions */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Update Status</h4>
                  <div className="space-y-3">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate('confirmed')}
                          disabled={updateLoading}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateLoading ? 'Updating...' : 'Confirm Order'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('cancelled')}
                          disabled={updateLoading}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate('shipped')}
                        disabled={updateLoading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                      >
                        {updateLoading ? 'Updating...' : 'Mark as Shipped'}
                      </button>
                    )}
                    {order.status === 'shipped' && (
                      <button
                        onClick={() => handleStatusUpdate('delivered')}
                        disabled={updateLoading}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {updateLoading ? 'Updating...' : 'Mark as Delivered'}
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <div className="text-center py-4">
                        <span className="text-green-600 font-medium">✓ Order Completed</span>
                      </div>
                    )}
                    {order.status === 'cancelled' && (
                      <div className="text-center py-4">
                        <span className="text-red-600 font-medium">✗ Order Cancelled</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
