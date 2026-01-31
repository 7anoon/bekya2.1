-- ⚠️ SQL لتفعيل حساب الأدمن
-- Username: hanoon
-- Password: 753123

-- تحديث الحساب ليكون admin مع كل البيانات
UPDATE profiles 
SET 
  role = 'admin',
  location = 'awsim',
  phone = '01002284046'
WHERE username = 'hanoon';

-- التحقق من النتيجة
SELECT 
  username, 
  email, 
  role, 
  location, 
  phone,
  created_at
FROM profiles 
WHERE username = 'hanoon';

-- رسالة نجاح
SELECT 'تم تفعيل حساب الأدمن بنجاح! سجل خروج ودخول لرؤية لوحة الإدارة.' as message;
