-- Create Sales Table for Bekya 2.1
-- Run this in your Supabase SQL Editor

-- 1. CREATE SALES TABLE
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

-- 2. ADD COMMENTS
COMMENT ON TABLE sales IS 'جدول عمليات البيع';
COMMENT ON COLUMN sales.product_id IS 'معرف المنتج المباع';
COMMENT ON COLUMN sales.buyer_name IS 'اسم المشتري';
COMMENT ON COLUMN sales.buyer_phone IS 'رقم هاتف المشتري';
COMMENT ON COLUMN sales.buyer_location IS 'موقع المشتري';
COMMENT ON COLUMN sales.sale_price IS 'سعر البيع';
COMMENT ON COLUMN sales.sale_date IS 'تاريخ ووقت البيع';
COMMENT ON COLUMN sales.notes IS 'ملاحظات إضافية';
COMMENT ON COLUMN sales.created_by IS 'المستخدم الذي سجل العملية';

-- 3. ADD INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_buyer_name ON sales(buyer_name);

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- 5. CREATE RLS POLICIES
-- Admin full access to sales
CREATE POLICY "Admin full access to sales" 
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
CREATE POLICY "Users can read sales they created" 
ON sales 
FOR SELECT 
USING (created_by = auth.uid());

-- Users can insert sales records
CREATE POLICY "Users can insert sales records" 
ON sales 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

-- Users can update sales they created
CREATE POLICY "Users can update sales they created" 
ON sales 
FOR UPDATE 
USING (created_by = auth.uid());

-- Users can delete sales they created
CREATE POLICY "Users can delete sales they created" 
ON sales 
FOR DELETE 
USING (created_by = auth.uid());

-- 6. SUCCESS MESSAGE
SELECT 'Sales table created successfully!' as message;