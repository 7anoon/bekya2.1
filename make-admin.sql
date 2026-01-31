-- تحويل المستخدم لـ Admin
-- غيري 'hanoon' باسم المستخدم بتاعك

UPDATE profiles 
SET role = 'admin' 
WHERE username = 'hanoon';

-- أو لو عايزة تستخدمي الـ email:
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'haneen.soliman17@gmail.com';
