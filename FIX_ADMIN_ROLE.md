# حل مشكلة عدم ظهور لوحة الإدارة

## المشكلة
عند تسجيل الدخول بحساب hanoon، لا تظهر روابط لوحة الإدارة في Navbar.

## السبب
الحقل `role` في جدول `profiles` لا يساوي `'admin'` للمستخدم hanoon.

## الحل (خطوة بخطوة)

### 1. تحديث دور المستخدم في Supabase

افتحي Supabase Dashboard:
- اذهبي إلى: https://supabase.com/dashboard
- اختاري المشروع: kxuvovqvwtwhtxjnnboo
- من القائمة الجانبية، اختاري **SQL Editor**
- انسخي والصقي الكود التالي:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE username = 'hanoon' OR email = 'haneen.soliman17@gmail.com';
```

- اضغطي **Run** أو **Ctrl+Enter**
- يجب أن تظهر رسالة: `Success. 1 row(s) affected`

### 2. التحقق من التحديث

نفذي هذا الأمر للتأكد:

```sql
SELECT id, username, email, role 
FROM profiles 
WHERE username = 'hanoon';
```

يجب أن يظهر:
- username: hanoon
- email: haneen.soliman17@gmail.com
- role: **admin** ← يجب أن يكون admin

### 3. مسح الـ Cache في المتصفح

افتحي Developer Console في المتصفح (F12) واكتبي:

```javascript
localStorage.clear();
location.reload();
```

### 4. تسجيل الخروج والدخول مرة أخرى

- اضغطي "تسجيل خروج"
- سجلي الدخول مرة أخرى بـ:
  - اسم المستخدم: `hanoon`
  - كلمة المرور: `753123`

### 5. التحقق من النتيجة

بعد تسجيل الدخول، يجب أن تظهر في Navbar:
- ✅ **لوحة الإدارة** (رابط إلى /admin)
- ✅ **إدارة العروض** (رابط إلى /admin/offers)

## التشخيص (إذا لم يعمل)

افتحي Developer Console (F12) وابحثي عن:

```
=== Navbar Profile Debug ===
Profile: {id: "...", username: "hanoon", role: "admin"}
Profile Role: admin
Is Admin? true
```

إذا كان `Is Admin? false`، معناها المشكلة في قاعدة البيانات.

## ملاحظات مهمة

1. **يجب تنفيذ SQL في Supabase أولاً** - هذا هو الأهم!
2. **مسح الـ Cache ضروري** - عشان يتم تحميل البيانات الجديدة
3. **تسجيل خروج ودخول** - عشان يتم تحميل الـ profile من جديد
4. **تحقق من Console** - لو فيه أخطاء، هتظهر في Console

## إذا استمرت المشكلة

تحققي من:
1. هل Supabase Project شغال؟ (اذهبي للـ Dashboard)
2. هل الـ SQL تم تنفيذه بنجاح؟
3. هل تم مسح الـ Cache؟
4. هل تم تسجيل الخروج والدخول؟

## معلومات الأدمن

- **Username**: hanoon
- **Password**: 753123
- **Email**: haneen.soliman17@gmail.com
- **Role**: admin (بعد تنفيذ SQL)
