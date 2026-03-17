'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import OrderDetailModal from '@/components/OrderDetailModal';
import { Order } from '@/types/Order';
import Link from 'next/link';
import Image from 'next/image';

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', dot: 'bg-blue-400',   badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing:{ label: 'Processing',dot: 'bg-indigo-400', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipped:   { label: 'Shipped',   dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  delivered: { label: 'Delivered', dot: 'bg-green-400',  badge: 'bg-green-50 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',    badge: 'bg-red-50 text-red-700 border-red-200' },
};

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full"
    style={{ animation: 'spin 0.8s linear infinite' }} />
);

export default function AdminPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login');
      return;
    }
    if (user && isAdminUser(user.email)) fetchOrders();
  }, [user, authLoading, router]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok) setOrders(data.orders || []);
      else toast.error('Failed to load orders');
    } catch {
      toast.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string) => {
    setUpdateLoading(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, notes }),
      });
      if (res.ok) {
        toast.success(`Order updated to ${newStatus}`);
        fetchOrders();
      } else {
        toast.error('Failed to update order');
      }
    } catch {
      toast.error('Error updating order');
    } finally {
      setUpdateLoading(null);
    }
  };

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' });
  const fmtCurrency = (n: number) => `GH₵${n.toFixed(2)}`;

  const statusCounts = {
    all: orders.length,
    pending:   orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped:   orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenue = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((s, o) => s + o.total_amount, 0);

  const filteredOrders = orders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        o.id.toLowerCase().includes(q) ||
        o.shipping_address?.user_email?.toLowerCase().includes(q) ||
        o.payment_reference?.toLowerCase().includes(q)
      );
    });

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading admin panel…</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'shipped',   label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex">

      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-[var(--charcoal)] flex-col hidden lg:flex">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/08">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--gold-muted)] rounded-xl p-1.5">
              <Image src="/IMG_4866.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
            </div>
            <div>
              <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: 'var(--font-display)' }}>PurePlatter</p>
              <p className="text-[var(--gold)] text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: 'Orders', icon: '📦', active: true, href: '/admin' },
            { label: 'Customers', icon: '👥', active: false, href: '/admin/customers' },
            { label: 'View Store', icon: '🏪', active: false, href: '/' },
          ].map(item => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                item.active
                  ? 'bg-[var(--gold)] text-white shadow-gold'
                  : 'text-white/50 hover:text-white hover:bg-white/08'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Admin info */}
        <div className="px-4 pb-6 border-t border-white/08 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/05 mb-3">
            <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.email}</p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/08 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-[var(--cream-dark)] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
              Order Management
            </h1>
            <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">Manage and update customer orders</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Mobile nav links */}
            <Link href="/admin/customers" className="lg:hidden btn-ghost !text-xs !py-2 !px-3">Customers</Link>
            <button
              onClick={signOut}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
            >
              Sign out
            </button>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6 overflow-auto">

          {/* Analytics cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Orders', value: orders.length, icon: '📦', color: 'text-[var(--charcoal)]' },
              { label: 'Revenue', value: fmtCurrency(totalRevenue), icon: '💰', color: 'text-[var(--gold-dark)]' },
              { label: 'Pending', value: statusCounts.pending, icon: '⏳', color: 'text-amber-600' },
              { label: 'Delivered', value: statusCounts.delivered, icon: '✅', color: 'text-green-600' },
            ].map((card, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{card.icon}</span>
                  <span className={`text-2xl font-bold ${card.color}`} style={{ fontFamily: 'var(--font-display)' }}>
                    {card.value}
                  </span>
                </div>
                <p className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">{card.label}</p>
              </div>
            ))}
          </div>

          {/* Filter + Search */}
          <div className="card p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 flex-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    filter === tab.key
                      ? 'bg-[var(--gold)] text-white shadow-gold'
                      : 'text-[var(--charcoal-muted)] hover:bg-[var(--cream)] hover:text-[var(--charcoal)]'
                  }`}
                >
                  {tab.label}
                  <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                    filter === tab.key ? 'bg-white/25 text-white' : 'bg-[var(--cream-dark)] text-[var(--charcoal-muted)]'
                  }`}>
                    {statusCounts[tab.key as keyof typeof statusCounts]}
                  </span>
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-64 flex-shrink-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--charcoal-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID, email, ref…"
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] bg-[var(--off-white)] focus:ring-2 focus:ring-[var(--gold-muted)] focus:border-[var(--gold)] outline-none transition-all"
              />
            </div>
          </div>

          {/* Orders list */}
          {filteredOrders.length === 0 ? (
            <div className="card p-16 text-center">
              <span className="text-5xl block mb-4">📭</span>
              <h3 className="text-lg font-bold text-[var(--charcoal)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No orders found
              </h3>
              <p className="text-sm text-[var(--charcoal-muted)]">
                {filter === 'all' ? 'No orders have been placed yet.' : `No ${filter} orders.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const isUpdating = updateLoading === order.id;
                return (
                  <div key={order.id} className="card overflow-hidden">
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left */}
                      <div className="flex items-start gap-4">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-bold text-sm text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                              #{order.id.slice(-8).toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.badge}`}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--charcoal-muted)]">
                            {fmt(order.created_at)}
                            {order.shipping_address?.user_email && ` · ${order.shipping_address.user_email}`}
                          </p>
                          {order.payment_reference && (
                            <p className="text-xs text-[var(--charcoal-muted)] mt-0.5 font-mono">
                              Ref: {order.payment_reference}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        <span className="text-lg font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                          {fmtCurrency(order.total_amount)}
                        </span>

                        {/* Action buttons */}
                        <button
                          onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                          className="btn-ghost !text-xs !py-1.5 !px-3 border border-[var(--cream-dark)]"
                        >
                          Details
                        </button>

                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'confirmed')}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? <Spinner /> : '✓'} Confirm
                          </button>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped', 'Order shipped')}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? <Spinner /> : '🚚'} Ship
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered', 'Order delivered')}
                            disabled={isUpdating}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            {isUpdating ? <Spinner /> : '✅'} Delivered
                          </button>
                        )}
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'cancelled', 'Cancelled by admin')}
                            disabled={isUpdating}
                            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order items strip */}
                    <div className="px-5 pb-4 flex flex-wrap gap-2">
                      {order.order_items.map(item => (
                        <span key={item.id} className="inline-flex items-center gap-1.5 bg-[var(--cream)] border border-[var(--cream-dark)] rounded-lg px-2.5 py-1 text-xs text-[var(--charcoal-muted)]">
                          🌾 {item.product_id?.includes('25') ? '25KG' : item.product_id?.includes('10') ? '10KG' : '5KG'} × {item.quantity}
                          <span className="font-semibold text-[var(--charcoal)]">GH₵{(item.unit_price * item.quantity).toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedOrder(null); }}
          onStatusUpdate={(orderId, status, notes) => {
            updateOrderStatus(orderId, status, notes);
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          updateLoading={updateLoading === selectedOrder.id}
        />
      )}
    </div>
  );
}
