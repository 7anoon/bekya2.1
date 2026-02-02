# إعداد GitHub Pages

## الخطوات المطلوبة:

### 1. تفعيل GitHub Pages
1. اذهب إلى Settings في الريبو
2. اختر Pages من القائمة الجانبية
3. في Source اختر "GitHub Actions"

### 2. إضافة Secrets
اذهب إلى Settings > Secrets and variables > Actions وأضف:

- `VITE_SUPABASE_URL`: https://kxuvovqvwtwhtxjnnboo.supabase.co
- `VITE_SUPABASE_ANON_KEY`: مفتاح Supabase الخاص بك

### 3. رفع الكود
```bash
git add .
git commit -m "Setup GitHub Pages deployment"
git push origin main
```

### 4. انتظر الـ Deployment
- اذهب إلى تبويب Actions في GitHub
- شاهد الـ workflow وهو يعمل
- بعد النجاح، الموقع سيكون متاح على:
  `https://7anoon.github.io/bekya2.1/`

## ملاحظات:
- كل push على main سيؤدي لـ deployment تلقائي
- يمكنك تشغيل الـ deployment يدوياً من تبويب Actions
- تأكد من إضافة الـ Secrets قبل أول deployment
