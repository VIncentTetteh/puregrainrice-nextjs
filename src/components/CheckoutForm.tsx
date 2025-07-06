'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useOrders } from '@/app/hooks/useOrders'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

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

interface ValidationErrors {
  fullName?: string
  phone?: string
  whatsappNumber?: string
  email?: string
  deliveryAddress?: string
  deliveryCity?: string
  deliveryNotes?: string
}

// Declare global PaystackPop interface
declare global {
  interface Window {
    PaystackPop: {
      setup: (options: unknown) => {
        openIframe: () => void
      }
    }
  }
}

const GHANA_CITIES = [
  'Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Sunyani',
  'Koforidua', 'Ho', 'Wa', 'Bolgatanga', 'Tarkwa', 'Techiman', 'Obuasi',
  'Tema', 'Madina', 'Kasoa', 'Ashaiman', 'Aflao', 'Berekum', 'Akim Oda'
]

// Validation utility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhoneNumber = (phone: string): boolean => {
  // Remove all spaces and special characters except +
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
  
  // Ghana phone number patterns
  const ghanaPatterns = [
    /^\+233[0-9]{9}$/, // +233 followed by 9 digits
    /^0[0-9]{9}$/, // 0 followed by 9 digits
    /^233[0-9]{9}$/ // 233 followed by 9 digits
  ]
  
  return ghanaPatterns.some(pattern => pattern.test(cleanPhone))
}

const validateFullName = (name: string): boolean => {
  // At least 2 characters, contains at least one space, only letters and spaces
  const nameRegex = /^[a-zA-Z\s]{2,}$/
  return nameRegex.test(name.trim()) && name.trim().includes(' ')
}

