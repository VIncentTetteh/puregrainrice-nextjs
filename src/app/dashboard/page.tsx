'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/app/hooks/useOrders';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import LayoutWrapper from '@/components/LayoutWrapper';
import ReviewForm from '@/components/ReviewForm';
import Link from 'next/link';

type TabId = 'orders' | 'profile';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'] as const;
type StatusStep = typeof STATUS_STEPS[number];

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: {
    label: 'Pending',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-blue-700',
    bg: 'bg-blue-50 border-blue-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  processing: {
    label: 'Processing',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50 border-indigo-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  shipped: {
    label: 'Shipped',
    color: 'text-purple-700',
    bg: 'bg-purple-50 border-purple-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  delivered: {
    label: 'Delivered',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
};

function DeliveryTimeline({ status }: { status: string }) {
  const currentIdx = STATUS_STEPS.indexOf(status as StatusStep);
  if (status === 'cancelled') return null;

  const stepLabels: Record<StatusStep, string> = {
    pending: 'Order Placed',
    confirmed: 'Confirmed',
    processing: 'Preparing',
    shipped: 'On the Way',
    delivered: 'Delivered',
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-[var(--cream-dark)] z-0" />
        <div
          className="absolute top-4 left-0 h-0.5 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] z-0 transition-all duration-500"
          style={{ width: `${Math.max(0, (currentIdx / (STATUS_STEPS.length - 1)) * 100)}%` }}
        />

        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx;
          return (
            <div key={step} className="flex flex-col items-center z-10 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? 'bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] text-white shadow-gold'
                    : 'bg-white border-2 border-[var(--cream-dark)] text-[var(--charcoal-muted)]'
                }`}
              >
                {done ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] mt-1.5 text-center leading-tight font-medium ${
                done ? 'text-[var(--gold-dark)]' : 'text-[var(--charcoal-muted)]'
              }`}>
                {stepLabels[step]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const Spinner = () => (
  <div
    className="w-10 h-10 border-[3px] border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full mx-auto"
    style={{ animation: 'spin 0.8s linear infinite' }}
  />
);

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { orders, loading: ordersLoading, refetch } = useOrders();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('orders');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<{
    orderId: string;
    productId: string;
    productName: string;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || ordersLoading) {
    return (
      <LayoutWrapper>
        <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
          <div className="text-center">
            <Spinner />
            <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading your account…</p>
          </div>
        </div>
      </LayoutWrapper>
    );
  }
  if (!user) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const totalSpent = orders.reduce((s, o) => s + o.total_amount, 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'shipped').length;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'orders',
      label: 'Order History',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-[var(--off-white)]">

        {/* Top header bar */}
        <div
          className="pt-20 pb-8 px-4"
          style={{ background: 'linear-gradient(135deg, var(--charcoal) 0%, var(--charcoal-light) 50%, #1e2d25 100%)' }}
        >
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white text-xl font-bold shadow-gold"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Welcome back</p>
                  <h1 className="text-white text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                    {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer'}
                  </h1>
                  <p className="text-white/50 text-xs mt-0.5">{user.email}</p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/08 border border-white/10 text-white/70 hover:bg-white/12 text-sm font-medium transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { label: 'Total Orders', value: orders.length, icon: '📦' },
                { label: 'Delivered', value: deliveredOrders, icon: '✅' },
                { label: 'Active Orders', value: pendingOrders, icon: '🚚' },
              ].map((s, i) => (
                <div key={i} className="bg-white/05 border border-white/08 rounded-2xl p-4 text-center">
                  <span className="text-xl block mb-1">{s.icon}</span>
                  <span className="text-2xl font-bold text-[var(--gold-light)] block" style={{ fontFamily: 'var(--font-display)' }}>
                    {s.value}
                  </span>
                  <span className="text-white/40 text-xs uppercase tracking-wider font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8 bg-white rounded-2xl p-1.5 shadow-sm border border-[var(--cream-dark)] w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold)] text-white shadow-gold'
                    : 'text-[var(--charcoal-muted)] hover:text-[var(--charcoal)] hover:bg-[var(--cream)]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              {orders.length === 0 ? (
                <div className="card p-16 text-center">
                  <span className="text-5xl block mb-4">🛒</span>
                  <h3 className="text-xl font-bold text-[var(--charcoal)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    No orders yet
                  </h3>
                  <p className="text-[var(--charcoal-muted)] text-sm mb-6">
                    Your order history will appear here after your first purchase.
                  </p>
                  <Link href="/#shop">
                    <button className="btn-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Start Shopping
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Total spent summary */}
                  <div className="card p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">
                        Lifetime Spending
                      </p>
                      <p className="text-2xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                        GH₵{totalSpent.toFixed(2)}
                      </p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[var(--gold-muted)] flex items-center justify-center text-2xl">
                      💰
                    </div>
                  </div>

                  {orders.map((order) => {
                    const cfg = statusConfig[order.status] || statusConfig.pending;
                    return (
                      <div key={order.id} className="card overflow-hidden">
                        {/* Order header */}
                        <div className="p-5 border-b border-[var(--cream-dark)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-[var(--charcoal)] text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                                Order #{order.id.slice(-8).toUpperCase()}
                              </h3>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.color}`}>
                                {cfg.icon}
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--charcoal-muted)]">
                              Placed {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                              GH₵{order.total_amount.toFixed(2)}
                            </p>
                            {order.payment_reference && (
                              <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">
                                Ref: {order.payment_reference}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Delivery Timeline */}
                        {order.status !== 'cancelled' && (
                          <div className="px-6 py-5 bg-[var(--cream)]/40 border-b border-[var(--cream-dark)]">
                            <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-4">
                              Delivery Progress
                            </p>
                            <DeliveryTimeline status={order.status} />
                          </div>
                        )}

                        {/* Order items */}
                        <div className="p-5">
                          <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-3">
                            Items Ordered
                          </p>
                          <div className="space-y-3">
                            {order.order_items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--cream)] border border-[var(--cream-dark)]"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white text-lg flex-shrink-0">
                                    🌾
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--charcoal)]">
                                      PureGrain Rice · {item.product_id?.includes('25') ? '25KG' : item.product_id?.includes('10') ? '10KG' : '5KG'}
                                    </p>
                                    <p className="text-xs text-[var(--charcoal-muted)]">
                                      Qty {item.quantity} × GH₵{item.unit_price}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-[var(--charcoal)]">
                                    GH₵{(item.unit_price * item.quantity).toFixed(2)}
                                  </p>
                                  {order.status === 'delivered' && (
                                    <button
                                      onClick={() => {
                                        setSelectedReview({ orderId: order.id, productId: item.product_id, productName: item.product_id });
                                        setShowReviewForm(true);
                                      }}
                                      className="mt-1 text-xs text-[var(--gold-dark)] hover:text-[var(--gold)] font-medium flex items-center gap-1 ml-auto"
                                    >
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                      </svg>
                                      Write Review
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Shipping address */}
                          {(order.delivery_address || order.delivery_city) && (
                            <div className="mt-4 pt-4 border-t border-[var(--cream-dark)] flex items-start gap-2">
                              <svg className="w-4 h-4 text-[var(--gold)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <div className="text-xs text-[var(--charcoal-muted)]">
                                {order.delivery_address}
                                {order.delivery_city && `, ${order.delivery_city}`}
                              </div>
                            </div>
                          )}

                          {/* Delivery notes */}
                          {order.delivery_notes && (
                            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-[var(--forest-muted)] border border-[var(--forest)]/10">
                              <svg className="w-4 h-4 text-[var(--forest)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                              <p className="text-xs text-[var(--forest)]">
                                <span className="font-semibold">Delivery note:</span> {order.delivery_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-[var(--charcoal)] mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                  Account Information
                </h3>
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--cream-dark)]">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white text-2xl font-bold shadow-gold"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {user.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--charcoal)]">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </p>
                    <p className="text-sm text-[var(--charcoal-muted)]">{user.email}</p>
                    <span className="badge badge-forest mt-2 text-xs">Verified Customer</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Email Address', value: user.email || '—', icon: '📧' },
                    { label: 'Display Name', value: user.user_metadata?.full_name || 'Not set', icon: '👤' },
                    { label: 'Member Since', value: new Date(user.created_at || Date.now()).toLocaleDateString('en-GH', { year: 'numeric', month: 'long' }), icon: '🗓️' },
                    { label: 'Sign-in Method', value: 'Google Account', icon: '🔑' },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-[var(--cream-dark)] last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{row.icon}</span>
                        <span className="text-sm text-[var(--charcoal-muted)]">{row.label}</span>
                      </div>
                      <span className="text-sm font-medium text-[var(--charcoal)]">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Summary */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-[var(--charcoal)] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  Purchase Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { value: orders.length, label: 'Total Orders', color: 'text-[var(--gold-dark)]' },
                    { value: deliveredOrders, label: 'Completed', color: 'text-green-600' },
                    { value: pendingOrders, label: 'Active', color: 'text-blue-600' },
                    { value: `GH₵${totalSpent.toFixed(0)}`, label: 'Total Spent', color: 'text-[var(--charcoal)]' },
                  ].map((item, i) => (
                    <div key={i} className="bg-[var(--cream)] rounded-xl p-4 text-center border border-[var(--cream-dark)]">
                      <span className={`block text-2xl font-bold mb-1 ${item.color}`} style={{ fontFamily: 'var(--font-display)' }}>
                        {item.value}
                      </span>
                      <span className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger zone */}
              <div className="card p-6">
                <h3 className="text-base font-bold text-[var(--charcoal)] mb-2">Account Actions</h3>
                <p className="text-sm text-[var(--charcoal-muted)] mb-4">Manage your session and account settings.</p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={signOut}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      {showReviewForm && selectedReview && (
        <ReviewForm
          orderId={selectedReview.orderId}
          productId={selectedReview.productId}
          productName={selectedReview.productName}
          onClose={() => { setShowReviewForm(false); setSelectedReview(null); }}
          onReviewSubmitted={() => { refetch(); setShowReviewForm(false); setSelectedReview(null); }}
        />
      )}
    </LayoutWrapper>
  );
}
