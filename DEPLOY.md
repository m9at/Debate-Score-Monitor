# نشر المنصة (Production)

الإعداد ينشر خدمة واحدة: سيرفر Express يخدم الـ API وواجهة Vite المبنية على نفس الدومين
(لا حاجة لـ CORS ولا لضبط عنوان API في الواجهة).

## المتغيرات المطلوبة

| المتغير | النوع | القيمة |
|---|---|---|
| `DATABASE_URL` | runtime | رابط Postgres (يوفّره المزوّد تلقائياً) |
| `PORT` | runtime | يوفّره المزوّد (Express يقرأه) |
| `VITE_CLERK_PUBLISHABLE_KEY` | **build arg** | مفتاح Clerk العام — يُدمج في حزمة الواجهة وقت البناء |

## Railway (الأسهل مع Postgres)

1. New Project → **Deploy from GitHub repo** واختر هذا المستودع.
2. Railway يكتشف `Dockerfile` تلقائياً.
3. أضف **New → Database → PostgreSQL**؛ سيُضاف `DATABASE_URL` تلقائياً للخدمة.
4. في **Variables** أضف `VITE_CLERK_PUBLISHABLE_KEY` (Railway يمرّرها كـ build arg أيضاً).
5. **Settings → Networking → Generate Domain** للحصول على الرابط العام.

عند كل push جديد يعيد Railway البناء والنشر تلقائياً.

## Render

- New → **Web Service** → Runtime: **Docker**.
- أنشئ Postgres منفصلاً وانسخ `DATABASE_URL` إلى متغيرات الخدمة.
- أضف `VITE_CLERK_PUBLISHABLE_KEY` كـ **Environment Variable** ومع `--build-arg` في إعدادات الـ Docker build.

## أي VPS

```bash
docker build --build-arg VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxx -t oman-debates .
docker run -d -p 80:3000 -e DATABASE_URL='postgresql://...' -e PORT=3000 oman-debates
```

## ملاحظات

- مخطط قاعدة البيانات يُطبّق عند كل تشغيل عبر `drizzle-kit push` (موجود في `CMD`).
- بعد النشر تحقق من `https://<domain>/api/healthz` → يجب أن يعيد `{"ok":true}`.
- أضف دومين الإنتاج في لوحة Clerk (Allowed origins) وإلا لن يعمل تسجيل الدخول.
