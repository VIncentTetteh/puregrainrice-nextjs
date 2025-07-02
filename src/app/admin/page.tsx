'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { isAdminUser } from '@/lib/admin'
import OrderDetailModal from '@/components/OrderDetailModal'
import Image from 'next/image'

interface ShippingAddress {
  email: string
  [key: string]: string | undefined // Add more fields as needed, or specify them explicitly
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  shipping_address: ShippingAddress
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

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updateLoading, setUpdateLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login')
      return
    }
    if (user && isAdminUser(user.email)) {
      fetchOrders()
    }
  }, [user, authLoading, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders')
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders || [])
      } else {
        toast.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Error fetching orders')
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    setUpdateLoading(orderId)
    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          status: newStatus,
          notes
        })
      })

      if (response.ok) {
        toast.success(`Order status updated to ${newStatus}`)
        fetchOrders() // Refresh orders
      } else {
        toast.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Error updating order')
    } finally {
      setUpdateLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'shipped':
        return 'bg-purple-100 text-purple-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    return order.status === filter
  })

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 rounded-full p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
                <p className="text-sm text-gray-500">Welcome back, {user?.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin/customers')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Customers
              </button>
              <button
                onClick={() => router.push('/')}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                View Store
              </button>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-2 text-gray-600">Manage customer orders and update their status</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-sm text-gray-500">Total Orders</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-800">{statusCounts.pending}</div>
            <div className="text-sm text-yellow-600">Pending</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-800">{statusCounts.confirmed}</div>
            <div className="text-sm text-blue-600">Confirmed</div>
          </div>
          <div className="bg-purple-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-purple-800">{statusCounts.shipped}</div>
            <div className="text-sm text-purple-600">Shipped</div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-800">{statusCounts.delivered}</div>
            <div className="text-sm text-green-600">Delivered</div>
          </div>
          <div className="bg-red-50 rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-800">{statusCounts.cancelled}</div>
            <div className="text-sm text-red-600">Cancelled</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Orders', count: orders.length },
                { key: 'pending', label: 'Pending', count: statusCounts.pending },
                { key: 'confirmed', label: 'Confirmed', count: statusCounts.confirmed },
                { key: 'shipped', label: 'Shipped', count: statusCounts.shipped },
                { key: 'delivered', label: 'Delivered', count: statusCounts.delivered },
                { key: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <i className="fas fa-shopping-bag text-4xl"></i>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filter === 'all' ? 'No orders have been placed yet.' : `No ${filter} orders found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Order #{order.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                        {order.payment_reference && (
                          <p className="text-xs text-gray-400">
                            Payment Ref: {order.payment_reference}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <p className="text-lg font-medium text-gray-900 mt-1">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="border-t border-gray-200 pt-4 mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Items</h4>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {/* <div className="flex-shrink-0">
                                <Image
                                  className="h-10 w-10 rounded-md object-cover"
                                  src={item.products.image_url || '/placeholder-product.jpg'}
                                  alt={item.products.name}
                                  width={40}
                                  height={40}
                                />
                              </div> */}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {item.products.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Qty: {item.quantity}
                                </p>
                              </div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Info */}
                    {order.shipping_address && (
                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Customer</h4>
                        <p className="text-sm text-gray-600">{order.shipping_address.email}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {order.admin_notes && (
                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Admin Notes</h4>
                        <p className="text-sm text-gray-600">{order.admin_notes}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order)
                            setIsModalOpen(true)
                          }}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          View Details
                        </button>
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'confirmed')}
                              disabled={updateLoading === order.id}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updateLoading === order.id ? 'Updating...' : 'Confirm Order'}
                            </button>
                            <button
                              onClick={() => updateOrderStatus(order.id, 'cancelled', 'Order cancelled by admin')}
                              disabled={updateLoading === order.id}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped', 'Order has been shipped')}
                            disabled={updateLoading === order.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                          >
                            {updateLoading === order.id ? 'Updating...' : 'Mark as Shipped'}
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered', 'Order has been delivered')}
                            disabled={updateLoading === order.id}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          >
                            {updateLoading === order.id ? 'Updating...' : 'Mark as Delivered'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedOrder(null)
          }}
          onStatusUpdate={(orderId, status, notes) => {
            updateOrderStatus(orderId, status, notes)
            setIsModalOpen(false)
            setSelectedOrder(null)
          }}
          updateLoading={updateLoading === selectedOrder.id}
        />
      )}
    </div>
  )
}
