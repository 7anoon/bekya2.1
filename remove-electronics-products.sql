-- مسح جميع المنتجات الإلكترونية من قاعدة البيانات
DELETE FROM products 
WHERE category = 'electronics';

-- تحديث أي عروض مرتبطة بالمنتجات الإلكترونية
UPDATE offers 
SET category = 'other' 
WHERE category = 'electronics';

-- التحقق من النتائج
SELECT COUNT(*) as remaining_electronics 
FROM products 
WHERE category = 'electronics';