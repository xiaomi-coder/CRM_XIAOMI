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
- ⚠️ JWT sirini almashtirish, root parolini almashtirish, zaxirani serverdan
  tashqariga nusxalash.

## Sotuvga tayyorlash — 3-to'plam: o'zi ro'yxat, demo, qo'llanma ✅ (2026-08-05)

Uchchala ish ham bajarildi (qo'llanma joylashuvi bo'yicha qaror: demoda qisqa
4 qadamlik yo'lboshchi + batafsili alohida `/guide` sahifasida; demo to'liq
interaktiv, har kuni tunda tozalanadi — foydalanuvchi ikkala tavsiyani tasdiqladi).

1. **Markaz o'zi ro'yxatdan o'tadi** — `db/06-self-registration.sql`:
   `public.register_center` (anon chaqiradi). Himoya: telefon/login takrorlanmaydi
   (telefon raqamlargina solishtiriladi), parol kamida 6 belgi va darrov bcrypt,
   sinov avtomatik 14 kun (`licenseExpiry`), tezlik cheklovi IP bo'yicha
   (soatiga 5 urinish, sutkasiga 2 muvaffaqiyat; tizim bo'yicha sutkasiga 30) —
   IP `auth.client_ip()` orqali X-Forwarded-For'dan olinadi, hammasi
   `audit_log`ga yoziladi. Muvaffaqiyatda darrov 12 soatlik propusk qaytadi.
   Frontend: `components/Register.tsx` (`/register`), landing va logindagi
   barcha CTA'lar shu yerga olib boradi (avval Telegram'ga yuborardi).
