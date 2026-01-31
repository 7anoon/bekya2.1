-- ⚠️ تحذير: هذا السكريبت سيمسح كل البيانات من قاعدة البيانات
-- استخدميه بحذر قبل بيع المشروع

-- مسح كل الإشعارات
DELETE FROM notifications;

-- مسح كل المنتجات
DELETE FROM products;

-- مسح كل المستخدمين من جدول profiles
DELETE FROM profiles;

-- مسح كل المستخدمين من Supabase Auth
-- ملاحظة: هذا لا يمكن عمله من SQL، لازم تعمليه من Dashboard

-- إعادة تعيين الـ sequences (اختياري)
-- ALTER SEQUENCE IF EXISTS notifications_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;

-- رسالة نجاح
SELECT 'تم مسح كل البيانات بنجاح! المشروع جاهز للبيع.' as message;
