-- إنشاء جدول متابعة المبيعات
CREATE TABLE IF NOT EXISTS sales_tracking (
  id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sold_to UUID REFERENCES profiles(id),
  sale_price DECIMAL(10,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة تعليقات للجدول
COMMENT ON TABLE sales_tracking IS 'جدول متابعة عمليات البيع';
COMMENT ON COLUMN sales_tracking.product_name IS 'اسم المنتج المباع';
COMMENT ON COLUMN sales_tracking.category IS 'فئة المنتج';
COMMENT ON COLUMN sales_tracking.sold_to IS 'المستخدم الذي تم البيع له';
COMMENT ON COLUMN sales_tracking.sale_price IS 'سعر البيع';
COMMENT ON COLUMN sales_tracking.sale_date IS 'تاريخ البيع';
COMMENT ON COLUMN sales_tracking.notes IS 'ملاحظات إضافية';
COMMENT ON COLUMN sales_tracking.user_id IS 'المستخدم الذي سجل العملية';

-- إضافة فهارس للتحسين
CREATE INDEX IF NOT EXISTS idx_sales_tracking_user_id ON sales_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_tracking_sale_date ON sales_tracking(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_tracking_category ON sales_tracking(category);

-- إضافة سياسات الأمان (RLS)
ALTER TABLE sales_tracking ENABLE ROW LEVEL SECURITY;

-- السماح للأدمن بقراءة وكتابة جميع السجلات
CREATE POLICY "Admin full access to sales tracking" 
ON sales_tracking 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- السماح للمستخدم بقراءة سجلاته الخاصة
CREATE POLICY "Users can read their own sales records" 
ON sales_tracking 
FOR SELECT 
USING (user_id = auth.uid());

-- السماح للمستخدم بإنشاء سجلات جديدة
CREATE POLICY "Users can insert sales records" 
ON sales_tracking 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- السماح للمستخدم بتعديل سجلاته الخاصة
CREATE POLICY "Users can update their own sales records" 
ON sales_tracking 
FOR UPDATE 
USING (user_id = auth.uid());

-- السماح للمستخدم بحذف سجلاته الخاصة
CREATE POLICY "Users can delete their own sales records" 
ON sales_tracking 
FOR DELETE 
USING (user_id = auth.uid());