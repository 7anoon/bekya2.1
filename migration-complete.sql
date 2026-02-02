-- Complete Migration for Bekya 2.1
-- This migration sets up all required database structures

-- 1. SALES TABLE (Main sales records)
-- This table is created in create-sales-table.sql file
-- Please run that file in your Supabase SQL editor first

-- 2. PRODUCT MANAGEMENT ENHANCEMENTS
-- Add weight column if not exists
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 2);

-- Add proper comments
COMMENT ON COLUMN products.weight IS 'وزن المنتج بالكيلوجرام';

-- Update existing products to have default weight
UPDATE products 
SET weight = 1.0 
WHERE weight IS NULL;

-- 3. USER PROFILE ENHANCEMENTS
-- Add any missing profile columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comments
COMMENT ON COLUMN profiles.phone IS 'رقم الهاتف';
COMMENT ON COLUMN profiles.location IS 'الموقع الجغرافي';

-- 4. NOTIFICATION SYSTEM
-- Ensure notifications table exists
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies for notifications
CREATE POLICY "Users can read their own notifications" 
ON notifications 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
ON notifications 
FOR UPDATE 
USING (user_id = auth.uid());

-- 5. OFFERS TABLE
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

-- Add comments
COMMENT ON TABLE offers IS 'جدول العروض الترويجية';
COMMENT ON COLUMN offers.category IS 'الفئة المستهدفة للعرض (furniture, books, clothes, toys, other)';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);

-- Enable RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Policies for offers
CREATE POLICY "Admin full access to offers" 
ON offers 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can read active offers" 
ON offers 
FOR SELECT 
USING (is_active = TRUE);

-- 6. CREATE VIEWS
-- View for admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  COUNT(*) as total_products,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_products,
  COUNT(CASE WHEN status = 'sold' THEN 1 END) as sold_products,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_products,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_products
FROM products;

-- View for sales summary
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

-- Success message query
SELECT 'Migration completed successfully!' as status_message;