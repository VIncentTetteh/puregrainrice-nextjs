'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useOrders } from '@/app/hooks/useOrders'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import Script from 'next/script'

interface DeliveryDetails {
  fullName: string
  phone: string
  whatsappNumber: string
  email: string
  deliveryAddress: string
  deliveryCity: string
  deliveryNotes: string
}

interface PaystackResponse {
  reference: string
  message: string
  status: string
  trans: string
  transaction: string
  trxref: string
}

interface CheckoutFormProps {
  onBack: () => void
  onOrderSuccess?: () => void
}

const GHANA_CITIES = [
  'Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Sunyani',
  'Koforidua', 'Ho', 'Wa', 'Bolgatanga', 'Tarkwa', 'Techiman', 'Obuasi',
  'Tema', 'Madina', 'Kasoa', 'Ashaiman', 'Aflao', 'Berekum', 'Akim Oda'
]

export default function CheckoutForm({ onBack, onOrderSuccess }: CheckoutFormProps) {
  const { user } = useAuth()
  const { cart, totalAmount, clearCartOnOrderSuccess, setIsCartOpen } = useCart()
  const { createOrder } = useOrders()
  const router = useRouter()

  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    fullName: '',
    phone: '',
    whatsappNumber: '',
    email: user?.email || '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryNotes: ''
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<Partial<DeliveryDetails>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<DeliveryDetails> = {}

    if (!deliveryDetails.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }

    if (!deliveryDetails.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\+?[0-9]{10,15}$/.test(deliveryDetails.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!deliveryDetails.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(deliveryDetails.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!deliveryDetails.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required'
    }

    if (!deliveryDetails.deliveryCity.trim()) {
      newErrors.deliveryCity = 'Delivery city is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof DeliveryDetails, value: string) => {
    setDeliveryDetails(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handlePayment = () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly')
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_TEST || ''
    if (!paystackKey) {
      toast.error('Payment system is not configured. Please contact support.')
      return
    }

    const totalInPesewas = totalAmount * 100

    if (typeof window === 'undefined' || !window.PaystackPop) {
      toast.error('Payment system not loaded. Please try again.')
      return
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: deliveryDetails.email,
      amount: totalInPesewas,
      currency: 'GHS',
      ref: 'PG_' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: {
        custom_fields: [{
          display_name: "Customer Details",
          variable_name: "customer_details",
          value: `${deliveryDetails.fullName} - ${deliveryDetails.phone}`
        }],
        customer_name: deliveryDetails.fullName,
        customer_phone: deliveryDetails.phone,
        delivery_address: deliveryDetails.deliveryAddress,
        delivery_city: deliveryDetails.deliveryCity
      },
      callback: function (response: PaystackResponse) {
        handleOrderCreation(response)
      },
      onClose: function () {
        toast('Payment dialog was closed.')
      }
    })

    handler.openIframe()
  }

  const handleOrderCreation = async (paymentResponse: PaystackResponse) => {
    setIsProcessing(true)
    try {
      // Prepare order items with proper structure for new schema
      const orderItems = cart.map(item => ({
        id: item.id, // Cart item ID (will be used as product_id)
        product_id: item.id, // Use id as product_id since CartContext uses id field
        quantity: item.quantity,
        price: item.price, // Add price at item level
        name: item.name, // Add name at item level
        image: item.image, // Add image at item level
        description: item.description, // Add description if available
        weight_kg: item.weight_kg, // Add weight if available
        products: {
          name: item.name,
          price: item.price,
          description: item.description,
          image_url: item.image || '',
          weight_kg: item.weight_kg
        }
      }))

      const orderData = {
        // Map to new schema field names
        email: deliveryDetails.email,
        fullName: deliveryDetails.fullName, 
        phone: deliveryDetails.phone,
        address: deliveryDetails.deliveryAddress,
        city: deliveryDetails.deliveryCity,
        notes: deliveryDetails.deliveryNotes,
        payment_reference: paymentResponse.reference,
        // Also include with new schema field names for useOrders
        user_email: deliveryDetails.email,
        user_full_name: deliveryDetails.fullName,
        user_phone: deliveryDetails.phone,
        delivery_address: deliveryDetails.deliveryAddress,
        delivery_city: deliveryDetails.deliveryCity,
        delivery_notes: deliveryDetails.deliveryNotes,
        // Legacy field for backward compatibility
        shipping_address: {
          email: deliveryDetails.email,
          fullName: deliveryDetails.fullName,
          phone: deliveryDetails.phone,
          whatsappNumber: deliveryDetails.whatsappNumber,
          address: deliveryDetails.deliveryAddress,
          city: deliveryDetails.deliveryCity,
          notes: deliveryDetails.deliveryNotes
        }
      }

      const order = await createOrder(orderItems, orderData)

      if (order?.id) {
        console.log('Order created successfully:', order)
        toast.success(`🎉 Order placed successfully! Order #${order.id.slice(-8)}`)
        
        // Clear cart
        clearCartOnOrderSuccess()
        
        // Generate delivery confirmation code
        try {
          await generateDeliveryCode(order.id)
        } catch (error) {
          console.error('Error generating delivery code:', error)
        }
        
        // Notify admin via backend API
        fetch('/api/notify-admin-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        // Close all modals first
        if (onOrderSuccess) {
          onOrderSuccess()
        }
        setIsCartOpen(false)
        
        // Navigate to dashboard with a longer delay to ensure everything is properly closed
        setTimeout(() => {
          console.log('Navigating to dashboard...')
          router.push('/dashboard')
        }, 1000)
      } else {
        console.error('Order creation failed - no order ID returned')
        throw new Error('Failed to create order - no order ID returned')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Payment successful but failed to create order. Please contact support.')
    } finally {
      setIsProcessing(false)
    }
  }

  const generateDeliveryCode = async (orderId: string) => {
    try {
      await fetch('/api/delivery/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
    } catch (error) {
      console.error('Error generating delivery code:', error)
    }
  }

  return (
    <>
    <Script src="https://js.paystack.co/v1/inline.js" strategy="afterInteractive" />
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Delivery Details</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 flex items-center"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Cart
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={deliveryDetails.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={deliveryDetails.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={deliveryDetails.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., +233 24 123 4567"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number (Optional)
              </label>
              <input
                type="tel"
                value={deliveryDetails.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., +233 24 123 4567"
              />
              <p className="text-xs text-gray-500 mt-1">For order updates via WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Address *
              </label>
              <textarea
                value={deliveryDetails.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deliveryAddress ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your complete delivery address (house number, street, area, landmarks)"
              />
              {errors.deliveryAddress && <p className="text-red-500 text-sm mt-1">{errors.deliveryAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery City *
              </label>
              <select
                value={deliveryDetails.deliveryCity}
                onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.deliveryCity ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select your city</option>
                {GHANA_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.deliveryCity && <p className="text-red-500 text-sm mt-1">{errors.deliveryCity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Notes (Optional)
              </label>
              <textarea
                value={deliveryDetails.deliveryNotes}
                onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions for delivery (e.g., gate code, best time to deliver)"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>GH₵{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>GH₵{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : `Pay GH₵${totalAmount.toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By placing this order, you agree to our terms and conditions. 
          You will receive an order confirmation email and delivery tracking information.
        </p>
      </form>
    </div>
    </>
  )
}
