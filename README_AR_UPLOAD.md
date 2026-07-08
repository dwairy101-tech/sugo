# SUGO SOP — نسخة جاهزة للرفع كاملة

هذه النسخة مجهزة حتى ترفعها على GitHub مباشرة:

- الواجهة موجودة في الجذر: `index.html`, `css/`, `js/`.
- ملف Worker موجود في الجذر: `worker.js` و `wrangler.toml` حتى لا يفشل Cloudflare Workers Build بسبب عدم وجود إعدادات.
- نسخة إضافية من Worker موجودة داخل `worker/` لمن يريد النشر اليدوي لاحقًا.
- لا يوجد أي API key أو password داخل الملفات.

## ارفع هذه الملفات كلها إلى GitHub

```text
index.html
css/
js/
docs/
worker.js
wrangler.toml
worker/
.gitignore
.nojekyll
README.md
README_AR_UPLOAD.md
FILE_TREE.txt
```

## ملاحظة مهمة

الواجهة ستعمل على GitHub Pages / Vercel / Cloudflare Pages مباشرة.

أما ميزات AI الحقيقية داخل Worker فلن تعمل إلا بعد إضافة الأسرار في Cloudflare:

```bash
wrangler secret put ADMIN_PASSWORD
wrangler secret put GEMINI_API_KEY
wrangler secret put CEREBRAS_API_KEY
wrangler secret put GROK_API_KEY
wrangler secret put XAI_API_KEY
```

لا يمكن وضع هذه القيم داخل الملفات لأنها أسرار خاصة بحسابك.

## KV اختياري للتحرير الحي

إذا أردت أن تعمل ميزات admin editable content، أنشئ KV namespace في Cloudflare ثم أضف IDs الحقيقية داخل `wrangler.toml` مكان البلوك المعلّق.

