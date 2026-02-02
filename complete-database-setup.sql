-- Complete Database Setup for Bekya 2.1
-- Run this in your Supabase SQL Editor to fix all 404 errors

-- 1. ENSURE ALL REQUIRED TABLES EXIST

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT,
  buyer_location TEXT,
  sale_price DECIMAL(10,2) NOT NULL,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create offers table
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

-- 2. ADD MISSING COLUMNS TO EXISTING TABLES

-- Add weight column to products if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2);

-- Add phone and location to profiles if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. UPDATE EXISTING DATA

-- Set default weight for existing products
UPDATE products 
SET weight = 1.0 
WHERE weight IS NULL;

-- 4. CREATE INDEXES FOR PERFORMANCE

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON sales(buyer_name);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Offers indexes
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);

-- 5. ENABLE RLS ON ALL TABLES

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- 6. CREATE RLS POLICIES

-- SALES TABLE POLICIES
-- Admin full access
CREATE POLICY IF NOT EXISTS "Admin full access to sales" 
ON sales 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Users can read sales they created
CREATE POLICY IF NOT EXISTS "Users can read sales they created" 
ON sales 
FOR SELECT 
USING (created_by = auth.uid());

-- Users can insert sales records
CREATE POLICY IF NOT EXISTS "Users can insert sales records" 
ON sales 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Users can update sales they created
CREATE POLICY IF NOT EXISTS "Users can update sales they created" 
ON sales 
FOR UPDATE 
USING (created_by = auth.uid());

-- Users can delete sales they created
CREATE POLICY IF NOT EXISTS "Users can delete sales they created" 
ON sales 
FOR DELETE 
USING (created_by = auth.uid());

-- NOTIFICATIONS TABLE POLICIES
-- Users can read their own notifications
CREATE POLICY IF NOT EXISTS "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY IF NOT EXISTS "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- OFFERS TABLE POLICIES
-- Admin full access
CREATE POLICY IF NOT EXISTS "Admin full access to offers" 
ON offers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Users can read active offers
CREATE POLICY IF NOT EXISTS "Users can read active offers" 
ON offers 
FOR SELECT 
USING (is_active = TRUE);

-- 7. CREATE VIEWS

-- Admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_products,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_products,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_products
FROM products;

-- Sales summary
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

-- 8. VERIFICATION QUERIES

-- Check all tables exist
SELECT '=== DATABASE STRUCTURE VERIFICATION ===' as section;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'products', 'profiles', 'notifications', 'offers')
ORDER BY table_name;

-- Check RLS status
SELECT '=== RLS STATUS ===' as section;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('sales', 'products', 'profiles', 'notifications', 'offers')
AND schemaname = 'public';

-- Check policies
SELECT '=== RLS POLICIES ===' as section;
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('sales', 'notifications', 'offers')
ORDER BY tablename, policyname;

-- Success message
SELECT '=== SETUP COMPLETE ===' as section;
SELECT 'All tables and policies have been created successfully!' as message;
SELECT 'You can now access the Sales Management page without 404 errors.' as next_steps;