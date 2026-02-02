-- إضافة عمود الفئة للعروض
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS category TEXT;

-- تحديث العروض الموجودة
COMMENT ON COLUMN offers.category IS 'الفئة المستهدفة للعرض (furniture, books, clothes, toys, other)';
