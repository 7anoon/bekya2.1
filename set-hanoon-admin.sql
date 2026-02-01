-- تحديث دور المستخدم hanoon ليصبح admin
-- نفذي هذا الأمر في Supabase SQL Editor

UPDATE profiles 
SET role = 'admin' 
WHERE username = 'hanoon' OR email = 'haneen.soliman17@gmail.com';

-- التحقق من التحديث
SELECT id, username, email, role 
FROM profiles 
WHERE username = 'hanoon' OR email = 'haneen.soliman17@gmail.com';
