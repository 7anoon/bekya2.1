-- تحديث بيانات الملف الشخصي
-- غيري القيم دي بالبيانات الصحيحة

UPDATE profiles 
SET 
  location = 'awsim',  -- غيري ده بموقعك
  phone = '01002284046',  -- غيري ده برقم تليفونك
  role = 'admin'  -- عشان تكوني admin
WHERE username = 'haneen.soliman17';  -- غيري ده باسم المستخدم بتاعك

-- أو لو عايزة تستخدمي الـ email:
-- UPDATE profiles 
-- SET 
--   location = 'awsim',
--   phone = '01002284046',
--   role = 'admin'
-- WHERE email = 'haneen.soliman17@gmail.com';
