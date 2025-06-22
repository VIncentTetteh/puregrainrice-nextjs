-- Admin policies for order management
-- Run this in your Supabase SQL editor to add admin access to orders

-- Create a function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN user_email IN ('puregrainrice@gmail.com', 'vincentchrisbone@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT 
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email') OR 
    auth.uid() = user_id
  );

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE 
  TO authenticated
  USING (
    is_admin(auth.jwt() ->> 'email') OR 
    auth.uid() = user_id
  );

-- Admin policies for order items
CREATE POLICY "Admins can view all order items" ON order_items
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

-- Admin policies for products (allow admins to manage products)
CREATE POLICY "Admins can insert products" ON products
  FOR INSERT 
  TO authenticated
  WITH CHECK (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can update products" ON products
  FOR UPDATE 
  TO authenticated
  USING (is_admin(auth.jwt() ->> 'email'));

CREATE POLICY "Admins can delete products" ON products
  FOR DELETE 
  TO authenticated
  USING (is_admin(auth.jwt() ->> 'email'));
