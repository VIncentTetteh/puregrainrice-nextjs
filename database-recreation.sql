-- PurePlatter Database Recreation Script
-- This script drops all existing tables and recreates them with proper relationships
-- Run this in your Supabase SQL editor

-- ==========================================
-- DROP ALL EXISTING TABLES (in dependency order)
-- ==========================================

-- Drop tables that depend on others first
DROP TABLE IF EXISTS delivery_confirmations CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Drop any existing functions and triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_customer_stats() CASCADE;
DROP FUNCTION IF EXISTS generate_delivery_code() CASCADE;
DROP FUNCTION IF EXISTS is_admin(text) CASCADE;

-- ==========================================
-- CREATE HELPER FUNCTIONS
-- ==========================================

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
    -- Add your admin email addresses here
    RETURN user_email IN ('admin@pureplatter.com', 'vincent@pureplatter.com');
END;
$$ LANGUAGE plpgsql;

-- Function to generate delivery confirmation code
CREATE OR REPLACE FUNCTION generate_delivery_code()
RETURNS TEXT AS $$
BEGIN
    RETURN upper(substring(md5(random()::text) from 1 for 6));
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- CREATE CORE TABLES
-- ==========================================

-- Products table
CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    category TEXT DEFAULT 'rice',
    weight_kg DECIMAL(5,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table for enhanced user management
CREATE TABLE customers (
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
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cart items table (for persistent cart)
CREATE TABLE cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Orders table
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
    
    -- Customer details (stored for order history)
    user_email TEXT NOT NULL,
    user_full_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    
    -- Delivery information
    delivery_address TEXT NOT NULL,
    delivery_city TEXT NOT NULL,
    delivery_notes TEXT,
    
    -- Payment information
    payment_reference TEXT,
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Delivery tracking
    confirmed_delivery_at TIMESTAMP WITH TIME ZONE,
    delivery_confirmation_method TEXT CHECK (delivery_confirmation_method IN ('code', 'photo', 'signature')),
    
    -- Admin fields
    admin_notes TEXT,
    
    -- Legacy field for backward compatibility
    shipping_address JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table with product information stored for order history
CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Allow NULL for deleted products
    
    -- Store product information at time of order (for history)
    product_name TEXT NOT NULL,
    product_description TEXT,
    product_image_url TEXT,
    product_weight_kg DECIMAL(5,2),
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
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

-- Delivery confirmations table
CREATE TABLE delivery_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    confirmation_code TEXT UNIQUE NOT NULL,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmation_method TEXT CHECK (confirmation_method IN ('code', 'photo', 'signature')),
    confirmation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

-- Products indexes
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_price ON products(price);

-- Cart items indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Reviews indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_featured ON reviews(is_featured);

-- ==========================================
-- ENABLE ROW LEVEL SECURITY
-- ==========================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_confirmations ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- CREATE RLS POLICIES
-- ==========================================

-- Products - Public read access for active products
CREATE POLICY "Public products are viewable by everyone" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all products" ON products
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

-- Customers - Users can manage their own data
CREATE POLICY "Users can view own customer record" ON customers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own customer record" ON customers
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can manage all customers" ON customers
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

-- Cart items - Users can only see their own cart items
CREATE POLICY "Users can view own cart items" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);

-- Orders - Users can only see their own orders
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update all orders" ON orders
    FOR UPDATE USING (is_admin(auth.jwt() ->> 'email'));

-- Order items - Users can only see items from their own orders
CREATE POLICY "Users can view own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

-- Reviews - Anyone can read, users can manage their own
CREATE POLICY "Anyone can read published reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" ON reviews
    FOR ALL USING (is_admin(auth.jwt() ->> 'email'));

-- Delivery confirmations
CREATE POLICY "Users can view own delivery confirmations" ON delivery_confirmations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delivery confirmations" ON delivery_confirmations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all delivery confirmations" ON delivery_confirmations
    FOR SELECT USING (is_admin(auth.jwt() ->> 'email'));

-- ==========================================
-- CREATE TRIGGERS
-- ==========================================

-- Triggers for updated_at columns
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at 
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at 
    BEFORE UPDATE ON reviews
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

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

-- Insert sample products
INSERT INTO products (name, description, price, image_url, stock_quantity, category, weight_kg) VALUES
('Premium Long Grain Rice 1kg', 'Premium aromatic long grain rice from Ghana - 1kg pack', 12.00, '/images/rice-1kg.jpg', 200, 'rice', 1.0),
('Premium Long Grain Rice 2kg', 'Premium aromatic long grain rice from Ghana - 2kg pack', 20.00, '/images/rice-2kg.jpg', 150, 'rice', 2.0),
('Premium Long Grain Rice 5kg', 'Premium aromatic long grain rice from Ghana - 5kg pack', 45.00, '/images/rice-5kg.jpg', 100, 'rice', 5.0),
('Premium Long Grain Rice 10kg', 'Premium aromatic long grain rice from Ghana - 10kg pack', 85.00, '/images/rice-10kg.jpg', 50, 'rice', 10.0),
('Jasmine Rice 1kg', 'Fragrant jasmine rice - 1kg pack', 15.00, '/images/jasmine-1kg.jpg', 100, 'rice', 1.0),
('Jasmine Rice 2kg', 'Fragrant jasmine rice - 2kg pack', 28.00, '/images/jasmine-2kg.jpg', 75, 'rice', 2.0);

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Verify all tables were created
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('products', 'customers', 'cart_items', 'orders', 'order_items', 'reviews', 'delivery_confirmations')
ORDER BY table_name;

-- Verify foreign key relationships
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
ORDER BY tc.table_name, kcu.column_name;

-- Verify sample products were inserted
SELECT id, name, price, stock_quantity, is_active FROM products ORDER BY name;

-- ==========================================
-- SUCCESS MESSAGE
-- ==========================================

SELECT 
    'Database recreation completed successfully! All tables, relationships, policies, and sample data have been created.' AS status,
    (SELECT COUNT(*) FROM products) AS total_products,
    'Ready for application use' AS next_step;
