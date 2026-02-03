-- Complete Database Migration for Bekya 2.1
-- Run this in your Supabase SQL Editor

-- 1. CREATE MISSING TABLES

-- Create sales table if it doesn't exist
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  category TEXT,
  sold_to UUID REFERENCES profiles(id),
  sale_price DECIMAL(10, 2) NOT NULL,
  sale_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS offers (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  start_date DATE,
  end_date DATE,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ADD MISSING COLUMNS

-- Add weight column to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2);

-- Add profile columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. ENABLE ROW LEVEL SECURITY

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES

-- Sales policies
DROP POLICY IF EXISTS "Admin full access to sales" ON sales;
CREATE POLICY "Admin full access to sales" 
ON sales FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can read their own sales" ON sales;
CREATE POLICY "Users can read their own sales" 
ON sales FOR SELECT 
USING (user_id = auth.uid() OR sold_to = auth.uid());

-- Offers policies
DROP POLICY IF EXISTS "Admin full access to offers" ON offers;
CREATE POLICY "Admin full access to offers" 
ON offers FOR ALL 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "Users can read active offers" ON offers;
CREATE POLICY "Users can read active offers" 
ON offers FOR SELECT 
USING (is_active = TRUE);

-- Notifications policies
DROP POLICY IF EXISTS "Users can read their own notifications" ON notifications;
CREATE POLICY "Users can read their own notifications" 
ON notifications FOR SELECT 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" 
ON notifications FOR UPDATE 
USING (user_id = auth.uid());

-- 5. CREATE VIEWS

-- Admin stats view
DROP VIEW IF EXISTS admin_stats;
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as available_products,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_products,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_products
FROM products;

-- Sales summary view
DROP VIEW IF EXISTS sales_summary;
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
  p.category,
  COUNT(*) as total_sales,
  SUM(s.sale_price) as total_revenue,
  AVG(s.sale_price) as average_price,
  MAX(s.sale_date) as last_sale_date
FROM sales s
JOIN products p ON s.product_id = p.id
GROUP BY p.category
ORDER BY total_revenue DESC;

-- 6. ADD INDEXES FOR BETTER PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sold_to ON sales(sold_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);

-- 7. FINAL VERIFICATION

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'products', 'profiles', 'notifications', 'offers')
ORDER BY table_name;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('sales', 'products', 'profiles', 'notifications', 'offers')
AND schemaname = 'public';

-- Success message
SELECT '✅ Migration completed successfully! All tables and policies are ready.' as status_message;