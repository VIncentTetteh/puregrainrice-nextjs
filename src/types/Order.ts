import { ShippingAddress } from "./ShippingAddress"

export interface Order {
 id: string
 total_amount: number
 status: string
 created_at: string
 shipping_address: ShippingAddress
 payment_reference: string
 admin_notes?: string
 order_items: {
   id: string
   quantity: number
   unit_price: number
   product_id: string
   product_weight_kg: string
 }[],
 
}
 
