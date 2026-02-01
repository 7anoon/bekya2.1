-- اختبار تسجيل الدخول
-- نفذي هذا في Supabase SQL Editor

-- 1. تأكد إن المستخدم موجود
SELECT id, username, email, role 
FROM profiles 
WHERE username = 'hanoon';

-- 2. شوف السياسات على جدول profiles
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. اختبار القراءة من profiles (كأنك anonymous user)
SET ROLE anon;
SELECT username, email FROM profiles WHERE username = 'hanoon';
RESET ROLE;

-- 4. لو الاختبار فشل، نضيف السياسة دي
CREATE POLICY IF NOT EXISTS "Allow anonymous read for login" 
ON profiles FOR SELECT 
TO anon
USING (true);

-- 5. اختبار تاني
SET ROLE anon;
SELECT username, email FROM profiles WHERE username = 'hanoon';
RESET ROLE;
