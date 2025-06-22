-- Verify current database schema
-- Run this in your Supabase SQL editor to check if tables exist with correct structure

-- Check if all required tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('products', 'customers', 'cart_items', 'orders', 'order_items', 'reviews', 'delivery_confirmations')
ORDER BY table_name;

-- Check orders table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'orders'
ORDER BY ordinal_position;

-- Check order_items table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'order_items'
ORDER BY ordinal_position;

-- Check for foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('orders', 'order_items')
ORDER BY tc.table_name, kcu.column_name;

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
