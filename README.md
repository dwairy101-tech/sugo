# SUGO GitHub Split Version

هذه نسخة مقسمة من ملف `index(94).html` بدون تغيير منطق التشغيل.

## ماذا تم عمله؟

- فصل كل أكواد CSS من `index.html` إلى مجلد `assets/css/`.
- فصل كل أكواد JavaScript من `index.html` إلى مجلد `assets/js/`.
- إبقاء ترتيب تحميل الملفات كما كان داخل الملف الأصلي حتى لا ينكسر التشغيل.
- نسخ ملف Cloudflare Worker داخل `cloudflare-worker/worker.js` كنسخة مرجعية فقط.

## العدد

- CSS files: 13
- JS files: 21
- Main HTML: 1
- Worker reference: 1

## طريقة الرفع على GitHub Pages

ارفع محتويات هذا المجلد كما هي:

```text
index.html
assets/
cloudflare-worker/
docs/
```

ثم فعل GitHub Pages على نفس الفرع.

## ملاحظة مهمة

لا تضع كلمة مرور الأدمن داخل GitHub. يجب أن تبقى `ADMIN_PASSWORD` داخل Cloudflare Worker Secrets فقط.

## الخطوة التالية المقترحة

بعد التأكد أن النسخة المقسمة تعمل مثل القديمة، نبدأ المرحلة الثانية: تنظيف ملف القوائم وتحويل Dropdown إلى Flyout حقيقي.