2. **Landing'da jonli demo** — `db/07-demo-center.sql`: `public.demo_login`
   2 soatlik mehmon-direktor propuski beradi (`centerId = DEMO_CENTER`), RLS
   tufayli faqat demo markaz ko'rinadi. Namunaviy ma'lumot (8 o'quvchi, 3 guruh,
   to'lovlar, davomat, lidlar — sanalar doim "bugun"ga nisbatan) va
   `public.reset_demo_center()` — VPS'da **`crm-demo-reset.timer`** har kuni
   04:00 da tozalaydi. Landing hero'da "Jonli demo" tugmasi; ilova ichida demo
   mehmonga `components/DemoTour.tsx` — 4 qadamlik yo'lboshchi kartasi.
3. **Skrinshotli qo'llanma** — `components/GuidePage.tsx` (`/guide`, ochiq
   sahifa): 6 bo'lim (ro'yxat, guruhlar, o'quvchilar, davomat, to'lovlar,
   Telegram bot), har birida haqiqiy ekran rasmi (`public/guide/*.png`) va rasm
   ustida foizli koordinatali raqamli belgilar (rasmga chizilmaydi — CSS overlay).
   Skrinshotlar `scripts/guide-shots.mjs` bilan olinadi (puppeteer-core + demo
   propusk; yangilash kerak bo'lsa `node scripts/guide-shots.mjs`).
   ⚠️ vite dev macOS'da `/app` so'roviga `App.tsx`ni berib yuboradi (harf katta-
   kichikligi farqlanmaydi) — skript shuning uchun `/register` orqali kiradi.

Tekshirilgan: register_center (takror telefon/login/zaif parol/yaroqsiz login →
to'g'ri xatolar, yangi user login qila oladi), demo propusk faqat DEMO_CENTER'ni
ko'radi (8 students / 1 settings), UI orqali to'liq ro'yxat oqimi (forma → /app),
`npm run build` toza. Test markazlar o'chirildi.

## To'lov eslatmalari serverga ko'chirildi ✅ (2026-08-05)

- **Muammo:** eslatmalar (5/3/1 kun) brauzerda yuborilardi — direktor ilovani
  ochmagan kuni eslatma KETMASDI; "yuborildi" belgisi localStorage'da (qurilmaga
  bog'liq, boshqa kompyuterdan takror ketishi mumkin edi).
- **Yechim:** `db/08-payment-reminders.sql` (`reminder_log` + `due_payment_reminders()`
  + `mark_reminder_sent()`, GRANT yo'q — API ko'rmaydi) + VPS'da
  `/root/crm-payment-reminders.py` (repoda: `scripts/vps-payment-reminders.py`) —
  **`crm-payment-reminders.timer` har kuni 09:00** (Persistent=true). Qo'shimcha:
  to'lov kunining o'zida ham (D0) eslatma ketadi; faqat ACTIVE o'quvchilar.
  Brauzerdagi eski `checkAndSendPaymentReminders` OLIB TASHLANDI.
- Sinov: dry-run 0 nomzod (hozircha hech kimda `nextPaymentDate`+`tgChatId`
  birga to'lmagan — IT Park'da tgChatId bor, lekin sana bo'sh), timer birinchi
  ishga tushishi toza o'tdi. Sana qo'yilishi bilan avtomatik ishlay boshlaydi.
- ⚠️ **Topilma:** `api/send-monthly-report.ts` (Vercel cron, oyiga 1) hali ham
  ANON kalit bilan o'qiydi — RLS yoqilgandan beri 0 qator ko'radi, oylik hisobot
  jimgina ishlamayapti. → o'sha kuni tuzatildi, pastga qarang.

## Oylik hisobot + Telegram webhook RLS'dan keyin tuzatildi ✅ (2026-08-05)

RLS yoqilganda anon kalit bilan ishlaydigan IKKITA serverless oqim jimgina
buzilgan ekan — ikkalasi ham tuzatildi:

1. **Oylik davomat hisoboti** — `api/send-monthly-report.ts` O'CHIRILDI
   (vercel.json'dagi cron ham). O'rniga: `db/09-monthly-report.sql`
   (`monthly_report_data()`, GRANT yo'q) + VPS'da `/root/crm-monthly-report.py`
   (repoda `scripts/vps-monthly-report.py`) — **`crm-monthly-report.timer`
   har oy 1-sanada 10:00**. Takror ketmasligi `reminder_log` (kind='MONTHLY',
   dueDate='YYYY-MM'). Xabar matni eskisi bilan aynan bir xil.
   Iyul hisoboti yuborilmay qolgan ekan (6 ta, IT Park Bukhara) — bir
   martalik `crm-monthly-catchup.timer` 2026-08-05 10:00 ga qo'yildi
   (tunda yubormaslik uchun).
2. **Ota-onaning botga ulanishi** — `api/telegram-webhook.ts` avval
   settings/students'ni anon bilan o'qirdi (RLS'dan beri har doim "o'quvchi
   topilmadi" qaytarardi!). Endi `db/10-telegram-connect.sql`:
   `public.tg_connect(bot_token, chat_id, code)` SECURITY DEFINER, anon'ga
   ochiq — bot tokenning o'zi kalit vazifasida. Webhook faqat shu RPC'ni
   chaqiradi, xabar matnlari o'zgarmagan.
- Sinov (ochiq API orqali): noto'g'ri kod → not_found + markaz nomi,
  noto'g'ri token → no_center, haqiqiy kod + ulangan chat → already (ism
  bilan). Oylik hisobot dry-run: 6 nomzod to'g'ri topildi.
- VPS'dagi barcha timerlar: backup 03:00, demo-reset 04:00,
  payment-reminders 09:00, monthly-report oyning 1-i 10:00.

## "Ketib qolish" xavfi bashorati ✅ (2026-08-05)

Qoidaviy bashorat (v1, AI'siz — keyin Gemini tavsiyasi qo'shsa bo'ladi):
- **Qoidalar** (ikki joyda AYNAN bir xil — o'zgartirganda birga o'zgartirish
  SHART): `services/churnRisk.ts` (frontend) va `db/11-churn-risk.sql` (server).
  3+ dars ketma-ket ABSENT = 3 ball; so'nggi 14 kunda (3+ dars belgilangan)
  davomat <50% = 2 ball; to'lov 7+ kun kechikkan = 2 ball. 4+ = YUQORI,
  2-3 = O'RTA. Faqat ACTIVE o'quvchilar.
- **Dashboard'da blok** (`components/Dashboard.tsx`): DIRECTOR/ADMIN/SUPER
  ko'radi — o'quvchi, sabablar, ota-ona telefoni (tel: havola), daraja belgisi;
  bo'sh bo'lsa yashil "xavf yo'q" holati. Tarjimalar: churn_risk* (uz/ru/en).
- **Haftalik hisobot**: `crm-risk-report.timer` (dushanba 10:30) →
  `/root/crm-risk-report.py` (repoda `scripts/vps-risk-report.py`) — har markaz
  bo'yicha bitta jamlama xabar direktorning botiga (`reportChatId` bo'lsa).
  Dedupe: reminder_log kind='RISK', studentId='center_<id>', dueDate='IYYY-IW'.
- Demo seed (db/07) yangilandi: demo-s3 (Jasur) 3 dars ketma-ket kelmagan,
  demo-s6 (Zarina) to'lovi 9 kun kechikkan — demo dashboardda blok jonli
  ko'rinadi. Brauzerda tekshirildi (YUQORI/O'RTA to'g'ri chiqdi), SQL skoring
  demo ma'lumotda frontend bilan bir xil natija berdi.

## Platforma bot: ro'yxatda Telegram raqam tasdig'i ✅ (2026-08-05, kod tayyor — bot TOKENI kutilmoqda)

Foydalanuvchi bilan qaror: soxta ro'yxatlarni yopish + sinov tugashi/yangi
ro'yxat haqida foydalanuvchiga xabar berish uchun **bitta umumiy platforma
bot** kerak (har markazning ota-ona boti bilan ALOHIDA). Telegram'ning
"📱 Raqamni ulashish" tugmasi ishlatiladi — akkauntga bog'langan haqiqiy raqam,
qo'lda terib/o'zgartirib bo'lmaydi. Saytdagi raqam bilan farq qilsa ham rad
etilmaydi — **Telegram raqami haqiqat manbai** bo'ladi (saytdagi formaga
qaytib yoziladi).

- **Baza:** `db/12-platform-bot.sql` — `platform_config` (bot_token/username/
  owner_chat_id, bo'sh bo'lsa hammasi eski tartibda), `tg_verifications`
  (bir martalik token, 1 soat amal qiladi), `settings.platformChatId`.
  `register_center` yangilandi: bot yoqilgan bo'lsa `p_tg_token` VERIFIED
  bo'lishi SHART, markaz raqami sifatida Telegram tasdiqlagan raqam olinadi.
- **Webhook:** `api/platform-bot.ts` — `/start <token>` kelsa `attach_tg_chat`,
  kontakt kelsa `confirm_tg_verification` (+ egaga — sizga — yangi tasdiq
  haqida xabar). Bot token webhook URL'ida (`?token=`) va bazaga RPC'larga
  "sir" sifatida uzatiladi — shu orqali faqat webhook'ning o'zi yoza oladi.
- **Frontend:** `components/Register.tsx` — `tgPlatformStatus()` bilan
  yoqilganmi tekshiradi; yoqilmagan bo'lsa forma AYNAN avvalgidek. Yoqilgan
  bo'lsa: telefon kiritilgach "Telegram orqali tasdiqlash" tugmasi → bot yangi
  tabda ochiladi → 2.5s poll bilan holatni kuzatadi (5 daqiqa timeout) →
  tasdiqlangach yashil belgi, "Bepul boshlash" yoqiladi.
- **Sinov muddati eslatmalari:** `db/12` dagi `trial_expiring_centers()` +
  `scripts/vps-trial-reminders.py` — 3 va 1 kun qolganda `platformChatId`ga
  (faqat tg orqali tasdiqlangan markazlarga ishlaydi). Timer
  `setup-platform-bot.sh` orqali o'rnatiladi (09:30, har kuni).
- **Yoqish** (token kelganda): VPS'da
  `./setup-platform-bot.sh <BOT_TOKEN> <BOT_USERNAME> <OWNER_CHAT_ID>`
  (`/root/setup-platform-bot.sh`, repoda `scripts/setup-platform-bot.sh`) —
  bazaga yozadi, Telegram webhook'ni ulaydi, timer'ni yoqadi.
- **To'liq sinovdan o'tkazildi** (soxta token bilan, keyin tozalandi):
  bot o'chiq holatda forma eski tartibda + `register_center` ishladi;
  yoqilganda UI to'g'ri bosqichlarni ko'rsatdi (idle→pending→verified),
  `attach_tg_chat`/`confirm_tg_verification` bot o'rniga qo'lda chaqirilganda
  frontend poll bilan darrov ilg'ab oldi, ro'yxat yakunlanib `/app`ga kirdi,
  `settings.platformChatId` to'g'ri saqlandi. Test markaz/config o'chirildi,
  bot yana `enabled:false` holatda.

### Keyingi sessiyaga qolgan
- Foydalanuvchi @BotFather'dan bot ochib token bersa: `setup-platform-bot.sh`
  ishga tushiriladi, haqiqiy Telegram orqali (soxta emas) uchdan-uch sinaladi,
  keyin `crm-trial-reminders.timer` jonli ekani tasdiqlanadi.
- Hali qilinmagan: creator panelida "sinov tugayotgan markazlar" ro'yxati
  (bot yoqilgandan keyin qo'shish mantiqiy — o'sha payt platformChatId
  to'ldirilgan markazlar ko'payadi).

## Davomat: ommaviy xabar yuborish ✅ (2026-08-05)

- Har o'quvchi qatorida alohida "xabar yuborish" tugmasi bor edi, lekin
  ommaviysi yo'q edi (faqat "Hammasini KETDI" — u holatni ham o'zgartiradi).
- Qo'shildi: **"Barchasiga xabar yuborish"** — holatlarga TEGMAYDI, faqat
  allaqachon belgilanganlarga (keldi/kelmadi/kechikdi/ketdi) har birining
  O'Z holati haqida xabar yuboradi. Telegram ulanmaganlar o'tkazib yuboriladi,
  yakunda "N yuborildi / M o'tkazib yuborildi" ko'rsatiladi.
- Xabar matni `buildStatusMessage()` da — yakka va ommaviy yuborish bitta
  manbadan foydalanadi (matn ikki joyda farq qilib qolmasin).
- `bulkLoading/bulkProgress` dan ALOHIDA `sendAllLoading/sendAllProgress` —
  aks holda progress noto'g'ri tugmada ko'rinardi.
- Demoda sinaldi: 6 ta belgilangan o'quvchi to'g'ri topildi.

## Xarajatlar bo'limi qayta ishlandi ✅ (2026-08-10)

Foydalanuvchi UI/UX yomonligini va sana filtrida "ikkita yozuv ustma-ust"
tushganini ko'rsatdi. Topilgan va tuzatilgan xatolar:

1. **Ustma-ust yozuv** — sana yorlig'i maydon ICHIGA `absolute` qilib
   qo'yilgan edi, `<input type=date>` ning o'z "dd/mm/yyyy" matni bilan
   to'qnashardi. Ustiga-ustak o'sha yorliq panel sarlavhasida ham
   takrorlangan. → Yorliqlar maydon USTIGA chiqarildi.
2. **"Barcha o'quvchilar"** — xarajatlar ro'yxati sarlavhasida o'quvchilar
   haqidagi matn turardi (nusxa-ko'chirish xatosi) → `N / jami` bilan almashdi.
3. **`t.amount` tarjimasi UMUMAN YO'Q edi** — butun ilovada bo'sh chiqardi.
   Eng yomoni: ota-onaga boradigan to'lov tasdig'i xabarida "💰 : 500,000"
   deb ketardi va Excel eksport sarlavhasi bo'sh edi. → uz/ru/en qo'shildi
   (Payments bo'limi ham shu bilan tuzaldi).
4. **Sana solishtirish** — `new Date(...)` orqali edi, vaqt mintaqasi tufayli
   chegaradagi kun surilib ketishi mumkin edi → "YYYY-MM-DD" satrlarini
   to'g'ridan-to'g'ri solishtirishga o'tkazildi (`fmtDate` ham local).

Qo'shilgan imkoniyatlar: nom bo'yicha qidiruv, turkum bo'yicha filtr
(chiplar), tez tanlash (Bu oy / O'tgan oy / Bu yil), va sarlavha blokida
**turkumlar bo'yicha taqsimot** (foiz + summa) — direktor pul qayerga
ketayotganini darrov ko'radi.

## YANGI DIZAYN TIZIMIGA O'TISH — boshlandi (2026-08-10)

Foydalanuvchi Claude Design'da to'liq CRM dizayn tizimi yasadi va **butun
ilovani** shunga o'tkazishni so'radi (nafaqat ranglar — tuzilma ham; masalan
o'quvchi profili tab'lar bilan: Umumiy / To'lovlar / Davomat / Natijalar /
Telegram / Faoliyat).

**Manba:** `~/developer/new project/EduCenter CRM design system.zip`
(4 fayl: Design System, App Shell, Core Experience, Super Admin).
Format — Claude Design'ning o'zi (`<x-dc>`, `sc-for`), React EMAS →
qo'lda ko'chiriladi.

### Dizayn tokenlari (index.html) ✅
Qiymatlar dizayndan AYNAN olindi:
- Brend `#3B4FE0` (hover `#2F3FC0`, subtle `#EEF1FE`)
- Fon `#F7F8FA`, yuza `#FFFFFF`, chegara `#E4E7EC`
- Matn: `#101828` / `#475467` / `#98A2B3`
- Holat: success `#157A4F`, warning `#A8650A`, danger `#C13B30`, info `#2563C7`
  (har birining `bg` juftligi bilan — StatusBadge shundan foydalanadi)
- Radius **6/8/12px** (avval 2.5–3rem edi), soyalar `e1/e2/e3` (nozik)
- Yon menyu `#101828`

### Umumiy komponentlar ✅ — `components/ui/index.tsx`
`PageHeader, Card, CardHeader, Button, StatusBadge, KpiCard, Field, Input,
Select, Tabs, Table/Th/Td, Avatar, EmptyState, TONE`.
⚠️ Yangi ekran qilganda SHULARDAN foydalaning — aks holda ilova yana
har xil ko'rinishga qaytadi.
⚠️ `text-${align}` kabi yig'ma klass nomlari ishlatilmasin — Tailwind
ularni topa olmaydi (ALIGN xaritasi orqali qilingan).

### Ko'chirilgan ekranlar
- ✅ **Xarajatlar** — birinchi namuna (PageHeader + 4 KPI + filtr karta +
  toza jadval, turkumlar StatusBadge bilan)
- ✅ **Boshqaruv paneli** — dizayndagi to'liq tuzilma, HAMMASI haqiqiy
  ma'lumotdan hisoblanadi (soxta raqam yo'q):
  - 8 ta KPI (o'quvchi, guruh, 7 kunlik yangi lid, daromad, qarzdor,
    davomat, ketib qolish xavfi, sof foyda)
  - **"Diqqat talab qiladi"** — kechikkan to'lovlar / bugungi qo'ng'iroqlar
    (`followUpDate <= bugun`) / past davomatli guruhlar (14 kunda <70%,
    kamida 3 yozuv) / xavf ostidagi o'quvchilar
  - **Daromad grafigi** — oxirgi 6 oy, `payments.date` dan guruhlanadi
  - **Lid konversiyasi** — voronka, `leads.status` bo'yicha
  - **Yaqinlashayotgan to'lovlar** — keyingi 14 kun, muddat belgisi bilan
  - Ketib qolish xavfi (telefon havolasi bilan), moliyaviy hisobot, AI tahlil

- ✅ **Karkas (Layout)** — yon menyu 240px `#101828`, faol element ko'k;
  yuqori panel 56px: yo'lchi (Asosiy / Boshqaruv), til, soat, avatar
- ✅ **O'quvchilar** — tokenlar tufayli avtomatik yangilandi; "ASOSIY" ustun
  sarlavhasi (`t.main`) va id'dan yasalgan avatar (`-S1`) tuzatildi
- ✅ **O'quvchi profili** (`components/StudentProfile.tsx`) — ro'yxatda
  ism/avatarga bosilsa ochiladi. Tab'lar: Umumiy / To'lovlar / Davomat /
  Natijalar / Telegram / Faoliyat. Hammasi mavjud ma'lumotdan, qo'shimcha
  so'rov yo'q (payments va results AuthenticatedApp'dan uzatiladi).
  Telegram tabida ulanmagan o'quvchining KODI ko'rsatiladi.

### ⚠️ Butun ilova bo'ylab takrorlangan xato
"Amallar" ustuni **uch joyda** `t.main` ("Asosiy") deb nomlangan edi —
Xarajatlar, To'lovlar, O'quvchilar. Uchchalasi ham tuzatildi. Yangi jadval
qilganda `t.actions` ishlatilsin.

### Keyingi navbat (qolgan ekranlar)
Guruhlar, Davomat, To'lovlar (mantiq tayyor — faqat ko'rinish), Lidlar,
Xodimlar, Oylik maosh, Arxiv, Natijalar, Sozlamalar, Creator paneli, IELTS.

## To'lovlar bo'limi (a–g) ✅ (2026-08-10)

Xarajatlardan keyin To'lovlar ham ko'rib chiqildi. Tuzatilgan xatolar:

- **"ASOSIY" ustuni** — to'lov turi ustuni `t.main` bilan nomlangan edi
  (Excel eksportda ham). → `payment_type` qo'shildi.
- **O'chirish tugmasi** tooltip'i `t.delete_staff` ("Xodimni o'chirish")
  edi → `delete_action`.
- **Naqd/Plastik jamilari filtrga bo'ysunmasdi** — har doim butun tarixni
  ko'rsatardi, ekrandagi ro'yxat bilan mos kelmasdi. Endi `filteredPayments`
  dan hisoblanadi.
- **Bo'sh holat yo'q edi** → "Ma'lumot topilmadi" qo'shildi.
- **Sana filtri UMUMAN yo'q edi** → sana oralig'i + tez tanlash
  (Bu oy / O'tgan oy / Bu yil), Xarajatlardagi bilan bir xil.
- **Umumiy jami yo'q edi** → yashil sarlavha blokida (Naqd/Plastik alohida chip).
- **Qidiruv faqat ism bo'yicha edi** → telefon va ota-ona telefoni ham.
- Saralash `new Date(...)` dan satr solishtirishga o'tkazildi.

⚠️ Sinovda topilgan tuzoq: filtr yoqilganda sarlavha `t.expenses_for_period`
ni ishlatgan edim — To'lovlar sahifasida "...XARAJATLAR" deb chiqdi.
Alohida `filtered_total` kaliti qo'shildi.

### Hali qilinmagan (foydalanuvchi alohida hal qiladi)
- `payments.forMonth` da faqat oy NOMI saqlanadi, YIL yo'q — 2025 va 2026
  avgusti farqlanmaydi. Mavjud ma'lumotga ta'sir qilgani uchun alohida
  ehtiyotkorlik bilan qilinadi.

## Platforma boti YOQILDI ✅ (2026-08-10)

- Bot: **@Eduprocrmbot** ("EduProCrm"). Egasi (xabar keladigan) chat: foydalanuvchi.
- ⚠️ **Token repoda YO'Q va bo'lmasligi kerak** — faqat VPS'da `platform_config`
  jadvalida. Kerak bo'lsa: `sudo -u postgres psql -d crm -c "SELECT * FROM platform_config"`.
- `setup-platform-bot.sh` ishga tushirildi: baza to'ldirildi, Telegram webhook
  `https://eduprocrm.uz/api/platform-bot?token=...` ga ulandi,
  `crm-trial-reminders.timer` (har kuni 09:30) yoqildi.
- **Haqiqiy Telegram orqali uchdan-uch sinaldi:**
  1. `?start=<token>` → bot "📱 Raqamni ulashish" tugmasini so'radi ✓
  2. Raqam ulashildi → `confirm_tg_verification` ishladi, MOS KELMASLIK
     tarmog'i to'g'ri javob berdi (saytda 998907776655, Telegram 998906127171
     → Telegram raqami olindi) ✓
  3. Egaga "🆕 Yangi ro'yxat tasdiqlandi" bildirishnomasi keldi ✓
- Sinov yozuvi keyin `tg_verifications` dan o'chirildi.
- 📌 Endi `/register` da tasdiqlash MAJBURIY (`tg_platform_status` →
  `enabled:true`). Ya'ni Telegram'siz markaz ro'yxatdan o'ta olmaydi.

## Creator paneli: muddati tugayotgan markazlar ✅ (2026-08-10)

- `CreatorComponents.tsx` ichida `ExpiringCenters` bloki — creator "Boshqaruv"
  ekranining tepasida (statistika kartalaridan keyin).
- Ko'rsatadi: `licenseExpiry` yaqin **7 kun** ichida tugaydigan yoki allaqachon
  tugagan, **bloklanmagan** markazlar. Eng shoshilinchi tepada.
  Rang: tugagan=qizil, ≤3 kun=amber, ≤7 kun=sariq. Bo'sh bo'lsa yashil holat.
- Har qatorda: markaz nomi, direktor ismi, **telefon (tel: havola)** — qo'ng'iroq
  qilish uchun, va joriy muddat sanasi.
- **Uzaytirish tugmalari: +1 oy / +3 oy / +1 yil.** Mantiq: muddat TUGAGAN bo'lsa
  bugundan, tugamagan bo'lsa MAVJUD sanadan davom ettiriladi (to'langan kunlar
  yo'qolmasin). Tasdiq oynasi yangi sanani ko'rsatadi.
- Sinov/pullik farqlanmaydi — ikkalasi ham bitta `licenseExpiry` da (bazada
  `createdAt` yo'q, ajratib bo'lmaydi). Creator uchun farqi yo'q ham.
- ⚠️ Eslatma: `licenseExpiry` bo'sh = **cheksiz** (blokka tushmaydi). Demo va
  eski markazlar shunday.
- Sinovdan o'tkazildi (vaqtinchalik 2 markaz bilan, keyin o'chirildi): qizil/
  sariq/bo'sh holatlar, +1 oy tugagandan (10.08→10.09), +3 oy tugamagandan
  (12.08→12.11), baza va UI yangilanishi.

## ⚠️ Vercel deploy tuzog'i (2026-08-10)

Ikki marta ketma-ket muammo bo'ldi, sababi bizning kodda EMAS:
1. `67afff8` push qilinganda GitHub→Vercel **webhook umuman ishlamadi** —
   Vercel build ham boshlamadi (GitHub'da kod bor, Vercel'da deploy yo'q).
2. Bo'sh commit bilan qayta urinilganda build 11 soniyada tugadi-yu,
   **"Deploying outputs..." bosqichida 13+ daqiqa osilib** qoldi → CANCELED.
3. Uchinchi urinish **21 soniyada** muvaffaqiyatli tugadi.

**Xulosa:** deploy uzoq cho'zilsa — Vercel status sahifasini tekshirish shart
emas (u "operational" ko'rsatib turaveradi). Eng tez yechim: bo'sh commit
bilan qayta push (`git commit --allow-empty`). Osilgan deploy CANCELED
bo'lguncha kutish kerak, aks holda navbatda ikkitasi turib qoladi.
