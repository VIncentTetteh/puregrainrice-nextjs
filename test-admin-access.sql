-- Quick verification script to test admin functionality
-- Run this to verify that the admin interface will work properly

-- ==========================================
-- 1. TEST ADMIN FUNCTION
-- ==========================================

-- Test admin function
SELECT 
  'Testing admin function...' as test,
  is_admin('puregrainrice@gmail.com') as puregrainrice_admin,
  is_admin('vincentchrisbone@gmail.com') as vincent_admin,
  is_admin('test@example.com') as non_admin;

-- ==========================================
-- 2. CHECK TABLE STRUCTURE
-- ==========================================

-- Check orders table columns
SELECT 'Orders table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check order_items table columns
SELECT 'Order items table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check customers table exists
SELECT 'Customers table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- ==========================================
-- 3. CHECK RLS POLICIES
-- ==========================================

-- Check RLS policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'customers')
ORDER BY tablename, policyname;

-- ==========================================
-- 4. CHECK DATA INTEGRITY
-- ==========================================

-- Check orders data
SELECT 
  'Orders data check:' as info,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as orders_with_email,
  COUNT(CASE WHEN shipping_address IS NOT NULL THEN 1 END) as orders_with_shipping,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
  COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders;

-- Check order_items data
SELECT 
  'Order items data check:' as info,
  COUNT(*) as total_items,
  COUNT(CASE WHEN product_name IS NOT NULL THEN 1 END) as items_with_names,
  COUNT(CASE WHEN unit_price IS NOT NULL THEN 1 END) as items_with_unit_price,
  COUNT(CASE WHEN total_price IS NOT NULL THEN 1 END) as items_with_total_price;

-- Check customers data
SELECT 
  'Customers data check:' as info,
  COUNT(*) as total_customers,
  COUNT(CASE WHEN total_orders > 0 THEN 1 END) as active_customers,
  ROUND(AVG(total_spent), 2) as avg_spent;

-- ==========================================
-- 5. SAMPLE QUERY TEST
-- ==========================================

-- Test the exact query that admin interface uses
SELECT 
  'Sample admin query test:' as info;

-- This should work for the admin orders view
SELECT 
  o.id,
  o.status,
  o.total_amount,
  o.created_at,
  o.user_email,
  o.user_full_name,
  o.shipping_address,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.status, o.total_amount, o.created_at, o.user_email, o.user_full_name, o.shipping_address
ORDER BY o.created_at DESC
LIMIT 3;

-- This should work for admin customers view  
SELECT 
  c.id,
  c.email,
  c.full_name,
  c.total_orders,
  c.total_spent,
  c.last_order_date
FROM customers c
ORDER BY c.last_order_date DESC NULLS LAST
LIMIT 3;

-- ==========================================
-- 6. FINAL STATUS
-- ==========================================

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_email')
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_name')
    AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers')
    AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname LIKE '%admin%')
    THEN '✅ Admin functionality should work properly!'
    ELSE '❌ Some issues remain - check the output above'
  END as final_status;
