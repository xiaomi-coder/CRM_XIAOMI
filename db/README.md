# Baza skriptlari

Tartib bilan qo'llanadi. Har biri qayta ishga tushirilsa ham xavfsiz
(`IF NOT EXISTS`, `CREATE OR REPLACE`, `DROP POLICY IF EXISTS`).

| Fayl | Nima qiladi |
|---|---|
| `01-auth-functions.sql` | `pgcrypto`, JWT imzolash (`auth.sign_jwt`), `public.login` — parol bcrypt bilan bazada tekshiriladi |
| `02-superadmin-and-pin.sql` | `creator` foydalanuvchisi, `public.redeem_pin` — PIN tekshiruvi bazada |
| `03-rls-policies.sql` | RLS: har markaz faqat o'z qatorlarini ko'radi |
| `04-password-management.sql` | Parol o'zgartirish/tiklash, yangi parolni darrov hash qilish |
| `05-audit-log.sql` | `audit_log` jadvali, `auth.log_event`, `public.get_audit_log` |
| `06-self-registration.sql` | `public.register_center` — markaz o'zi ro'yxatdan o'tadi (14 kun sinov, telefon/login takrorlanmaydi, IP bo'yicha tezlik cheklovi), `auth.client_ip` |
| `07-demo-center.sql` | `public.demo_login` (2 soatlik mehmon propuski, DEMO_CENTER) va `public.reset_demo_center` — VPS'da `crm-demo-reset.timer` har kuni 04:00 da chaqiradi |

## Qo'llash

```bash
scp db/*.sql root@138.249.7.47:/root/
ssh root@138.249.7.47 'sudo -u postgres psql -qd crm < /root/01-auth-functions.sql'
ssh root@138.249.7.47 'systemctl restart postgrest'   # yangi funksiya/ustun qo'shilsa SHART
```

## Muhim

- **JWT siri** bazada sozlama sifatida turadi: `ALTER DATABASE crm SET app.jwt_secret`.
  Uni `/root/crm-secrets.env` dan olinadi. Sir almashsa, PostgREST konfigi va
  frontenddagi anon kalit ham almashishi kerak.
- RLS qoidalari `auth.jwt_center()` ni chaqiradi, shuning uchun
  `GRANT USAGE ON SCHEMA auth TO anon, authenticated` shart — aks holda
  butun API `permission denied for schema auth` beradi.
- `record IS NOT NULL` PL/pgSQL da faqat BARCHA ustun to'la bo'lsagina rost.
  Qator topilganini tekshirish uchun `IF FOUND` ishlatiladi.
