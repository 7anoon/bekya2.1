-- إنشاء دالة لحذف المستخدم بالكامل (من auth.users و profiles)
-- يجب تشغيل هذا الكود في Supabase SQL Editor

-- 1. إنشاء الدالة
CREATE OR REPLACE FUNCTION delete_user_completely(user_id_to_delete UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- حذف الإشعارات
  DELETE FROM public.notifications WHERE user_id = user_id_to_delete;
  
  -- حذف المنتجات
  DELETE FROM public.products WHERE user_id = user_id_to_delete;
  
  -- حذف من profiles
  DELETE FROM public.profiles WHERE id = user_id_to_delete;
  
  -- حذف من auth.users
  DELETE FROM auth.users WHERE id = user_id_to_delete;
END;
$$;

-- 2. منح الصلاحيات للمستخدمين المصرح لهم
GRANT EXECUTE ON FUNCTION delete_user_completely(UUID) TO authenticated;

-- 3. إنشاء RLS policy للسماح للأدمن فقط باستخدام الدالة
-- (اختياري - يمكن التحكم من الكود)
