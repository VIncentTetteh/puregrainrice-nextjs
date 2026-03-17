'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface Promotion {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number | null;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyForm = {
  code: '',
  description: '',
  discount_type: 'percentage' as 'percentage' | 'fixed',
  discount_value: '',
  min_order_amount: '',
  max_uses: '',
  expires_at: '',
  is_active: true,
};

export default function AdminPromotionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPromo, setEditPromo] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login');
      return;
    }
    if (user && isAdminUser(user.email)) fetchPromotions();
  }, [user, authLoading, router]);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promotions');
      const data = await res.json();
      if (res.ok) setPromotions(data.promotions || []);
      else toast.error('Failed to load promotions');
    } catch {
      toast.error('Error loading promotions');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditPromo(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Promotion) => {
    setEditPromo(p);
    setForm({
      code: p.code,
      description: p.description || '',
      discount_type: p.discount_type,
      discount_value: String(p.discount_value),
      min_order_amount: p.min_order_amount ? String(p.min_order_amount) : '',
      max_uses: p.max_uses ? String(p.max_uses) : '',
      expires_at: p.expires_at ? p.expires_at.slice(0, 16) : '',
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) { toast.error('Code and discount value are required'); return; }
    setSaving(true);
    try {
      const method = editPromo ? 'PATCH' : 'POST';
      const body = {
        ...(editPromo ? { id: editPromo.id } : {}),
        code: form.code,
        description: form.description,
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
        is_active: form.is_active,
      };
      const res = await fetch('/api/admin/promotions', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editPromo ? 'Promotion updated' : 'Promotion created');
        setShowForm(false);
        fetchPromotions();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Save failed');
      }
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: Promotion) => {
    try {
      const res = await fetch('/api/admin/promotions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
      });
      if (res.ok) {
        setPromotions(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
        toast.success(p.is_active ? 'Promotion disabled' : 'Promotion enabled');
      }
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Promotion deleted');
        setPromotions(prev => prev.filter(p => p.id !== id));
        setDeleteConfirm(null);
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  const formatDiscount = (p: Promotion) =>
    p.discount_type === 'percentage' ? `${p.discount_value}%` : `GH₵${Number(p.discount_value).toFixed(2)}`;

  const isExpired = (p: Promotion) => p.expires_at ? new Date(p.expires_at) < new Date() : false;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading promotions…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--off-white)] flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--charcoal)] flex-shrink-0">
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

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: 'Orders', icon: '📦', active: false, href: '/admin' },
            { label: 'Customers', icon: '👥', active: false, href: '/admin/customers' },
            { label: 'Products', icon: '🌾', active: false, href: '/admin/products' },
            { label: 'Promotions', icon: '🎟️', active: true, href: '/admin/promotions' },
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

        <div className="px-4 pb-6 border-t border-white/08 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/05">
            <div className="w-8 h-8 rounded-full bg-[var(--gold)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.email}</p>
              <p className="text-white/40 text-xs">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="bg-white border-b border-[var(--cream-dark)] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
              Promotions & Discounts
            </h1>
            <p className="text-sm text-[var(--charcoal-muted)]">{promotions.length} promo code{promotions.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:bg-[var(--gold-dark)] transition-colors shadow-gold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Promo Code
          </button>
        </header>

        <div className="flex-1 p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Codes', value: promotions.length, color: 'from-[var(--gold)] to-[var(--gold-dark)]', icon: '🎟️' },
              { label: 'Active', value: promotions.filter(p => p.is_active && !isExpired(p)).length, color: 'from-[var(--forest)] to-emerald-700', icon: '✅' },
              { label: 'Total Uses', value: promotions.reduce((s, p) => s + p.used_count, 0), color: 'from-blue-500 to-blue-700', icon: '📊' },
              { label: 'Expired', value: promotions.filter(isExpired).length, color: 'from-red-500 to-red-700', icon: '⏰' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-[var(--cream-dark)] p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl flex-shrink-0`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xl font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>{stat.value}</p>
                  <p className="text-xs text-[var(--charcoal-muted)] uppercase tracking-wider font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          {promotions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--cream-dark)] p-16 text-center">
              <span className="text-5xl block mb-4">🎟️</span>
              <h3 className="text-xl font-bold text-[var(--charcoal)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No promo codes yet
              </h3>
              <p className="text-[var(--charcoal-muted)] text-sm mb-6">Create discount codes to attract and reward customers.</p>
              <button onClick={openCreate} className="btn-primary">Create Promo Code</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
                    {['Code', 'Discount', 'Min Order', 'Usage', 'Expires', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cream-dark)]">
                  {promotions.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--cream)] transition-colors group">
                      <td className="px-5 py-4">
                        <div>
                          <code className="text-sm font-bold text-[var(--charcoal)] bg-[var(--cream)] px-2 py-0.5 rounded-lg tracking-wider">
                            {p.code}
                          </code>
                          {p.description && (
                            <p className="text-xs text-[var(--charcoal-muted)] mt-1 truncate max-w-[160px]">{p.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-[var(--gold-dark)]">{formatDiscount(p)}</span>
                        <span className="text-xs text-[var(--charcoal-muted)] ml-1">off</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-[var(--charcoal-muted)]">
                          {p.min_order_amount ? `GH₵${Number(p.min_order_amount).toFixed(0)}` : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-[var(--charcoal)]">
                          {p.used_count}{p.max_uses ? `/${p.max_uses}` : ''}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {p.expires_at ? (
                          <span className={`text-xs ${isExpired(p) ? 'text-red-500 font-medium' : 'text-[var(--charcoal-muted)]'}`}>
                            {new Date(p.expires_at).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--charcoal-muted)]">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            p.is_active && !isExpired(p)
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : isExpired(p)
                                ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-default'
                                : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_active && !isExpired(p) ? 'bg-green-500' : isExpired(p) ? 'bg-gray-400' : 'bg-red-400'}`} />
                          {isExpired(p) ? 'Expired' : p.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1.5 rounded-lg text-[var(--charcoal-muted)] hover:bg-[var(--cream-dark)] hover:text-[var(--charcoal)] transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {deleteConfirm === p.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 rounded-lg bg-[var(--cream-dark)] text-[var(--charcoal)] text-xs font-semibold transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(p.id)}
                              className="p-1.5 rounded-lg text-[var(--charcoal-muted)] hover:bg-red-50 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-[var(--cream-dark)] flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                {editPromo ? 'Edit Promo Code' : 'New Promo Code'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-[var(--cream)] transition-colors">
                <svg className="w-5 h-5 text-[var(--charcoal-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Promo Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase().replace(/\s+/g, '') }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm font-mono font-bold text-[var(--charcoal)] uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                  placeholder="e.g. SUMMER20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                  placeholder="e.g. 20% off all orders this summer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Discount Type *</label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as 'percentage' | 'fixed' }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GH₵)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">
                    {form.discount_type === 'percentage' ? 'Discount (%) *' : 'Discount (GH₵) *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.discount_type === 'percentage' ? 100 : undefined}
                    step={form.discount_type === 'percentage' ? '1' : '0.01'}
                    value={form.discount_value}
                    onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                    placeholder={form.discount_type === 'percentage' ? '20' : '50.00'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Min Order (GH₵)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.min_order_amount}
                    onChange={e => setForm(f => ({ ...f, min_order_amount: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                    placeholder="No minimum"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Max Uses</label>
                  <input
                    type="number"
                    min="0"
                    value={form.max_uses}
                    onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                    placeholder="Unlimited"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Expires At</label>
                <input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-10 h-6 rounded-full transition-colors ${form.is_active ? 'bg-[var(--gold)]' : 'bg-[var(--cream-dark)]'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-4' : ''}`} />
                </button>
                <span className="text-sm text-[var(--charcoal)]">
                  {form.is_active ? 'Active — customers can use this code' : 'Disabled — code cannot be used'}
                </span>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm font-medium text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:bg-[var(--gold-dark)] transition-colors shadow-gold disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" style={{ animation: 'spin 0.8s linear infinite' }} />
                ) : null}
                {saving ? 'Saving…' : editPromo ? 'Save Changes' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
