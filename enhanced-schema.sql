-- Enhanced database schema with delivery details and reviews
-- Run this in your Supabase SQL editor

-- Update orders table to include user details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_full_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmed_delivery_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_confirmation_method TEXT;

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  admin_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, order_id, product_id)
);

-- Create customers table for admin management
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  preferred_delivery_city TEXT,
  delivery_address TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  last_order_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create delivery confirmations table
CREATE TABLE IF NOT EXISTS delivery_confirmations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  confirmation_code TEXT UNIQUE NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  confirmation_method TEXT CHECK (confirmation_method IN ('code', 'photo', 'signature')),
  confirmation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews
CREATE POLICY "Anyone can read published reviews" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all reviews" ON reviews
  FOR UPDATE USING (is_admin(auth.jwt() ->> 'email'));

-- RLS Policies for customers
CREATE POLICY "Users can view own customer record" ON customers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers" ON customers
  FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Users can update own customer record" ON customers
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all customers" ON customers
  FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

-- RLS Policies for delivery confirmations
CREATE POLICY "Users can view own delivery confirmations" ON delivery_confirmations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delivery confirmations" ON delivery_confirmations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all delivery confirmations" ON delivery_confirmations
  FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

-- Triggers for updated_at
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update customer stats
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer statistics when order is created or updated
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    INSERT INTO customers (user_id, email, full_name, phone, total_orders, total_spent, last_order_date)
    VALUES (
      NEW.user_id,
      NEW.user_email,
      NEW.user_full_name,
      NEW.user_phone,
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

-- Trigger to update customer stats
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function to generate delivery confirmation code
CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;
