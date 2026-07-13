# طريقة رفع مشروع SUGO على GitHub

## الرفع الصحيح

1. فك ضغط ملف `SUGO_GITHUB_UPLOAD_READY_ACCURACY_FIXED_20260713.zip`.
2. افتح المجلد الناتج وحدد **كل الملفات والمجلدات الموجودة داخله**.
3. ارفعها إلى جذر مستودع GitHub مباشرة.
4. لا ترفع ملف ZIP وحده، ولا تضع المشروع داخل مجلد إضافي داخل المستودع.
5. من GitHub افتح:
   **Settings → Pages → Deploy from a branch**
6. اختر فرع `main` ثم اختر `/(root)` واضغط Save.

## فحص المشروع قبل الرفع

بعد تثبيت Node.js، افتح موجه الأوامر داخل مجلد المشروع وشغّل:

```bash
npm test
```

يجب أن تظهر الرسالة:

```text
All SUGO validation suites passed.
```

## تشغيل أو تحديث Cloudflare Worker

على Windows شغّل:

```text
START_CLOUDFLARE_SETUP.bat
```

هذا الملف يحدّث الـWorker، يحافظ على مفاتيح الذكاء الاصطناعي الموجودة، يربط الموقع بعنوان الـWorker، وينشئ نسخة ZIP جديدة جاهزة للرفع.

## تنبيه أمني

لا ترفع إلى GitHub أي ملف يحتوي كلمة مرور الإدارة أو مفاتيح Gemini أو Cerebras أو Grok، ولا ترفع ملفات `.env` أو `.dev.vars`.
