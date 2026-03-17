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

interface SaleCustomer { id: string; email: string; full_name: string; phone: string; whatsapp_number: string; preferred_delivery_city: string }
interface SaleProduct  { id: string; name: string; price: number; sale_price: number | null; weight_kg: number; is_active: boolean }
interface SaleItem     { product_id: string; weight_kg: string; quantity: number; unit_price: number }

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

  // In-person sale state
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [customers, setCustomers] = useState<SaleCustomer[]>([]);
  const [products, setProducts] = useState<SaleProduct[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SaleCustomer | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([{ product_id: '', weight_kg: '', quantity: 1, unit_price: 0 }]);
  const [saleNotes, setSaleNotes] = useState('');
  const [saleSubmitting, setSaleSubmitting] = useState(false);

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

  const updateOrderStatus = async (orderId: string, newStatus: string, notes?: string, trackingNumber?: string) => {
    setUpdateLoading(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, notes, trackingNumber }),
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

  const openSaleModal = async () => {
    setShowSaleModal(true);
    setSaleItems([{ product_id: '', weight_kg: '', quantity: 1, unit_price: 0 }]);
    setSelectedCustomer(null);
    setCustomerSearch('');
    setManualName('');
    setManualPhone('');
    setSaleNotes('');
    const [custRes, prodRes] = await Promise.all([
      fetch('/api/admin/customers'),
      fetch('/api/admin/products'),
    ]);
    if (custRes.ok) { const d = await custRes.json(); setCustomers(d.customers || []); }
    if (prodRes.ok) { const d = await prodRes.json(); setProducts((d.products || []).filter((p: SaleProduct) => p.is_active !== false)); }
  };

  const handleSaleProductSelect = (index: number, productId: string, prods: SaleProduct[]) => {
    const product = prods.find(p => p.id === productId);
    setSaleItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        product_id: productId,
        weight_kg: product ? `${product.weight_kg}KG` : '',
        unit_price: product ? (product.sale_price ?? product.price) : 0,
      } : item
    ));
  };

  const handleSubmitSale = async () => {
    if (saleItems.some(i => !i.product_id)) { toast.error('Select a product for each item'); return; }
    const total = saleItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    if (total === 0) { toast.error('Total amount must be greater than 0'); return; }
    setSaleSubmitting(true);
    try {
      const res = await fetch('/api/admin/in-person-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: selectedCustomer?.id || null,
          customer_name: selectedCustomer?.full_name || manualName || null,
          customer_email: selectedCustomer?.email || null,
          customer_phone: selectedCustomer?.phone || selectedCustomer?.whatsapp_number || manualPhone || null,
          delivery_city: selectedCustomer?.preferred_delivery_city || null,
          items: saleItems,
          total_amount: total,
          notes: saleNotes,
        }),
      });
      if (res.ok) {
        toast.success('In-person sale recorded!');
        setShowSaleModal(false);
        fetchOrders();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Failed to record sale');
      }
    } catch {
      toast.error('Error recording sale');
    } finally {
      setSaleSubmitting(false);
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
        o.user_email?.toLowerCase().includes(q) ||
        o.user_full_name?.toLowerCase().includes(q) ||
        o.shipping_address?.user_email?.toLowerCase().includes(q) ||
        o.payment_reference?.toLowerCase().includes(q) ||
        o.delivery_city?.toLowerCase().includes(q)
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
            { label: 'Products', icon: '🌾', active: false, href: '/admin/products' },
            { label: 'Promotions', icon: '🎟️', active: false, href: '/admin/promotions' },
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
            <button
              onClick={openSaleModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-gold"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Record Sale
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
                            {(order.user_email || order.shipping_address?.user_email) && ` · ${order.user_email || order.shipping_address?.user_email}`}
                          </p>
                          {(order.user_full_name) && (
                            <p className="text-xs text-[var(--charcoal-muted)] mt-0.5">
                              {order.user_full_name}{order.delivery_city ? ` · ${order.delivery_city}` : ''}
                            </p>
                          )}
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
                          🌾 {item.product_weight_kg || (item.product_id?.includes('25') ? '25KG' : item.product_id?.includes('10') ? '10KG' : '5KG')} × {item.quantity}
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

      {/* In-Person Sale Modal */}
      {showSaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--cream-dark)] flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>Record In-Person Sale</h2>
              <button onClick={() => setShowSaleModal(false)} className="w-8 h-8 rounded-full hover:bg-[var(--cream)] flex items-center justify-center text-[var(--charcoal-muted)] transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-5">

              {/* Customer */}
              <div>
                <label className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Customer</label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[var(--cream)] border border-[var(--gold)]/40">
                    <div>
                      <p className="text-sm font-semibold text-[var(--charcoal)]">{selectedCustomer.full_name || selectedCustomer.email}</p>
                      <p className="text-xs text-[var(--charcoal-muted)]">{selectedCustomer.email} · {selectedCustomer.phone || selectedCustomer.whatsapp_number || '—'}</p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="text-xs text-[var(--charcoal-muted)] hover:text-red-500 transition-colors">Change</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      placeholder="Search existing customers…"
                      className="w-full px-4 py-2.5 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] placeholder:text-[var(--charcoal-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                    />
                    {customerSearch.length >= 2 && (
                      <div className="border border-[var(--cream-dark)] rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                        {customers
                          .filter(c =>
                            c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            c.phone?.includes(customerSearch)
                          )
                          .slice(0, 6)
                          .map(c => (
                            <button
                              key={c.id}
                              onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--cream)] text-left transition-colors border-b border-[var(--cream-dark)] last:border-0"
                            >
                              <div className="w-7 h-7 rounded-full bg-[var(--gold-muted)] flex items-center justify-center text-xs font-bold text-[var(--gold-dark)] flex-shrink-0">
                                {(c.full_name || c.email)?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-[var(--charcoal)]">{c.full_name || c.email}</p>
                                <p className="text-xs text-[var(--charcoal-muted)]">{c.phone || c.email}</p>
                              </div>
                            </button>
                          ))
                        }
                        {customers.filter(c =>
                          c.full_name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          c.phone?.includes(customerSearch)
                        ).length === 0 && (
                          <p className="px-4 py-3 text-sm text-[var(--charcoal-muted)]">No customers found</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-[var(--charcoal-muted)]">Or enter walk-in customer details:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={manualName}
                        onChange={e => setManualName(e.target.value)}
                        placeholder="Name (optional)"
                        className="px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                      />
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={e => setManualPhone(e.target.value)}
                        placeholder="Phone (optional)"
                        className="px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-[var(--charcoal)]">Items Sold</label>
                  <button
                    onClick={() => setSaleItems(prev => [...prev, { product_id: '', weight_kg: '', quantity: 1, unit_price: 0 }])}
                    className="text-xs text-[var(--gold-dark)] font-semibold hover:text-[var(--gold)] transition-colors"
                  >+ Add Item</button>
                </div>
                <div className="space-y-2">
                  {saleItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        value={item.product_id}
                        onChange={e => handleSaleProductSelect(index, e.target.value, products)}
                        className="flex-1 px-3 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                      >
                        <option value="">Select product…</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} {p.weight_kg}KG — GH₵{p.sale_price ?? p.price}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={e => setSaleItems(prev => prev.map((it, i) => i === index ? { ...it, quantity: Math.max(1, Number(e.target.value)) } : it))}
                        className="w-16 px-2 py-2 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                      />
                      <span className="text-sm font-semibold text-[var(--charcoal)] w-20 text-right flex-shrink-0">
                        GH₵{(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                      {saleItems.length > 1 && (
                        <button onClick={() => setSaleItems(prev => prev.filter((_, i) => i !== index))} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-red-400 flex-shrink-0 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-[var(--cream)] rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--charcoal)]">Total Amount</span>
                <span className="text-xl font-bold text-[var(--gold-dark)]" style={{ fontFamily: 'var(--font-display)' }}>
                  GH₵{saleItems.reduce((s, i) => s + i.unit_price * i.quantity, 0).toFixed(2)}
                </span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-[var(--charcoal)] mb-2">Notes (optional)</label>
                <textarea
                  value={saleNotes}
                  onChange={e => setSaleNotes(e.target.value)}
                  placeholder="e.g. Cash paid at Taifa branch…"
                  rows={2}
                  className="w-full px-4 py-3 text-sm rounded-xl border border-[var(--cream-dark)] bg-[var(--cream)] text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)] resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={() => setShowSaleModal(false)} className="flex-1 py-3 rounded-xl border border-[var(--cream-dark)] text-sm font-semibold text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={handleSubmitSale}
                  disabled={saleSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-gold"
                >
                  {saleSubmitting ? 'Recording…' : `Record Sale · GH₵${saleItems.reduce((s, i) => s + i.unit_price * i.quantity, 0).toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedOrder(null); }}
          onStatusUpdate={(orderId, status, notes, trackingNumber) => {
            updateOrderStatus(orderId, status, notes, trackingNumber);
            setIsModalOpen(false);
            setSelectedOrder(null);
          }}
          updateLoading={updateLoading === selectedOrder.id}
        />
      )}
    </div>
  );
}
