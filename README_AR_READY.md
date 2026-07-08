# SUGO SOP — نسخة جاهزة للرفع

هذه النسخة مصممة حتى تعمل الواجهة والـ API routing بشكل صحيح قدر الإمكان على:

- GitHub repository
- Vercel
- Cloudflare Pages
- Cloudflare Worker مستقل

## سبب الخطأ السابق 405

الواجهة كانت ترسل طلبات AI إلى `/`، وهذا يعمل فقط إذا كان الـ Worker على نفس الـ origin. على Vercel، المسار `/` static ولا يقبل POST، لذلك ظهر الخطأ:

`Worker request failed (405)`

تم إصلاح ذلك في `js/app.js`:

- على Vercel يتم إرسال API إلى `/api`
- على Cloudflare Pages يتم استخدام `functions/_middleware.js`
- إذا كان عندك Worker خارجي، يمكن ضبط:

```html
<script>
  window.SUGO_API_BASE = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev";
</script>
```

قبل تحميل `js/app.js`.

## ملفات مهمة

- `index.html` — الواجهة
- `css/styles.css` — التصميم
- `js/app.js` — منطق التطبيق
- `js/content.js` — محتوى SOP
- `worker.js` — Cloudflare Worker root
- `functions/_middleware.js` — تشغيل Worker API داخل Cloudflare Pages
- `api/index.js` و `api/[...path].js` — تشغيل API داخل Vercel
- `wrangler.toml` — إعداد Worker مستقل

## أسرار مطلوبة لتشغيل AI فعليًا

لا يمكن وضع هذه القيم داخل الملفات لأنها أسرار حسابك:

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put GEMINI_API_KEY
wrangler secret put CEREBRAS_API_KEY
wrangler secret put GROK_API_KEY
wrangler secret put XAI_API_KEY
```

على Vercel أضف نفس الأسماء من:

Project Settings → Environment Variables

على Cloudflare Pages أضف نفس الأسماء من:

Project → Settings → Environment variables

## KV

ميزات Admin/Menu/Content التي تحتاج تخزين دائم تحتاج KV binding باسم:

`SUGO_KV`

لكن Ask AI الأساسي يمكن أن يعمل بدون KV إذا كانت مفاتيح المزود موجودة.
