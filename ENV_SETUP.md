# Environment Variables Qo'shish Qo'llanmasi

Sizga 3 ta environment variable qo'shish kerak:

## 1. VITE_SUPABASE_URL

Bu Supabase project URL'ingiz.

**Qayerdan olish:**
1. https://supabase.com ga kiring
2. Loyihangizni oching
3. Settings > API
4. "Project URL" ni nusxalang (masalan: https://xxxxx.supabase.co)

**Qo'shish:**
```bash
vercel env add VITE_SUPABASE_URL
```
- Value: Supabase URL ni kiriting
- Environment: Production tanlang (Enter bosing)

---

## 2. VITE_SUPABASE_ANON_KEY

Bu Supabase anon/public key.

**Qayerdan olish:**
1. https://supabase.com ga kiring
2. Loyihangizni oching
3. Settings > API
4. "anon public" key ni nusxalang

**Qo'shish:**
```bash
vercel env add VITE_SUPABASE_ANON_KEY
```
- Value: Anon key ni kiriting
- Environment: Production tanlang (Enter bosing)

---

## 3. GEMINI_API_KEY (Ixtiyoriy)

Bu Google Gemini API key (AI funksiyalar uchun).

**Qayerdan olish:**
1. https://aistudio.google.com/app/apikey ga kiring
2. "Create API Key" bosing
3. Key ni nusxalang

**Qo'shish:**
```bash
vercel env add GEMINI_API_KEY
```
- Value: API key ni kiriting
- Environment: Production tanlang (Enter bosing)

---

## Oxirgi qadam: Production'ga qayta deploy qilish

Environment variables qo'shgandan keyin:

```bash
vercel --prod
```

Bu buyruq yangi environment variables bilan saytni qayta deploy qiladi.

✅ Tayyor! Saytingiz to'liq ishga tushdi!
