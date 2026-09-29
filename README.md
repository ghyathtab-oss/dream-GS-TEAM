# سجل المرضى — GitHub Pages + Supabase

واجهة عربية RTL لتسجيل:
- اسم المريض
- الشكاية
- رقم التواصل
- زر اتصال
- زر واتساب
- حفظ تلقائي بعد الكتابة
- بحث في السجلات
- تعديل وحذف
- تسجيل دخول للموظف

## لماذا لا نحفظ داخل ملفات GitHub؟
GitHub Pages استضافة ثابتة. المتصفح لا يستطيع تعديل ملفات المستودع بأمان، ووضع GitHub Token داخل JavaScript سيكشفه لأي شخص. كما أن بيانات المرضى حساسة ولا ينبغي تخزينها داخل repository أو Git history.

## الإعداد

### 1. Supabase
1. أنشئ مشروعاً في Supabase.
2. افتح SQL Editor.
3. شغّل محتوى `schema.sql`.
4. من Authentication > Users أنشئ مستخدم الموظف، أو فعّل طريقة التسجيل التي تناسبك.
5. من Project Settings / API انسخ:
   - Project URL
   - anon / publishable key

### 2. اربط الواجهة
افتح `app.js` واستبدل:

```js
const SUPABASE_URL = "PASTE_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_KEY_HERE";
```

> لا تستخدم `service_role` key في GitHub Pages أبداً.

### 3. GitHub Pages
1. ارفع الملفات إلى مستودع GitHub.
2. Settings > Pages.
3. اختر Deploy from a branch.
4. اختر فرع `main` والمجلد `/root`.
5. احفظ.

## ملاحظات أمان مهمة
- RLS مفعّل في `schema.sql`، وكل مستخدم يرى سجلاته فقط.
- لا تجعل جدول المرضى Public.
- لا تضع كلمات مرور أو service keys في المستودع.
- إذا كانت الأداة للاستخدام الطبي الفعلي، راجع متطلبات الخصوصية والقانون المحلي (مثل GDPR في أوروبا) وسياسة الاحتفاظ بالبيانات والنسخ الاحتياطي.
- يفضّل تفعيل MFA للموظفين إن أمكن.
