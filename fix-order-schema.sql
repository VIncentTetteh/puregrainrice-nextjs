-- Fix order creation issue by updating order_items table schema
-- This script addresses the product_id type mismatch

-- First, let's make order_items.product_id more flexible to handle both UUID and TEXT product IDs
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items ALTER COLUMN product_id TYPE TEXT;

-- Add a comment to clarify the change
COMMENT ON COLUMN order_items.product_id IS 'Product ID - can be UUID for products table or TEXT for external products';

-- Update the RLS policy for order_items to handle the new schema
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Check existing products structure
SELECT id, name FROM products LIMIT 5;
