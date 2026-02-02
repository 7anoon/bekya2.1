-- إضافة حقول المبيعات لجدول products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS buyer_name TEXT,
ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS sale_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS sale_notes TEXT;

-- إضافة index للأداء
CREATE INDEX IF NOT EXISTS idx_products_status_sold ON products(status) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS idx_products_sale_date ON products(sale_date DESC) WHERE sale_date IS NOT NULL;