const validateAddress = (address: string): boolean => {
  // At least 10 characters and contains some basic address components
  const trimmedAddress = address.trim()
  return trimmedAddress.length >= 10 && /[0-9]/.test(trimmedAddress)
}

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
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false)

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => {
      setIsPaystackLoaded(true)
    }
    script.onerror = () => {
      toast.error('Failed to load payment system. Please refresh the page.')
    }
    document.head.appendChild(script)

    return () => {
      // Clean up script on unmount
      const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]')
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  // Real-time validation function
  const validateField = (field: keyof DeliveryDetails, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 2) return 'Full name must be at least 2 characters'
        if (!validateFullName(value)) return 'Please enter your full name (first and last name)'
        break

      case 'email':
        if (!value.trim()) return 'Email address is required'
        if (!validateEmail(value)) return 'Please enter a valid email address'
        break

      case 'phone':
        if (!value.trim()) return 'Phone number is required'
        if (!validatePhoneNumber(value)) return 'Please enter a valid Ghana phone number (e.g., +233 24 123 4567 or 024 123 4567)'
        break

      case 'whatsappNumber':
        if (value.trim() && !validatePhoneNumber(value)) {
          return 'Please enter a valid WhatsApp number'
        }
        break

      case 'deliveryAddress':
        if (!value.trim()) return 'Delivery address is required'
        if (value.trim().length < 10) return 'Please provide a more detailed address'
        if (!validateAddress(value)) return 'Please include house number or street details'
        break

      case 'deliveryCity':
        if (!value.trim()) return 'Delivery city is required'
        if (!GHANA_CITIES.includes(value)) return 'Please select a valid city'
        break

      case 'deliveryNotes':
        if (value.length > 500) return 'Delivery notes cannot exceed 500 characters'
        break
    }
    return undefined
  }

  // Comprehensive form validation
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Validate all required fields
    Object.keys(deliveryDetails).forEach(key => {
      const field = key as keyof DeliveryDetails
      const error = validateField(field, deliveryDetails[field])
      if (error) {
        newErrors[field] = error
      }
    })

    // Cart validation
    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty. Please add items before checkout.')
      return false
    }

    // Total amount validation
    if (totalAmount <= 0) {
      toast.error('Invalid order total. Please check your cart.')
      return false
    }

    setErrors(newErrors)
    
    // Mark all fields as touched to show errors
    const allTouched = Object.keys(deliveryDetails).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(allTouched)

    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof DeliveryDetails, value: string) => {
    setDeliveryDetails(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    if (touched[field]) {
      const error = validateField(field, value)
      setErrors(prev => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: keyof DeliveryDetails) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, deliveryDetails[field])
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handlePayment = () => {
    if (!validateForm()) {
      // Count and show specific error messages
      const errorCount = Object.keys(errors).length
      const errorMessages = Object.values(errors).filter(Boolean)
      
      if (errorCount === 1) {
        toast.error(`Please fix the following error: ${errorMessages[0]}`)
      } else if (errorCount > 1) {
        toast.error(`Please fix ${errorCount} errors in the form`)
      }
      
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      const element = document.querySelector(`[name="${firstErrorField}"]`)
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      return
    }

    if (!isPaystackLoaded || !window.PaystackPop) {
      toast.error('Payment system is still loading. Please wait a moment and try again.')
      return
    }

    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_TEST || ''
    if (!paystackKey) {
      toast.error('Payment system is not configured. Please contact support.')
      return
    }

    const totalInPesewas = totalAmount * 100

    try {
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
    } catch (error) {
      console.error('Paystack setup error:', error)
      toast.error('Failed to initialize payment. Please try again.')
    }
  }

  const handleOrderCreation = async (paymentResponse: PaystackResponse) => {
    setIsProcessing(true)
    try {
      // Prepare order items with proper structure for new schema
      const orderItems = cart.map(item => ({
        id: item.product_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        weight_kg: item.weight_kg
      }))

      const orderData = {
        fullName: deliveryDetails.fullName, 
        phone: deliveryDetails.phone,
        address: deliveryDetails.deliveryAddress,
        city: deliveryDetails.deliveryCity,
        notes: deliveryDetails.deliveryNotes,
        payment_reference: paymentResponse.reference,
        user_email: deliveryDetails.email,
        user_full_name: deliveryDetails.fullName,
        user_phone: deliveryDetails.phone,
        delivery_address: deliveryDetails.deliveryAddress,
        delivery_city: deliveryDetails.deliveryCity,
        delivery_notes: deliveryDetails.deliveryNotes,
        payment_status: paymentResponse.status,
        shipping_address: {
          user_email: deliveryDetails.email,
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
        
        clearCartOnOrderSuccess()
        
        try {
          await generateDeliveryCode(order.id)
        } catch (error) {
          console.error('Error generating delivery code:', error)
        }
        
        fetch('/api/notify-admin-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        });

        if (onOrderSuccess) {
          onOrderSuccess()
        }
        setIsCartOpen(false)
        
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

  // Helper function to get input style classes
  const getInputClasses = (field: keyof DeliveryDetails) => {
    const baseClasses = "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors"
    const hasError = errors[field]
    const isTouched = touched[field]
    
    if (hasError && isTouched) {
      return `${baseClasses} border-red-500 focus:ring-red-500 bg-red-50`
    } else if (isTouched && !hasError && deliveryDetails[field]) {
      return `${baseClasses} border-green-500 focus:ring-green-500 bg-green-50`
    } else {
      return `${baseClasses} border-gray-300 focus:ring-blue-500`
    }
  }

  return (
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
                name="fullName"
                value={deliveryDetails.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={() => handleBlur('fullName')}
                className={getInputClasses('fullName')}
                placeholder="Enter your full name (first and last name)"
              />
              {errors.fullName && touched.fullName && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={deliveryDetails.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={getInputClasses('email')}
                placeholder="Enter your email address"
              />
              {errors.email && touched.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={deliveryDetails.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={getInputClasses('phone')}
                placeholder="e.g., +233 24 123 4567 or 024 123 4567"
              />
              {errors.phone && touched.phone && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp Number (Optional)
              </label>
              <input
                type="tel"
                name="whatsappNumber"
                value={deliveryDetails.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                onBlur={() => handleBlur('whatsappNumber')}
                className={getInputClasses('whatsappNumber')}
                placeholder="e.g., +233 24 123 4567"
              />
              {errors.whatsappNumber && touched.whatsappNumber && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.whatsappNumber}
                </p>
              )}
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
                name="deliveryAddress"
                value={deliveryDetails.deliveryAddress}
                onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                onBlur={() => handleBlur('deliveryAddress')}
                rows={3}
                className={getInputClasses('deliveryAddress')}
                placeholder="Enter your complete delivery address (house number, street, area, landmarks)"
              />
              {errors.deliveryAddress && touched.deliveryAddress && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.deliveryAddress}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery City *
              </label>
              <select
                name="deliveryCity"
                value={deliveryDetails.deliveryCity}
                onChange={(e) => handleInputChange('deliveryCity', e.target.value)}
                onBlur={() => handleBlur('deliveryCity')}
                className={getInputClasses('deliveryCity')}
              >
                <option value="">Select your city</option>
                {GHANA_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.deliveryCity && touched.deliveryCity && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.deliveryCity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Notes (Optional)
                <span className="text-gray-500 text-xs ml-1">
                  ({deliveryDetails.deliveryNotes.length}/500)
                </span>
              </label>
              <textarea
                name="deliveryNotes"
                value={deliveryDetails.deliveryNotes}
                onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                onBlur={() => handleBlur('deliveryNotes')}
                rows={2}
                className={getInputClasses('deliveryNotes')}
                placeholder="Any special instructions for delivery (e.g., gate code, best time to deliver)"
                maxLength={500}
              />
              {errors.deliveryNotes && touched.deliveryNotes && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.deliveryNotes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
          <div className="space-y-2">
            {cart.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span>{item.weight_kg} × {item.quantity}</span>
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
          disabled={isProcessing || !isPaystackLoaded}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Processing...' : !isPaystackLoaded ? 'Loading Payment...' : `Pay GH₵${totalAmount.toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          By placing this order, you agree to our terms and conditions. 
          You will receive an order confirmation email and delivery tracking information.
        </p>
      </form>
    </div>
  )
}