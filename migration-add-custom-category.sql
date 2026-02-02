-- إضافة حقل للفئة المخصصة
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS custom_category TEXT;

-- إضافة index للبحث
CREATE INDEX IF NOT EXISTS idx_products_custom_category ON products(custom_category) WHERE custom_category IS NOT NULL;
