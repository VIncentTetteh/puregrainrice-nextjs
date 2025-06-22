-- Complete fix for admin functionality
-- This script ensures all necessary tables, policies, and functions exist for admin access
-- Run this in your Supabase SQL editor

-- ==========================================
-- 1. ENSURE ADMIN FUNCTION EXISTS
-- ==========================================

-- Create or update the admin check function
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  -- Add your admin email addresses here
  RETURN user_email IN ('puregrainrice@gmail.com', 'vincentchrisbone@gmail.com', 'admin@pureplatter.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. ENSURE ALL REQUIRED TABLES EXIST
-- ==========================================

-- Update orders table to include all necessary fields for admin functionality
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_full_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Update order_items table to include product information for admin display
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_description TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_image_url TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_weight_kg DECIMAL(5,2);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);

-- Update existing customers table to include all necessary fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS preferred_delivery_city TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints if they don't exist (these will fail silently if they already exist)
DO $$
BEGIN
  -- Try to add primary key if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'customers' AND constraint_type = 'PRIMARY KEY') THEN
    ALTER TABLE customers ADD PRIMARY KEY (id);
  END IF;
  
  -- Try to add unique constraint on user_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'customers' AND constraint_name = 'customers_user_id_key') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_user_id_key UNIQUE (user_id);
  END IF;
  
  -- Try to add unique constraint on email if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                 WHERE table_name = 'customers' AND constraint_name = 'customers_email_key') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_email_key UNIQUE (email);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Constraints already exist, continue
    NULL;
END $$;

-- ==========================================
-- 3. UPDATE ROW LEVEL SECURITY POLICIES
-- ==========================================

-- Remove existing conflicting policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

-- Create comprehensive order policies
CREATE POLICY "Users and admins can view orders" ON orders
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    is_admin(auth.jwt() ->> 'email')
  );

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE 
  TO authenticated
  USING (is_admin(auth.jwt() ->> 'email'));

-- Create comprehensive order items policies
CREATE POLICY "Users and admins can view order items" ON order_items
  FOR SELECT 
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email') OR
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own order items" ON order_items
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Enable RLS on customers table if not already enabled
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create customers policies (drop all existing ones first)
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;
DROP POLICY IF EXISTS "Users can manage own customer record" ON customers;
DROP POLICY IF EXISTS "Admins can manage all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert own customer record" ON customers;
DROP POLICY IF EXISTS "Users can delete own customer record" ON customers;

-- Create new comprehensive policies
CREATE POLICY "Users can view own customer record" ON customers
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT 
  TO authenticated
  USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Users can manage own customer record" ON customers
  FOR ALL 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all customers" ON customers
  FOR ALL 
  TO authenticated
  USING (is_admin(auth.jwt() ->> 'email'))
  WITH CHECK (is_admin(auth.jwt() ->> 'email'));

-- ==========================================
-- 4. CREATE HELPER FUNCTIONS
-- ==========================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to customers table if it doesn't exist
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update customer stats when orders are created/updated
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer statistics when order is created or updated
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO customers (user_id, email, full_name, phone, total_orders, total_spent, last_order_date)
    VALUES (
      NEW.user_id,
      COALESCE(NEW.user_email, ''),
      COALESCE(NEW.user_full_name, ''),
      COALESCE(NEW.user_phone, ''),
      1,
      NEW.total_amount,
      NEW.created_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_orders = (
        SELECT COUNT(*) FROM orders 
        WHERE user_id = NEW.user_id AND status NOT IN ('cancelled')
      ),
      total_spent = (
        SELECT COALESCE(SUM(total_amount), 0) FROM orders 
        WHERE user_id = NEW.user_id AND status NOT IN ('cancelled')
      ),
      last_order_date = GREATEST(customers.last_order_date, NEW.created_at),
      email = COALESCE(NEW.user_email, customers.email),
      full_name = COALESCE(NEW.user_full_name, customers.full_name),
      phone = COALESCE(NEW.user_phone, customers.phone),
      updated_at = NOW();
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Add trigger for customer stats if it doesn't exist
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON orders;
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- ==========================================
-- 5. UPDATE EXISTING DATA
-- ==========================================

-- Update order_items to include missing product information where possible
UPDATE order_items 
SET 
  product_name = COALESCE(product_name, p.name),
  product_image_url = COALESCE(product_image_url, p.image_url),
  unit_price = COALESCE(unit_price, price)
FROM products p 
WHERE order_items.product_id::text = p.id::text
  AND order_items.product_id::text ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- For any remaining order_items without product info, set defaults
UPDATE order_items 
SET 
  product_name = COALESCE(product_name, 'Product'),
  unit_price = COALESCE(unit_price, price)
WHERE product_name IS NULL OR unit_price IS NULL;

-- ==========================================
-- 6. VERIFICATION QUERIES
-- ==========================================

-- Verify admin function works
SELECT is_admin('puregrainrice@gmail.com') as admin_test_1;
SELECT is_admin('test@example.com') as admin_test_2;

-- Verify table structure
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'order_items', 'customers')
ORDER BY table_name, ordinal_position;

-- Check existing orders structure
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN user_email IS NOT NULL THEN 1 END) as orders_with_email,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
FROM orders;

-- Check order_items structure
SELECT 
  COUNT(*) as total_order_items,
  COUNT(CASE WHEN product_name IS NOT NULL THEN 1 END) as items_with_product_name,
  COUNT(CASE WHEN unit_price IS NOT NULL THEN 1 END) as items_with_unit_price
FROM order_items;

-- Success message
SELECT 'Admin functionality fix completed successfully!' as status;
