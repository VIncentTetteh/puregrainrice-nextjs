'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/app/hooks/useOrders';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface DeliveryDetails {
  fullName: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryNotes: string;
}

interface PaystackResponse {
  reference: string;
  message: string;
  status: string;
  trans: string;
  transaction: string;
  trxref: string;
}

interface CheckoutFormProps {
  onBack: () => void;
  onOrderSuccess?: () => void;
}

interface ValidationErrors {
  fullName?: string;
  phone?: string;
  whatsappNumber?: string;
  email?: string;
  deliveryAddress?: string;
  deliveryCity?: string;
  deliveryNotes?: string;
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (options: unknown) => { openIframe: () => void };
    };
  }
}

const GHANA_CITIES = [
  'Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Sunyani',
  'Koforidua', 'Ho', 'Wa', 'Bolgatanga', 'Tarkwa', 'Techiman', 'Obuasi',
  'Tema', 'Madina', 'Kasoa', 'Ashaiman', 'Aflao', 'Berekum', 'Akim Oda',
];

const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const validatePhone = (v: string) => {
  const c = v.replace(/[\s\-\(\)]/g, '');
  return [/^\+233[0-9]{9}$/, /^0[0-9]{9}$/, /^233[0-9]{9}$/].some(p => p.test(c));
};
const validateFullName = (v: string) => /^[a-zA-Z\s]{2,}$/.test(v.trim()) && v.trim().includes(' ');
const validateAddress = (v: string) => v.trim().length >= 10 && /[0-9]/.test(v.trim());

