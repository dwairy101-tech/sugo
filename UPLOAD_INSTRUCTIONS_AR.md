# طريقة الرفع الصحيحة على GitHub

هذا الملف جاهز للرفع على GitHub مباشرة لأن `index.html` موجود في جذر المشروع، وليس داخل `public/`.

## الخطوات

1. فك ضغط الملف.
2. افتح المجلد الناتج.
3. ارفع محتويات المجلد نفسها إلى GitHub:
   - `index.html`
   - `css/`
   - `js/`
   - `worker/`
   - `docs/`
   - `.gitignore`
   - `.nojekyll`
   - `README.md`
4. لا ترفع ملف ZIP نفسه.

## لتفعيل GitHub Pages

من GitHub:

```text
Settings → Pages → Deploy from a branch → main → /root
```

ثم اضغط Save.

## ملاحظة مهمة

الواجهة ستفتح كصفحة Static. ميزات الذكاء الاصطناعي تحتاج نشر Cloudflare Worker الموجود داخل مجلد `worker/`.
