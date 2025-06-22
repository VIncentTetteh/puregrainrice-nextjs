'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import EmailPromptModal from '@/components/EmailPromptModal';

interface PaystackResponse {
  reference: string;
  message: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

interface PaystackHandler {
  openIframe(): void;
}

interface PaystackPop {
  setup(options: {
    key: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata: Record<string, unknown>;
    callback: (response: PaystackResponse) => void;
    onClose: () => void;
  }): PaystackHandler;
}

declare global {
  interface Window {
    PaystackPop: PaystackPop;
  }
}

const CartModal = () => {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    totalAmount,
    updateQuantity,
    removeFromCart,
    clearCart
  } = useCart();

  const [showEmailModal, setShowEmailModal] = useState(false);

  const checkout = () => {
    if (cart.length === 0) {
      toast.error('Your cart is empty!');
      console.log('checkout clicked');
      return;
    }
    setShowEmailModal(true);
  };

  const handleEmailSubmit = (customerEmail: string) => {
    const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_TEST || '';
    if (!paystackKey) {
      toast.error('Payment system is not configured. Please contact support.');
      return;
    }

    const totalInPesewas = totalAmount * 100;

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
          value: cart.map(item => `${item.name} (${item.quantity})`).join(', ')
        }],
        customer_email: customerEmail,
        order_total: totalAmount,
        business_name: "PurePlatter Foods LTD"
      },
      callback: function (response: PaystackResponse) {
        toast.success(`🎉 Payment successful! Reference: ${response.reference}`);
        clearCart();
        setIsCartOpen(false);
        console.log('Payment successful:', response);
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
      <EmailPromptModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSubmit={handleEmailSubmit}
      />

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
                  <div key={item.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <p className="text-rice-gold font-bold">₵{item.price}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <i className="fas fa-minus text-sm"></i>
                      </button>
                      <span className="w-8 text-center font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                      >
                        <i className="fas fa-plus text-sm"></i>
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
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
                  <button
                    onClick={checkout}
                    className="w-full bg-rice-gold hover:bg-yellow-600 text-white py-3 rounded-lg font-semibold transition duration-300 mb-3"
                  >
                    Proceed to Checkout
                  </button>
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
    </>
  );
};

export default CartModal;
