'use client'

import { useState } from 'react'

interface ShippingAddress {
  user_email?: string
  user_full_name?: string
  fullName?: string
  user_phone?: string
  phone?: string
  whatsappNumber?: string
  delivery_address?: string
  address?: string
  delivery_city?: string
  city?: string
  delivery_notes?: string
  notes?: string
  [key: string]: unknown
}

interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  shipping_address: ShippingAddress
  payment_reference: string
  admin_notes?: string
  // flat columns
  user_email?: string
  user_full_name?: string
  user_phone?: string
  delivery_address?: string
  delivery_city?: string
  delivery_notes?: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    product_id: string
    product_weight_kg?: string
  }[]
}

interface OrderDetailModalProps {
  order: Order
  isOpen: boolean
  onClose: () => void
  onStatusUpdate: (orderId: string, status: string, notes?: string, trackingNumber?: string) => void
  updateLoading: boolean
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  pending:   { label: 'Pending',    badge: 'bg-amber-50 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
  confirmed: { label: 'Confirmed',  badge: 'bg-blue-50 text-blue-700 border-blue-200',      dot: 'bg-blue-400' },
  processing:{ label: 'Processing', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',dot: 'bg-indigo-400' },
  shipped:   { label: 'Shipped',    badge: 'bg-purple-50 text-purple-700 border-purple-200',dot: 'bg-purple-400' },
  delivered: { label: 'Delivered',  badge: 'bg-green-50 text-green-700 border-green-200',   dot: 'bg-green-400' },
  cancelled: { label: 'Cancelled',  badge: 'bg-red-50 text-red-700 border-red-200',         dot: 'bg-red-400' },
}

export default function OrderDetailModal({
  order, isOpen, onClose, onStatusUpdate, updateLoading,
}: OrderDetailModalProps) {
  const [notes, setNotes] = useState(order.admin_notes || '')
  const [trackingNumber, setTrackingNumber] = useState('')

  if (!isOpen) return null

  // Resolve fields from flat columns first, then fall back to shipping_address JSON
  const sa = order.shipping_address || {}
  const customerEmail    = order.user_email    || (sa.user_email as string)    || ''
  const customerName     = order.user_full_name|| (sa.user_full_name as string)|| (sa.fullName as string) || ''
  const customerPhone    = order.user_phone    || (sa.user_phone as string)    || (sa.phone as string)    || ''
  const whatsappNum      = (sa.whatsappNumber as string) || customerPhone
  const deliveryAddress  = order.delivery_address || (sa.delivery_address as string) || (sa.address as string) || ''
  const deliveryCity     = order.delivery_city    || (sa.delivery_city as string)    || (sa.city as string)    || ''
  const deliveryNotes    = order.delivery_notes   || (sa.delivery_notes as string)   || (sa.notes as string)   || ''

  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const whatsappLink = (num: string, orderId: string) => {
    const clean = num.replace(/[^0-9+]/g, '').replace(/^\+/, '')
    const msg = encodeURIComponent(`Hello! This is PureGrain Rice regarding your order #${orderId.slice(-8).toUpperCase()}. How can we assist you?`)
    return `https://wa.me/${clean}?text=${msg}`
  }

  const handleStatusUpdate = (newStatus: string) => {
    onStatusUpdate(order.id, newStatus, notes || undefined, trackingNumber || undefined)
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

        {/* Gold strip */}
        <div className="h-1 bg-gradient-to-r from-[var(--gold-dark)] via-[var(--gold)] to-[var(--gold-dark)]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--cream-dark)] bg-[var(--off-white)]">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
            <div>
              <h2 className="text-base font-bold text-[var(--charcoal)]" style={{ fontFamily: 'var(--font-display)' }}>
                Order #{order.id.slice(-8).toUpperCase()}
              </h2>
              <p className="text-xs text-[var(--charcoal-muted)]">{fmt(order.created_at)}</p>
            </div>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.badge}`}>
              {cfg.label}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-[var(--cream-dark)] flex items-center justify-center text-[var(--charcoal-muted)] hover:bg-[var(--cream)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT: Order items + payment */}
            <div className="space-y-5">

              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-3">
                  Order Items
                </p>
                <div className="space-y-3">
                  {order.order_items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3.5 rounded-2xl bg-[var(--cream)] border border-[var(--cream-dark)]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white text-base flex-shrink-0">
                        🌾
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--charcoal)]">
                          PureGrain Rice {item.product_weight_kg || (
                            item.product_id?.includes('25') ? '25KG' :
                            item.product_id?.includes('10') ? '10KG' : '5KG'
                          )}
                        </p>
                        <p className="text-xs text-[var(--charcoal-muted)]">
                          Qty {item.quantity} × GH₵{item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[var(--charcoal)] flex-shrink-0">
                        GH₵{(item.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-2xl bg-[var(--charcoal)] text-white">
                  <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Order Total</span>
                  <span className="text-lg font-bold text-[var(--gold)]" style={{ fontFamily: 'var(--font-display)' }}>
                    GH₵{order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Payment reference */}
              {order.payment_reference && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--cream)] border border-[var(--cream-dark)]">
                  <svg className="w-4 h-4 text-[var(--gold-dark)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-xs text-[var(--charcoal-muted)]">Payment Reference</p>
                    <p className="text-xs font-mono font-semibold text-[var(--charcoal)]">{order.payment_reference}</p>
                  </div>
                </div>
              )}

              {/* Delivery address */}
              {(deliveryAddress || deliveryCity) && (
                <div className="p-4 rounded-2xl bg-[var(--cream)] border border-[var(--cream-dark)]">
                  <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                    Delivery Address
                  </p>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-[var(--gold)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      {deliveryAddress && <p className="text-sm text-[var(--charcoal)]">{deliveryAddress}</p>}
                      {deliveryCity && <p className="text-sm text-[var(--charcoal-muted)]">{deliveryCity}</p>}
                      {deliveryNotes && (
                        <p className="text-xs text-[var(--charcoal-muted)] mt-1 italic">Note: {deliveryNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Customer info + admin actions */}
            <div className="space-y-5">

              {/* Customer info */}
              <div className="p-4 rounded-2xl border border-[var(--cream-dark)] bg-[var(--off-white)]">
                <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-3">
                  Customer
                </p>

                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold-dark)] to-[var(--gold)] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(customerName || customerEmail)?.[0]?.toUpperCase() || 'C'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--charcoal)]">{customerName || 'Customer'}</p>
                    <p className="text-xs text-[var(--charcoal-muted)]">{customerEmail}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  {customerPhone && (
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-[var(--charcoal-muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className="text-[var(--charcoal)]">{customerPhone}</span>
                    </div>
                  )}
                </div>

                {/* Contact buttons */}
                <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--cream-dark)]">
                  {customerEmail && (
                    <a
                      href={`mailto:${customerEmail}?subject=Order %23${order.id.slice(-8).toUpperCase()} Update`}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--cream-dark)] text-xs font-semibold text-[var(--charcoal-muted)] hover:border-[var(--gold)] hover:text-[var(--gold-dark)] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email
                    </a>
                  )}
                  {whatsappNum && (
                    <a
                      href={whatsappLink(whatsappNum, order.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--forest)] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.097" />
                      </svg>
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                  Admin Notes
                </p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes for this order…"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--cream-dark)] text-sm text-[var(--charcoal)] bg-[var(--off-white)] resize-none outline-none focus:ring-2 focus:ring-[var(--gold-muted)] focus:border-[var(--gold)] placeholder:text-[var(--charcoal-muted)]/50 transition-all"
                />
              </div>

              {/* Tracking number (show when shipping) */}
              {order.status === 'confirmed' && (
                <div>
                  <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-2">
                    Tracking Number <span className="text-[var(--charcoal-muted)] font-normal normal-case">(optional)</span>
                  </p>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. GH1234567890"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--cream-dark)] text-sm font-mono text-[var(--charcoal)] bg-[var(--off-white)] outline-none focus:ring-2 focus:ring-[var(--gold-muted)] focus:border-[var(--gold)] placeholder:text-[var(--charcoal-muted)]/50 transition-all"
                  />
                </div>
              )}

              {/* Status Actions */}
              <div>
                <p className="text-xs font-semibold text-[var(--charcoal-muted)] uppercase tracking-wider mb-3">
                  Update Status
                </p>
                <div className="space-y-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('confirmed')}
                        disabled={updateLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {updateLoading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        Confirm Order
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('cancelled')}
                        disabled={updateLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Order
                      </button>
                    </>
                  )}

                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusUpdate('shipped')}
                      disabled={updateLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {updateLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      )}
                      Mark as Shipped {trackingNumber && `(${trackingNumber})`}
                    </button>
                  )}

                  {order.status === 'shipped' && (
                    <button
                      onClick={() => handleStatusUpdate('delivered')}
                      disabled={updateLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[var(--forest)] to-emerald-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {updateLoading ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      Mark as Delivered
                    </button>
                  )}

                  {order.status === 'delivered' && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border border-green-200">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700 text-sm font-semibold">Order Completed</span>
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 border border-red-200">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-red-700 text-sm font-semibold">Order Cancelled</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
