-- إصلاح RLS policies لتحديث دور المستخدمين
-- يجب تشغيل هذا الملف في Supabase SQL Editor

-- حذف السياسات القديمة إذا كانت موجودة
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- إنشاء سياسة جديدة تسمح للمدراء بتحديث أي profile
CREATE POLICY "Admins can update any profile role"
ON profiles
FOR UPDATE
TO authenticated
USING (
  -- السماح للمدراء بتحديث أي profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  -- السماح للمدراء بتحديث أي profile
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- التأكد من أن المستخدمين يمكنهم تحديث ملفاتهم الشخصية
CREATE POLICY IF NOT EXISTS "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- عرض السياسات الحالية للتحقق
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
