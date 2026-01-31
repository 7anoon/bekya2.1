-- تحويل المستخدم لـ Admin
-- غيري 'hanoon' باسم المستخدم بتاعك

UPDATE profiles 
SET role = 'admin' 
WHERE username = 'hanoon';

-- تحديث البيانات الناقصة (اختياري)
UPDATE profiles 
SET 
  location = 'awsim',
  phone = '01002284046'
WHERE username = 'hanoon';

-- تحقق من النتيجة
SELECT username, email, role, location, phone 
FROM profiles 
WHERE username = 'hanoon';
