-- Data migration script to ensure existing orders work with admin interface
-- Run this after the admin-fix-complete.sql script

-- ==========================================
-- 1. FIX ORDER_ITEMS PRODUCT REFERENCES
-- ==========================================

-- First, let's see what we have in order_items
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN product_name IS NOT NULL THEN 1 END) as items_with_name,
  COUNT(CASE WHEN product_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 1 END) as uuid_product_ids
FROM order_items;

-- Update order_items to populate missing product information from products table
-- This handles cases where product_id is a valid UUID
UPDATE order_items 
SET 
  product_name = COALESCE(order_items.product_name, products.name),
  product_description = COALESCE(order_items.product_description, products.description),
  product_image_url = COALESCE(order_items.product_image_url, products.image_url),
  unit_price = COALESCE(order_items.unit_price, order_items.price, products.price),
  total_price = COALESCE(order_items.total_price, order_items.price * order_items.quantity)
FROM products 
WHERE order_items.product_id::text = products.id::text
  AND order_items.product_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- For order_items that don't have valid product references, create reasonable defaults
UPDATE order_items 
SET 
  product_name = COALESCE(product_name, 'Rice Product'),
  product_description = COALESCE(product_description, 'Premium rice product'),
  product_image_url = COALESCE(product_image_url, '/rice-default.jpg'),
  unit_price = COALESCE(unit_price, price),
  total_price = COALESCE(total_price, price * quantity)
WHERE product_name IS NULL OR unit_price IS NULL OR total_price IS NULL;

-- ==========================================
-- 2. POPULATE MISSING ORDER USER INFORMATION
-- ==========================================

-- Update orders to populate user information from shipping_address JSON
UPDATE orders 
SET 
  user_email = COALESCE(user_email, shipping_address->>'email'),
  user_full_name = COALESCE(user_full_name, shipping_address->>'full_name', shipping_address->>'name'),
  user_phone = COALESCE(user_phone, shipping_address->>'phone'),
  delivery_address = COALESCE(delivery_address, shipping_address->>'address'),
  delivery_city = COALESCE(delivery_city, shipping_address->>'city')
WHERE shipping_address IS NOT NULL
  AND (user_email IS NULL OR user_full_name IS NULL OR user_phone IS NULL);

-- For orders that still don't have user email, try to get it from auth.users
UPDATE orders 
SET 
  user_email = COALESCE(orders.user_email, users.email),
  user_full_name = COALESCE(orders.user_full_name, users.raw_user_meta_data->>'full_name', 'Customer')
FROM auth.users 
WHERE orders.user_id = users.id
  AND orders.user_email IS NULL;

-- ==========================================
-- 3. CREATE CUSTOMER RECORDS FOR EXISTING ORDERS
-- ==========================================

-- Insert customer records for users who have placed orders but don't have customer records
INSERT INTO customers (user_id, email, full_name, phone, total_orders, total_spent, last_order_date, created_at)
SELECT 
  o.user_id,
  COALESCE(o.user_email, u.email, 'unknown@example.com'),
  COALESCE(o.user_full_name, u.raw_user_meta_data->>'full_name', 'Customer'),
  o.user_phone,
  COUNT(*) as total_orders,
  SUM(o.total_amount) as total_spent,
  MAX(o.created_at) as last_order_date,
  MIN(o.created_at) as created_at
FROM orders o
LEFT JOIN auth.users u ON o.user_id = u.id
LEFT JOIN customers c ON o.user_id = c.user_id
WHERE c.user_id IS NULL
  AND o.status NOT IN ('cancelled')
GROUP BY o.user_id, o.user_email, o.user_full_name, o.user_phone, u.email, u.raw_user_meta_data->>'full_name'
ON CONFLICT (user_id) DO UPDATE SET
  total_orders = EXCLUDED.total_orders,
  total_spent = EXCLUDED.total_spent,
  last_order_date = EXCLUDED.last_order_date,
  email = COALESCE(customers.email, EXCLUDED.email),
  full_name = COALESCE(customers.full_name, EXCLUDED.full_name),
  phone = COALESCE(customers.phone, EXCLUDED.phone);

-- ==========================================
-- 4. VERIFICATION AND CLEANUP
-- ==========================================

-- Check that all orders now have the necessary fields for admin interface
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as orders_with_email,
  COUNT(CASE WHEN shipping_address IS NOT NULL THEN 1 END) as orders_with_shipping_address,
  COUNT(CASE WHEN status IN ('pending', 'confirmed', 'shipped', 'delivered') THEN 1 END) as active_orders
FROM orders;

-- Check that all order_items have the necessary fields
SELECT 
  COUNT(*) as total_order_items,
  COUNT(CASE WHEN product_name IS NOT NULL THEN 1 END) as items_with_product_name,
  COUNT(CASE WHEN unit_price IS NOT NULL THEN 1 END) as items_with_unit_price,
  COUNT(CASE WHEN total_price IS NOT NULL THEN 1 END) as items_with_total_price
FROM order_items;

-- Check customer records
SELECT 
  COUNT(*) as total_customers,
  COUNT(CASE WHEN total_orders > 0 THEN 1 END) as customers_with_orders,
  SUM(total_orders) as sum_total_orders,
  SUM(total_spent) as sum_total_spent
FROM customers;

-- Sample data for verification
SELECT 
  o.id,
  o.user_email,
  o.user_full_name,
  o.status,
  o.total_amount,
  o.created_at,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.user_email, o.user_full_name, o.status, o.total_amount, o.created_at
ORDER BY o.created_at DESC
LIMIT 5;

-- Success message
SELECT 'Data migration completed successfully! Admin interface should now work properly.' as status;
