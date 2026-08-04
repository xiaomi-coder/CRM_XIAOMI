# EduControl Pro CRM — Loyiha va Ko'chirish Jurnali (CLAUDE.md)

> Bu fayl loyiha haqida asosiy ma'lumot va Supabase → VPS ko'chirish jarayonining
> bosqichma-bosqich jurnalini saqlaydi. Har bir o'zgarish shu yerga yoziladi.

## Loyiha haqida (tahlil natijasi — 2026-06-25)

- **Turi:** Frontend-only ilova (Vite + React 19 + TypeScript). Alohida backend server yo'q.
- **Ma'lumotlar qatlami:** `@supabase/supabase-js` — faqat `.from()` (PostgREST). ORM (Prisma/Drizzle) yo'q.
  - Yagona fayl: `services/supabase.ts` (`db.get/insert/update/delete/upsert`).
- **Supabase'ning ishlatilgan qismlari:** faqat **Database (Postgres) + PostgREST**.
  - Auth ❌ (custom: `users` jadvalida ochiq parol, sessiya `localStorage`'da — `App.tsx:61`)
  - Storage ❌, Realtime ❌, Edge Functions ❌
- **Vercel serverless funksiyalari (`/api/*`):** Supabase EMAS, Vercel'da qoladi.
  - `telegram-webhook.ts`, `send-monthly-report.ts` (cron: oyiga 1-sanada), `grade-speaking.ts`, `grade-writing.ts`
- **Hardcode qilingan Supabase manzili (ko'chishda almashtirish kerak):**
  - `services/supabase.ts:5-6`, `api/telegram-webhook.ts:4-5`, `api/send-monthly-report.ts:3-4`
  - Eski URL: `https://ndrynujcnzxkvhmrlemr.supabase.co`
- **Ishlatiladigan jadvallar (18):** students, groups, teachers, attendance, payments, expenses,
  settings, leads, library, results, users, test_templates, ielts_tests, ielts_attempts,
  ielts_test_pins, ielts_reading_questions, ielts_listening_questions, ielts_speaking_questions,
  ielts_writing_tasks
- ⚠️ Ustun nomlari **camelCase** (`centerId`, `groupId`, `monthlyFee`) — `pg_dump` bilan to'liq nusxa shart.
- **Env o'zgaruvchilari:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`, `REPORT_SECRET`.

## Ko'chirish strategiyasi

- **Tanlangan yo'l:** Variant A — VPS'da **PostgreSQL + PostgREST** (yengil), nginx orqali `/rest/v1/`.
- **Sabab:** VPS 1GB RAM / 1 CPU — to'liq self-hosted Supabase (Docker, 2GB+) sig'maydi.
- **Tamoyil:** Supabase originali O'CHIRILMAYDI. VPS'da hammasi ishlagach Vercel ulanadi (nol risk).

## VPS ma'lumotlari

- IP: `138.249.7.47` | Hostname: `vps09369.eskiz.uz` | Domen: `vps8903.eskiz.uz`
- OS: Ubuntu 22.04.5 LTS | RAM: 957 MB | CPU: 1 | Disk: 20GB (15GB bo'sh)
- Mavjud loyiha (TEGILMAYDI): **bekbags** (PHP 8.1 + nginx, `/var/www/bekbags`)

---

# Ko'chirish jurnali (bosqichma-bosqich)

## Bosqich 0 — Tayyorgarlik

### ✅ 0.1 — Swap qo'shildi (2026-06-25)
- **Oldin:** Swap 0B, swappiness 60.
- **Qilingan ish:** `/swapfile` 2GB yaratildi, `mkswap`+`swapon`, `/etc/fstab`ga qo'shildi (reboot'da ham qoladi).
- **Sozlama:** `/etc/sysctl.d/99-crm-swap.conf` → `vm.swappiness=10`, `vm.vfs_cache_pressure=50`.
- **Keyin:** Swap 2.0Gi, RAM 957Mi (jami ~3GB samarali). Disk 13GB bo'sh qoldi.
- **Tekshiruv:** nginx=active, php8.1-fpm=active → **bekbags loyihasi shikastlanmadi.**
- **Orqaga qaytarish (kerak bo'lsa):** `swapoff /swapfile && rm /swapfile && sed -i '/swapfile/d' /etc/fstab`

### ⛔ 0.2 — Eski Supabase PAUZADA (2026-06-25) — FOYDALANUVCHI HARAKATI KERAK
- Tekshiruv: `ndrynujcnzxkvhmrlemr.supabase.co` → DNS `Non-existent domain`, REST HTTP 000.
- **Xulosa:** loyiha pauza holatida. Ma'lumot eksporti uchun foydalanuvchi supabase.com'ga kirib
  loyihani **Restore/Resume** qilishi shart. Undan keyin kerak bo'ladi: **Database Password**
  (Settings → Database → Connection string), yoki to'g'ridan-to'g'ri `pg_dump`.
- VPS infratuzilmasi (Postgres + PostgREST) shu kutilayotgan vaqtda oldindan tayyorlanyapti.

## Bosqich 1 — VPS backend infratuzilmasi ✅ (2026-06-25)

### ✅ 1.1 — PostgreSQL 16 o'rnatildi
- PGDG repo qo'shildi → `postgresql-16` (16.14). Xizmat: active, port 5432 (faqat localhost).
- Tuning: `/etc/postgresql/16/main/conf.d/10-crm-tuning.conf` (1GB serverga moslangan):
  `shared_buffers=128MB, effective_cache_size=512MB, work_mem=4MB, max_connections=50`.

### ✅ 1.2 — Baza va rollar (Supabase uslubida)
- Baza: **`crm`**.
- Rollar: `anon` (NOLOGIN), `authenticated`, `service_role` (BYPASSRLS), `authenticator` (LOGIN).
- `authenticator` → `anon/authenticated/service_role` ga GRANT qilingan (PostgREST `SET ROLE` uchun).
- Maxfiy kalitlar **faqat VPS'da**: `/root/crm-secrets.env` (chmod 600). Bu yerga (git) yozilMAYDI.
  - Ichida: `DB_NAME, AUTH_PWD, JWT_SECRET, ANON_TOKEN, SERVICE_TOKEN`.
- JWT'lar HS256, `JWT_SECRET` bilan imzolangan, 20 yil amal qiladi. `role: anon` / `role: service_role`.

### ✅ 1.3 — PostgREST o'rnatildi
- Binary: `/usr/local/bin/postgrest` (v12.2.3). Config: `/etc/postgrest/crm.conf` (egasi postgres, 640).
- systemd: `postgrest.service` (auto-start, Restart=always, MemoryMax=200M). Port: **127.0.0.1:3001**.
- `db-anon-role=anon`, `db-schemas=public`, `jwt-secret` ulangan.

### ✅ 1.4 — nginx reverse proxy
- Yangi blok: `/etc/nginx/sites-available/crm-api` → `server_name api.eduprocrm.uz`.
- `/rest/v1/` → `http://127.0.0.1:3001/` (Supabase URL strukturasini taqlid qiladi). CORS `*` qo'shilgan.
- `server_names_hash_bucket_size 64` qo'shildi (`/etc/nginx/conf.d/`).
- **bekbags (`bekbags.uz`) BUTUNLAY TEGILMAGAN** — alohida server bloki.
- ✅ Lokal test: `GET /rest/v1/students` → PostgREST JSON javobi (`relation does not exist` — ma'lumot hali yo'q, lekin zanjir ishlayapti).

### Holat: VPS backend TAYYOR.

## Bosqich 3 — DNS + SSL ✅ (2026-06-25)

### ✅ 3.1 — DNS qo'shildi (foydalanuvchi)
- `api.eduprocrm.uz` A-record → `138.249.7.47` (eskiz.uz panelida, ns1/ns2.eskiz.uz).
- Tekshiruv: ns1.eskiz.uz, 8.8.8.8, 1.1.1.1 — hammasi `138.249.7.47` qaytardi. Mavjud root/www → Vercel TEGILMAGAN.

### ✅ 3.2 — SSL (Let's Encrypt) o'rnatildi
- `certbot certonly --webroot` bilan sertifikat olindi (nginx plagini ishlatilmadi — u har safar `server_names_hash_bucket_size` ni takror qo'shib nginx'ni buzayotgan edi).
  - Sertifikat: `/etc/letsencrypt/live/api.eduprocrm.uz/` — 89 kun amal qiladi, avto-yangilanadi.
- `crm-api` konfigiga **443 (https) bloki** qo'lda qo'shildi: TLSv1.2/1.3, 80→443 (301) redirect, acme-challenge 80'da qoldi.
- Tashqi test (foydalanuvchi kompyuteridan):
  - `https://api.eduprocrm.uz/` → `CRM API OK` ✅
  - HTTP → HTTPS `301` ✅ | SSL verify `0` (haqiqiy) ✅
  - `GET /rest/v1/students` → PostgREST JSON: `relation "public.students" does not exist` → **zanjir to'liq ishlayapti**, faqat ma'lumot hali yo'q.
- **bekbags BUTUNLAY TEGILMAGAN** — barcha tekshiruvlarda php8.1-fpm=active.

### Holat: BUTUN VPS BACKEND TIRIK — `https://api.eduprocrm.uz/rest/v1/` Supabase URL o'rnini bosishga tayyor.

## Bosqich 2 — Ma'lumot ko'chirish ⛔ (Supabase to'lov to'sig'i — foydalanuvchi harakati)
- **To'siq:** Supabase org'da to'lanmagan 2 hisob: $3.99 + $30.32 = **$34.31** (OUTSTANDING).
  Supabase: "unpaid invoices — settle before restore". To'lovsiz pauzadagi bazaga ulanib bo'lmaydi.
- To'langach: CRM loyihasini Resume → **DB password** (Settings→Database→Connection string) bilan
  `pg_dump` (toza, to'liq) YOKI anon key orqali REST eksport → VPS `crm` bazasiga import.
- Eslatma: org pullik (Pro) tarifda, har oy ~$30-45. Ko'chgach obunani bekor qilish → har oylik tejov.

## Qaror (2026-06-25): "TOZA BOSHLASH" yo'li tanlandi
- Foydalanuvchida pul yo'q ($34.31 to'lov vaqtincha imkonsiz). Real mijozlar bor, lekin yangi
  markazlarni ishga tushirish muhimroq. Shuning uchun: VPS'da BO'SH (toza) baza bilan boshlanadi.
- Eski Supabase ma'lumoti keyin (pul topilganda) import qilinadi — UUID/centerId noyob bo'lgani uchun
  yangi ma'lumot bilan to'qnashmaydi, ustiga qo'shiladi.
- ⚠️ Eski markazlar (Supabase'dagi `users`) pul to'languncha VPS'da login qila olmaydi (akkaunti hali yo'q).

## Bosqich 1.5 — VPS schema yaratildi ✅ (2026-06-25)
- Manba: `types.ts` (frontend obyektlari) + `*-schema.sql`/`fix-db-schema.sql` + kod ishlatishi.
- Repoda: **`vps-schema.sql`** (versiyalangan, hujjat). 18 jadval `crm` bazasiga qo'llandi.
- Tiplar PERMISSIV: id/centerId/sanalar=TEXT, sonlar=NUMERIC, ro'yxat=TEXT[]/JSONB, obyekt=JSONB.
  NOT NULL/CHECK/FK YO'Q — supabase-js obyektlari xatosiz tushadi. Ustun nomlari kod bilan AYNAN bir xil.
- IELTS: `ielts_tests`/`ielts_test_pins` snake_case (+ camelCase nusxa, xavfsizlik uchun); qolgan 5 ta camelCase.
- `teachers` jadvali YARATILMADI — kod ishlatmaydi (`groups.teacher` matn maydoni yetarli).
- GRANT: anon/authenticated/service_role ga to'liq CRUD (eski "allow-all" holatini takrorlaydi). RLS yoqilmagan.
- PostgREST restart qilindi (kesh yangilandi).
- ✅ End-to-end test (public HTTPS + anon token, frontend kabi): settings/users INSERT→SELECT→DELETE — hammasi ishladi.

## Bosqich 4 — Frontend ulash ✅ (deploy qilindi 2026-06-25)
- Vercel loyiha: **`anti`** (Shokha's projects, Hobby) — `eduprocrm.uz`, repo `xiaomi-coder/CRM_XIAOMI`.
- Vercel'da env YO'Q ("No Environment Variables") → sayt doim kod hardcode'ini ishlatadi → endi VPS.
- Kod `main`'ga push qilindi (`4388f13`, fast-forward) → Vercel avto-build → production VPS'ga ulanadi.
- ✅ Deploy tekshirildi: `eduprocrm.uz` HTTP 200; bundle `index-Bl_iCkBX.js` da `api.eduprocrm.uz` bor, eski Supabase 0 marta.
- ✅ To'liq oqim testi (production API, frontend kabi): markaz yaratish (settings+users 201), admin login simulyatsiya (parol mos, aktiv), o'quvchi qo'shish (201) — hammasi ishladi.
- 📌 Test uchun qoldirildi: markaz `DEMO-MARKAZ-001` ("Demo Markaz (TEST)"), admin `demo_admin`/`demo123`, o'quvchi "Ali Valiyev". Foydalanuvchi ko'rib, keyin o'chirishi mumkin.

## MIGRATSIYA YAKUNI ✅ (2026-06-25)
- Backend Supabase'dan VPS'ga ko'chdi: `https://api.eduprocrm.uz/rest/v1/` (Postgres16 + PostgREST + nginx + SSL).
- Frontend (Vercel `anti`) VPS'ga ulandi. Yangi markazlar ishlamoqda.
- **QOLGAN (kelajak):** (1) eski Supabase ma'lumotini import — $34.31 to'langach. (2) Xavfsizlik: ochiq parollar→bcrypt, anon to'liq-CRUD→cheklash.

- ✅ Kod o'zgartirildi (eski URL/key → VPS):
  - `services/supabase.ts:5-6` → `https://api.eduprocrm.uz` + yangi anon JWT.
  - `api/telegram-webhook.ts:4-5`, `api/send-monthly-report.ts:3-4` → bir xil.
  - `public/sw.js` → service worker `api.eduprocrm.uz` va `/rest/v1/` ni cache'lamaydi.
- ⛔ QOLGAN (foydalanuvchi/deploy):
  1. **Vercel env almashtirish** (eng muhim — env hardcode'dan ustun turadi!):
     `VITE_SUPABASE_URL` = `https://api.eduprocrm.uz`
     `VITE_SUPABASE_ANON_KEY` = `eyJ...role:anon,iss:crm-vps...` (VPS anon token)
  2. **Kodni deploy qilish:** GitHub `xiaomi-coder/CRM_XIAOMI` → Vercel avto-build.
- Test: super admin (`creator`/`xiaomicoder`) → yangi markaz yarat → markaz admini login → o'quvchi/to'lov.

### VPS anon token (public — frontendda baribir ko'rinadi):
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6ImNybS12cHMiLCJpYXQiOjE3ODIzMzQ3NTcsImV4cCI6MjQxMzA1NDc1N30.f1UCrcbJ-G0_q9-wFn9BIyMLPNBgzk2MYpxzU1IC4xw`

---

# Xavfsizlik: ko'p markazli izolyatsiya (2026-08-05)

Sotuvga chiqishdan oldin uchta jiddiy kamchilik tuzatildi.

## Muammo nima edi

1. **Markazlar bir-birining ma'lumotini ko'rardi.** Anon kalit frontend bundle
   ichida ochiq turadi va bazaga to'liq huquq berardi; ajratish faqat brauzerdagi
   `.filter(centerId)` da edi. Bitta so'rov bilan 3 markazning 40 o'quvchisi
   ismi-telefoni bilan qaytardi.
2. **Parollar ochiq matnda** saqlanardi va API orqali o'qilardi.
3. **Zaxira umuman yo'q** edi.

## Endi qanday

- **Zaxira:** `/root/backup-crm.sh` + systemd timer (`crm-backup.timer`), har kuni
  03:00, 14 kun saqlanadi, `/var/backups/crm/`. Tiklash sinab ko'rilgan.
  ⚠️ Zaxira o'sha serverda turadi — server butunlay yo'qolsa, u ham yo'qoladi.
- **Login:** `public.login(username, password)` RPC — parol bcrypt bilan BAZADA
  tekshiriladi. Eski ochiq parollar birinchi kirishda avtomatik hash'ga o'tadi.
  Javob: shaxsiy JWT (propusk), ichida `centerId`, `user_role`, muddati 12 soat.
- **PIN bilan kirish:** `public.redeem_pin(pin, name)` — mehmonga 6 soatlik
  propusk. Avval frontend barcha markazning PIN va lidlarini yuklab olardi.
- **RLS:** 18 ta jadvalda yoqilgan. Qoida: `auth.is_global() OR "centerId" =
  auth.jwt_center()`. IELTS kontenti uchun platforma markazi ham ochiq
  (`00000000-0000-0000-0000-000000000001`), shuning uchun tayyor testlar
  hamma markazga ko'rinadi. `ielts_test_pins` da markaz `created_by` da.
- **Super admin** endi bazadagi haqiqiy foydalanuvchi (`creator`), avval
  frontend kodiga yozib qo'yilgan edi.

Skriptlar: `db/01-auth-functions.sql`, `db/02-superadmin-and-pin.sql`,
`db/03-rls-policies.sql` (`db/README.md` da tartib va tuzoqlar).

## Tekshirilgan natija

| jadval | anon | markaz admini | creator |
|---|---|---|---|
| students | 0 | 2 | 40 |
| users | 0 | 1 | 8 |
| leads | 0 | 1 | 1 |

Yozish: o'z markaziga 201, boshqa markaz nomidan 403, anon 401.

## QOLGAN

- ⚠️ **JWT sirini almashtirish kerak** — ishlash jarayonida xato xabari bilan
  qisman oshkor bo'ldi. Almashtirilsa PostgREST konfigi, bazadagi
  `app.jwt_secret` va frontenddagi anon kalit birga yangilanadi (qisqa uzilish).
- Root parolini almashtirish (suhbatda oshkor bo'lgan).
- Zaxirani serverdan tashqariga ham nusxalash.

## Sotuvga tayyorlash — 2-to'plam (2026-08-05)

Uchta kamchilik tuzatildi (to'rtinchisi keyingi sessiyaga qoldirildi):

1. **Litsenziya muddati** — `licenseExpiry` yozilardi-yu tekshirilmasdi. Endi
   `public.login` tekshiradi (`license_expired`), bo'sh bo'lsa cheksiz deb
   qaraladi. Creator panelida necha kun qolgani rang bilan ko'rinadi.
2. **Parol** — o'z parolini o'zgartirish (Sozlamalar), direktor xodim parolini
   tiklashi (faqat o'z markazida), yangi markaz parolini darrov hash qilish.
   `db/04-password-management.sql`.
3. **Audit jurnali** — LOGLAR ekrani butunlay soxta edi (o'ylab topilgan
   markazlar, soxta heartbeat). Endi haqiqiy: `audit_log` jadvali,
   `auth.log_event()`, `public.get_audit_log()`. Muvaffaqiyatsiz kirish
   urinishlari ham yoziladi. `db/05-audit-log.sql`.

### Keyingi sessiyaga qolgan
- **Markaz o'zi ro'yxatdan o'tsin** (anon chaqiriladigan funksiya — suiiste'moldan
  himoya kerak), **landing'da demo**, **skrinshotli professional qo'llanma**
  (guruhlar, o'quvchilar, Telegram oqimi).
- ⚠️ JWT sirini almashtirish, root parolini almashtirish, zaxirani serverdan
  tashqariga nusxalash.
