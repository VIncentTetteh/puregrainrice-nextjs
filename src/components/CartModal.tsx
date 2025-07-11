'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/app/hooks/useOrders';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CheckoutForm from '@/components/CheckoutForm';

interface PaystackResponse {
  reference: string;
  message: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

// interface PaystackHandler {
//   openIframe(): void;
// }

// interface PaystackPop {
//   setup(options: {
//     key: string;
//     email: string;
//     amount: number;
//     currency: string;
//     ref: string;
//     metadata: Record<string, unknown>;
//     callback: (response: PaystackResponse) => void;
//     onClose: () => void;
//   }): PaystackHandler;
// }

// declare global {
//   interface Window {
//     PaystackPop: PaystackPop;
//   }
// }

const CartModal = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearCartOnOrderSuccess
  } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const router = useRouter();

  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const checkout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      return;
    }
    
    if (!user) {
      toast.error('Please sign in to place an order');
      return;
    }
    
    // Show checkout form to collect delivery details
    setShowCheckoutForm(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handlePayment = (customerEmail: string) => {
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_TEST || '';
    if (!paystackKey) {
      toast.error('Payment system is not configured. Please contact support.');
      return;
    }

    const totalInPesewas = totalAmount * 100;

    if (typeof window === 'undefined' || !window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
      toast.error('Payment system not loaded. Please try again.');
      return;
    }

    const handler = window.PaystackPop.setup({
      key: paystackKey,
      email: customerEmail,
      amount: totalInPesewas,
      currency: 'GHS',
      ref: 'PG_' + Math.floor((Math.random() * 1000000000) + 1),
      metadata: {
        custom_fields: [{
          display_name: "Cart Items",
          variable_name: "cart_items",
          value: cart.map(item => `${item.weight_kg} (${item.quantity})`).join(', ')
        }],
        customer_email: customerEmail,
        order_total: totalAmount,
        business_name: "PurePlatter Foods LTD"
      },
      callback: function (response: PaystackResponse) {
        (async () => {
          setIsProcessingOrder(true);
          try {
            const orderItems = cart.map(item => ({
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.price, // <-- use 'price' not 'unit_price'
              weight_kg: item.weight_kg // <-- use 'weight_kg' not 'product_weight_kg'
            }))

            const shippingAddress = {
              email: customerEmail,
              user_email: customerEmail,
              user_full_name: 'Quick Order Customer',
              user_phone: '000-000-0000',
              delivery_address: 'Address to be confirmed',
              delivery_city: 'Accra',
              payment_reference: response.reference
            };

            const order = await createOrder(orderItems, shippingAddress);

            if (order && order.id) {
              console.log('Order created successfully in CartModal:', order);
              toast.success(`🎉 Payment successful! Order #${order.id.slice(-8)} created!`);
              clearCartOnOrderSuccess();
              setIsCartOpen(false);
              // Add longer delay to ensure cart clearing completes and UI updates
              setTimeout(() => {
                console.log('Navigating to dashboard from CartModal...');
                router.push('/dashboard');
              }, 1000);
            } else {
              console.error('Order creation failed in CartModal - no order ID returned');
              // Even if order creation appears to fail, the payment was successful
              toast.success('🎉 Payment successful! Redirecting to check your orders...');
              clearCartOnOrderSuccess();
              setIsCartOpen(false);
              setTimeout(() => {
                console.log('Navigating to dashboard after payment success...');
                router.push('/dashboard');
              }, 1000);
            }
          } catch (error) {
            console.error('Error creating order:', error);
            toast.error('Payment successful but failed to create order. Please contact support.');
          } finally {
            setIsProcessingOrder(false);
          }
        })();
      },
      onClose: function () {
        toast('Payment dialog was closed.');
      }
    });

    handler.openIframe();
  };

  if (!isCartOpen) return null;

  return (
    <>

      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4 mb-6">
              {cart.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <i className="fas fa-shopping-cart text-4xl mb-4"></i>
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.product_id || ""} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.weight_kg}</h4>
                      <p className="text-rice-gold font-bold">₵{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <i className="fas fa-minus text-sm"></i>
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <i className="fas fa-plus text-sm"></i>
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span>₵{totalAmount}</span>
                  </div>
                </div>

                <div className="mt-6">
                  {user ? (
                    <>
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Checkout as: <span className="font-medium text-gray-800">{user.email}</span>
                        </p>
                      </div>
                      <button
                        onClick={checkout}
                        disabled={isProcessingOrder}
                        className="w-full bg-rice-gold hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition duration-300 mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isProcessingOrder ? 'Processing...' : 'Proceed to Checkout'}
                      </button>
                    </>
                  ) : (
                    <div className="mb-3">
                      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                          <p className="font-medium text-blue-800">
                            Ready to checkout?
                          </p>
                        </div>
                        <p className="text-sm text-blue-700">
                          Sign in to complete your purchase and track your order. Your cart items will be saved!
                        </p>
                      </div>
                      <Link href="/login" onClick={() => setIsCartOpen(false)}>
                        <button className="w-full bg-rice-gold hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition duration-300 flex items-center justify-center">
                          <i className="fas fa-sign-in-alt mr-2"></i>
                          Sign In to Checkout
                        </button>
                      </Link>
                    </div>
                  )}
                  <button
                    onClick={clearCart}
                    className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-semibold transition duration-300"
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Checkout Form Modal */}
      {showCheckoutForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <CheckoutForm 
              onBack={() => setShowCheckoutForm(false)}
              onOrderSuccess={() => setShowCheckoutForm(false)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default CartModal;