export default function CheckoutForm({ onBack, onOrderSuccess }: CheckoutFormProps) {
  const { user } = useAuth();
  const { cart, totalAmount, clearCartOnOrderSuccess, setIsCartOpen } = useCart();
  const { createOrder } = useOrders();
  const router = useRouter();

  const [details, setDetails] = useState<DeliveryDetails>({
    fullName: '', phone: '', whatsappNumber: '',
    email: user?.email || '',
    deliveryAddress: '', deliveryCity: '', deliveryNotes: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    const existing = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existing) { setIsPaystackLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setIsPaystackLoaded(true);
    script.onerror = () => toast.error('Failed to load payment system.');
    document.head.appendChild(script);
    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const validateField = (field: keyof DeliveryDetails, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required';
        if (!validateFullName(value)) return 'Enter first and last name (letters only)';
        break;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!validateEmail(value)) return 'Enter a valid email address';
        break;
      case 'phone':
        if (!value.trim()) return 'Phone number is required';
        if (!validatePhone(value)) return 'Enter a valid Ghana number (e.g. 024 123 4567)';
        break;
      case 'whatsappNumber':
        if (value.trim() && !validatePhone(value)) return 'Enter a valid WhatsApp number';
        break;
      case 'deliveryAddress':
        if (!value.trim()) return 'Delivery address is required';
        if (!validateAddress(value)) return 'Include a house/street number and full address';
        break;
      case 'deliveryCity':
        if (!value.trim()) return 'Select a delivery city';
        if (!GHANA_CITIES.includes(value)) return 'Select a valid city';
        break;
      case 'deliveryNotes':
        if (value.length > 500) return 'Max 500 characters';
        break;
    }
  };

  const validate = (fields?: (keyof DeliveryDetails)[]): boolean => {
    const toCheck = fields || (Object.keys(details) as (keyof DeliveryDetails)[]);
    const newErrors: ValidationErrors = { ...errors };
    toCheck.forEach(f => {
      const err = validateField(f, details[f]);
      if (err) newErrors[f] = err;
      else delete newErrors[f];
    });
    setErrors(newErrors);
    return toCheck.every(f => !newErrors[f]);
  };

  const handleChange = (field: keyof DeliveryDetails, value: string) => {
    setDetails(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field: keyof DeliveryDetails) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validateField(field, details[field]);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const step1Fields: (keyof DeliveryDetails)[] = ['fullName', 'email', 'phone'];

  const handleNext = () => {
    const markTouched = step1Fields.reduce((a, f) => ({ ...a, [f]: true }), {});
    setTouched(prev => ({ ...prev, ...markTouched }));
    if (validate(step1Fields)) setStep(2);
  };

  const handlePayment = () => {
    const allTouched = Object.keys(details).reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched(allTouched);
    if (!validate()) { toast.error('Please fix the form errors'); return; }
    if (!cart || cart.length === 0) { toast.error('Your cart is empty'); return; }
    if (!isPaystackLoaded || !window.PaystackPop) { toast.error('Payment system loading, try again shortly'); return; }
    const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY_TEST || '';
    if (!key) { toast.error('Payment not configured — contact support'); return; }

    try {
      const handler = window.PaystackPop.setup({
        key,
        email: details.email,
        amount: Math.round(totalAmount * 100),
        currency: 'GHS',
        ref: 'PG_' + Date.now(),
        metadata: {
          custom_fields: [{ display_name: 'Customer', variable_name: 'customer', value: `${details.fullName} - ${details.phone}` }],
          customer_name: details.fullName,
          customer_phone: details.phone,
          delivery_address: details.deliveryAddress,
          delivery_city: details.deliveryCity,
        },
        callback: (response: PaystackResponse) => handleOrderCreation(response),
        onClose: () => toast('Payment cancelled.'),
      });
      handler.openIframe();
    } catch {
      toast.error('Failed to open payment. Please try again.');
    }
  };

  const handleOrderCreation = async (paymentResponse: PaystackResponse) => {
    setIsProcessing(true);
    try {
      const orderItems = cart.map(item => ({
        id: item.product_id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        weight_kg: item.weight_kg,
      }));
      const orderData = {
        fullName: details.fullName,
        phone: details.phone,
        address: details.deliveryAddress,
        city: details.deliveryCity,
        notes: details.deliveryNotes,
        payment_reference: paymentResponse.reference,
        user_email: details.email,
        user_full_name: details.fullName,
        user_phone: details.phone,
        delivery_address: details.deliveryAddress,
        delivery_city: details.deliveryCity,
        delivery_notes: details.deliveryNotes,
        payment_status: paymentResponse.status,
        shipping_address: {
          user_email: details.email,
          fullName: details.fullName,
          phone: details.phone,
          whatsappNumber: details.whatsappNumber,
          address: details.deliveryAddress,
          city: details.deliveryCity,
          notes: details.deliveryNotes,
        },
      };
      const order = await createOrder(orderItems, orderData);
      if (order?.id) {
        toast.success(`Order #${order.id.slice(-8)} placed successfully!`, { icon: '🎉' });
        clearCartOnOrderSuccess();
        fetch('/api/notify-admin-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
        await fetch('/api/delivery/generate-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }) });
        if (onOrderSuccess) onOrderSuccess();
        setIsCartOpen(false);
        setTimeout(() => router.push('/dashboard'), 1000);
      } else {
        throw new Error('No order ID returned');
      }
    } catch {
      toast.error('Payment succeeded but order failed. Contact support with your payment reference.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fieldClass = (field: keyof DeliveryDetails) =>
    `w-full px-4 py-3 rounded-xl border text-sm text-[var(--charcoal)] bg-[var(--off-white)] outline-none transition-all duration-200 placeholder:text-[var(--charcoal-muted)]/50 ${
      errors[field] && touched[field]
        ? 'border-red-300 focus:ring-2 focus:ring-red-100'
        : touched[field] && details[field] && !errors[field]
        ? 'border-green-400 focus:ring-2 focus:ring-green-100'
        : 'border-[var(--cream-dark)] focus:ring-2 focus:ring-[var(--gold-muted)] focus:border-[var(--gold)]'
    }`;

  const FieldError = ({ field }: { field: keyof ValidationErrors }) =>
    errors[field] && touched[field] ? (
      <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  const Label = ({ text, required }: { text: string; required?: boolean }) => (
    <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
      {text}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--cream-dark)] bg-[var(--off-white)] rounded-t-3xl">
        <button
          onClick={step === 2 ? () => setStep(1) : onBack}
          className="flex items-center gap-2 text-sm text-[var(--charcoal-muted)] hover:text-[var(--charcoal)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {step === 2 ? 'Back' : 'Back to Cart'}
        </button>
        <h2 className="text-base font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
          Checkout
        </h2>
        {/* Step indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2].map(s => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-6 bg-[var(--gold)]' : s < step ? 'w-4 bg-[var(--gold-muted)]' : 'w-4 bg-[var(--cream-dark)]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-6 space-y-6">

        {/* Order summary (always visible) */}
        <div className="bg-[var(--cream)] rounded-2xl border border-[var(--cream-dark)] p-4">
          <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-3">Order Summary</p>
          <div className="space-y-2 mb-3">
            {cart.map(item => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-[var(--charcoal-muted)]">PureGrain Rice {item.weight_kg} × {item.quantity}</span>
                <span className="font-semibold text-[var(--charcoal)]">₵{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center border-t border-[var(--cream-dark)] pt-3">
            <span className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Total</span>
            <span className="text-lg font-bold text-[var(--gold-dark)]" style={{ fontFamily: 'var(--font-display)' }}>
              ₵{totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-[var(--charcoal)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                Step 1 of 2 — Personal Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label text="Full Name" required />
                  <input
                    type="text"
                    name="fullName"
                    value={details.fullName}
                    onChange={e => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Kwame Mensah"
                    className={fieldClass('fullName')}
                  />
                  <FieldError field="fullName" />
                </div>
                <div className="col-span-2">
                  <Label text="Email Address" required />
                  <input
                    type="email"
                    name="email"
                    value={details.email}
                    onChange={e => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="kwame@example.com"
                    className={fieldClass('email')}
                  />
                  <FieldError field="email" />
                </div>
                <div>
                  <Label text="Phone Number" required />
                  <input
                    type="tel"
                    name="phone"
                    value={details.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    onBlur={() => handleBlur('phone')}
                    placeholder="024 123 4567"
                    className={fieldClass('phone')}
                  />
                  <FieldError field="phone" />
                </div>
                <div>
                  <Label text="WhatsApp" />
                  <input
                    type="tel"
                    name="whatsappNumber"
                    value={details.whatsappNumber}
                    onChange={e => handleChange('whatsappNumber', e.target.value)}
                    onBlur={() => handleBlur('whatsappNumber')}
                    placeholder="Same as phone"
                    className={fieldClass('whatsappNumber')}
                  />
                  <FieldError field="whatsappNumber" />
                  <p className="text-xs text-[var(--charcoal-muted)] mt-1">For delivery updates</p>
                </div>
              </div>
            </div>
            <button onClick={handleNext} className="btn-primary w-full !rounded-xl !py-3.5">
              Continue to Delivery
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {/* STEP 2: Delivery + Payment */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-sm font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
              Step 2 of 2 — Delivery Details
            </p>

            <div>
              <Label text="Delivery Address" required />
              <textarea
                name="deliveryAddress"
                value={details.deliveryAddress}
                onChange={e => handleChange('deliveryAddress', e.target.value)}
                onBlur={() => handleBlur('deliveryAddress')}
                rows={3}
                placeholder="House number, street name, area, landmarks…"
                className={`${fieldClass('deliveryAddress')} resize-none`}
              />
              <FieldError field="deliveryAddress" />
            </div>

            <div>
              <Label text="Delivery City" required />
              <select
                name="deliveryCity"
                value={details.deliveryCity}
                onChange={e => handleChange('deliveryCity', e.target.value)}
                onBlur={() => handleBlur('deliveryCity')}
                className={fieldClass('deliveryCity')}
              >
                <option value="">Select your city…</option>
                {GHANA_CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <FieldError field="deliveryCity" />
            </div>

            <div>
              <Label text={`Delivery Notes (${details.deliveryNotes.length}/500)`} />
              <textarea
                name="deliveryNotes"
                value={details.deliveryNotes}
                onChange={e => handleChange('deliveryNotes', e.target.value)}
                onBlur={() => handleBlur('deliveryNotes')}
                rows={2}
                maxLength={500}
                placeholder="Gate code, best time to deliver, landmarks…"
                className={`${fieldClass('deliveryNotes')} resize-none`}
              />
              <FieldError field="deliveryNotes" />
            </div>

            {/* Paystack CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePayment}
                disabled={isProcessing || !isPaystackLoaded}
                className="w-full py-4 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isProcessing || !isPaystackLoaded
                    ? 'var(--charcoal-muted)'
                    : 'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
                  boxShadow: isProcessing ? 'none' : 'var(--shadow-gold)',
                }}
              >
                {isProcessing ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                    Processing…
                  </>
                ) : !isPaystackLoaded ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                    Loading Payment…
                  </>
                ) : (
                  <>
                    {/* Paystack-style lock icon */}
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Pay GH₵{totalAmount.toFixed(2)} securely
                  </>
                )}
              </button>
              <p className="text-center text-xs text-[var(--charcoal-muted)] mt-3 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Secured by Paystack · SSL encrypted
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
