SUGO - نسخة جاهزة للرفع على GitHub Pages

طريقة الرفع:
1) فك ضغط الملف ZIP.
2) افتح مجلد sugo_github_ready.
3) ارفع كل الملفات والمجلدات الموجودة داخله إلى Repository على GitHub.
   مهم: يجب أن يكون index.html في جذر المستودع، وليس داخل مجلد فرعي.
4) من GitHub:
   Settings > Pages
   Source: Deploy from a branch
   Branch: main / root
5) انتظر حتى يظهر رابط الموقع.

الملفات المهمة:
- index.html: الصفحة الرئيسية.
- assets/: ملفات CSS و JavaScript ومحتوى الأقسام.
- sugo-sw.js: Service Worker لتحسين الكاش والسرعة.
- worker.js: ملف Cloudflare Worker، لا يعمل داخل GitHub Pages نفسه، لكنه موجود حتى ترفعه على Cloudflare Worker إذا احتجته.
- .nojekyll: حتى GitHub Pages يخدم الملفات كما هي بدون مشاكل.

ملاحظات مهمة:
- لا ترفع ملف ZIP نفسه داخل GitHub فقط؛ يجب فك الضغط ورفع المحتويات.
- لا تحذف assets أو sugo-sw.js.
- لو فتحت index.html مباشرة من الكمبيوتر قد لا تعمل بعض الأقسام لأن تحميل ملفات HTML الداخلية يحتاج سيرفر. على GitHub Pages سيعمل طبيعي.
- رابط الـ Worker الحالي داخل الكود مضبوط على:
  https://sugo.dwairy101.workers.dev

تم تحسين النسخة لتقليل RAM/CPU:
- المحتوى الكبير مقسم إلى ملفات منفصلة.
- السكربتات الثقيلة لا تحمل من البداية.
- يوجد Cache ذكي وتنظيف ذاكرة للأقسام القديمة.
