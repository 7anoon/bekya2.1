-- ========================================
-- كل الـ Migrations المطلوبة لـ Supabase
-- نفذيهم بالترتيب في SQL Editor
-- ========================================

-- ========================================
-- 1. إضافة عمود rejected_initial_price
-- ========================================
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rejected_initial_price BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN products.rejected_initial_price IS 'هل رفض العميل السعر الأولي الذي اقترحه الـ AI';


-- ========================================
-- 2. إضافة عمود category للعروض
-- ========================================
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS category TEXT;

COMMENT ON COLUMN offers.category IS 'الفئة المستهدفة للعرض (furniture, books, clothes, toys, other)';


-- ========================================
-- 3. إصلاح صلاحيات جدول العروض (RLS)
-- ========================================

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "Enable read access for all users" ON offers;
DROP POLICY IF EXISTS "Enable insert for admins only" ON offers;
DROP POLICY IF EXISTS "Enable update for admins only" ON offers;
DROP POLICY IF EXISTS "Enable delete for admins only" ON offers;

-- تفعيل RLS
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة: الجميع يقدر يقرأ العروض
CREATE POLICY "Enable read access for all users" ON offers
FOR SELECT
USING (true);

-- سياسة الإضافة: الأدمن فقط
CREATE POLICY "Enable insert for admins only" ON offers
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- سياسة التحديث: الأدمن فقط
CREATE POLICY "Enable update for admins only" ON offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- سياسة الحذف: الأدمن فقط
CREATE POLICY "Enable delete for admins only" ON offers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);


-- ========================================
-- تم! كل الـ Migrations جاهزة
-- ========================================
