export interface ShippingAddress {
  user_email?: string
  user_full_name?: string
  user_phone?: string
  delivery_address?: string
  delivery_city?: string
  delivery_notes?: string
  payment_reference?: string
  [key: string]: unknown
}