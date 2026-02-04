-- إضافة عمود product_name لجدول offers
-- يجب تشغيل هذا الملف في Supabase SQL Editor

-- إضافة عمود product_name
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS product_name TEXT;

-- إضافة تعليق على العمود
COMMENT ON COLUMN offers.product_name IS 'اسم المنتج المستهدف للعرض (اختياري). إذا كان فارغاً، العرض يطبق على كل المنتجات';

-- عرض بنية الجدول للتحقق
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'offers'
ORDER BY ordinal_position;
