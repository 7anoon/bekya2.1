-- التحقق من سياسات RLS على جدول profiles
-- نفذي هذا في Supabase SQL Editor

-- 1. شوف السياسات الموجودة
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. لو مفيش سياسة للقراءة، نضيفها (نفذي كل سطر لوحده)
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;

CREATE POLICY "Enable read access for all users" 
ON profiles FOR SELECT 
USING (true);

-- 3. تأكد إن RLS مفعل
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. اختبار: جرب تقرأ username
SELECT username, email FROM profiles WHERE username = 'hanoon';
