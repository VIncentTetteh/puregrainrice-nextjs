import { ShippingAddress } from "./ShippingAddress"

export interface Order {
  id: string
  total_amount: number
  status: string
  created_at: string
  updated_at?: string
  // flat columns (available when fetching with *)
  user_email?: string
  user_full_name?: string
  user_phone?: string
  delivery_address?: string
  delivery_city?: string
  delivery_notes?: string
  payment_status?: string
  // JSONB shipping_address column
  shipping_address: ShippingAddress
  payment_reference: string
  admin_notes?: string
  tracking_number?: string
  order_items: {
    id: string
    quantity: number
    unit_price: number
    total_price?: number
    product_id: string
    product_weight_kg?: string
  }[]
}
