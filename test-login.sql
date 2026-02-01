-- اختبار تسجيل الدخول
-- نفذي هذا في Supabase SQL Editor

-- 1. تأكد إن المستخدم موجود
SELECT id, username, email, role 
FROM profiles 
WHERE username = 'hanoon';

-- 2. شوف السياسات على جدول profiles
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. امسح السياسة القديمة لو موجودة
DROP POLICY IF EXISTS "Allow anonymous read for login" ON profiles;

-- 4. اعمل السياسة الجديدة
CREATE POLICY "Allow anonymous read for login" 
ON profiles FOR SELECT 
TO anon
USING (true);

-- 5. اختبار القراءة
SELECT username, email FROM profiles WHERE username = 'hanoon';
