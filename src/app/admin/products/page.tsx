'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/lib/admin';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price: number | null;
  weight_kg: number;
  stock_qty: number;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const emptyForm = { name: '', description: '', price: '', sale_price: '', weight_kg: '', stock_qty: '0', image_url: '', is_active: true };

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdminUser(user.email))) {
      router.push('/admin/login');
      return;
    }
    if (user && isAdminUser(user.email)) fetchProducts();
  }, [user, authLoading, router]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
      else toast.error('Failed to load products');
    } catch {
      toast.error('Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      sale_price: p.sale_price ? String(p.sale_price) : '',
      weight_kg: String(p.weight_kg || ''),
      stock_qty: String(p.stock_qty || 0),
      image_url: p.image_url || '',
      is_active: p.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setSaving(true);
    try {
      const method = editProduct ? 'PATCH' : 'POST';
      const body = {
        ...(editProduct ? { id: editProduct.id } : {}),
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        stock_qty: parseInt(form.stock_qty) || 0,
        image_url: form.image_url,
        is_active: form.is_active,
      };
      const res = await fetch('/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editProduct ? 'Product updated' : 'Product created');
        setShowForm(false);
        fetchProducts();
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

  const toggleActive = async (p: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !p.is_active } : x));
        toast.success(p.is_active ? 'Product hidden' : 'Product visible');
      }
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted');
        setProducts(prev => prev.filter(p => p.id !== id));
        setDeleteConfirm(null);
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[var(--off-white)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-[3px] border-[var(--gold-muted)] border-t-[var(--gold)] rounded-full mx-auto" style={{ animation: 'spin 0.8s linear infinite' }} />
          <p className="mt-4 text-sm text-[var(--charcoal-muted)]">Loading products…</p>
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
            { label: 'Products', icon: '🌾', active: true, href: '/admin/products' },
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
              Products
            </h1>
            <p className="text-sm text-[var(--charcoal-muted)]">{products.length} product{products.length !== 1 ? 's' : ''} in catalogue</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--gold)] text-white text-sm font-semibold hover:bg-[var(--gold-dark)] transition-colors shadow-gold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </header>

        <div className="flex-1 p-6">
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[var(--cream-dark)] p-16 text-center">
              <span className="text-5xl block mb-4">🌾</span>
              <h3 className="text-xl font-bold text-[var(--charcoal)] mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                No products yet
              </h3>
              <p className="text-[var(--charcoal-muted)] text-sm mb-6">Add your first product to the catalogue.</p>
              <button onClick={openCreate} className="btn-primary">Add Product</button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[var(--cream-dark)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
                    {['Product', 'Price', 'Weight', 'Stock', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--cream-dark)]">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-[var(--cream)] transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--gold-muted)] flex items-center justify-center text-xl flex-shrink-0">
                            🌾
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--charcoal)]">{p.name}</p>
                            {p.description && (
                              <p className="text-xs text-[var(--charcoal-muted)] truncate max-w-[200px]">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {p.sale_price ? (
                          <div>
                            <span className="text-xs text-[var(--charcoal-muted)] line-through block">GH₵{Number(p.price).toFixed(2)}</span>
                            <span className="text-sm font-bold text-red-600">GH₵{Number(p.sale_price).toFixed(2)}</span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-[var(--charcoal)]">GH₵{Number(p.price).toFixed(2)}</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm text-[var(--charcoal-muted)]">{p.weight_kg ? `${p.weight_kg}kg` : '—'}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${p.stock_qty === 0 ? 'text-red-600' : p.stock_qty < 10 ? 'text-amber-600' : 'text-green-600'}`}>
                          {p.stock_qty}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActive(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                            p.is_active
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                              : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                          {p.is_active ? 'Active' : 'Hidden'}
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
                {editProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-[var(--cream)] transition-colors">
                <svg className="w-5 h-5 text-[var(--charcoal-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                  placeholder="e.g. PureGrain Rice 25kg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)] resize-none"
                  placeholder="Product description…"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Regular Price (GH₵) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.weight_kg}
                    onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                    placeholder="25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">
                  Sale Price (GH₵)
                  <span className="ml-1 text-red-500 font-normal normal-case">— leave blank to remove discount</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.sale_price}
                  onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-red-200 bg-red-50/40 text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                  placeholder="e.g. 100.00 (shows old price crossed out)"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={form.stock_qty}
                  onChange={e => setForm(f => ({ ...f, stock_qty: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-1.5">Image URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/30 focus:border-[var(--gold)]"
                  placeholder="https://…"
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
                  {form.is_active ? 'Active — visible in store' : 'Hidden — not visible in store'}
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
                {saving ? 'Saving…' : editProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
