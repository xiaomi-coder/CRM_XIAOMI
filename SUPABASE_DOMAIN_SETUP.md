# 🔧 Supabase va Custom Domain Sozlash

## 1️⃣ Supabase URL va API Key Olish

### Qadamlar:

1. **Supabase Dashboard'ga kiring:**
   - https://supabase.com/dashboard
   - Loyihangizni oching

2. **Settings > API bo'limiga o'ting:**
   - Chap menuda **Settings** (⚙️) ni bosing
   - **API** bo'limini tanlang

3. **Quyidagi ma'lumotlarni nusxalang:**

   **Project URL:**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   
   **anon public key:**
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

---

## 2️⃣ Vercel'ga Environment Variables Qo'shish

Terminal'da quyidagi buyruqlarni bajaring:

### a) VITE_SUPABASE_URL qo'shish:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; vercel env add VITE_SUPABASE_URL
```

**Savollarga javoblar:**
- **What's the value of VITE_SUPABASE_URL?** → Supabase URL ni kiriting
- **Add VITE_SUPABASE_URL to which Environments?** → `Production` tanlang (Space bosib, Enter)

---

### b) VITE_SUPABASE_ANON_KEY qo'shish:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; vercel env add VITE_SUPABASE_ANON_KEY
```

**Savollarga javoblar:**
- **What's the value of VITE_SUPABASE_ANON_KEY?** → Supabase Anon Key ni kiriting
- **Add VITE_SUPABASE_ANON_KEY to which Environments?** → `Production` tanlang

---

### c) GEMINI_API_KEY qo'shish (Ixtiyoriy):

Agar AI funksiyalarni ishlatmoqchi bo'lsangiz:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; vercel env add GEMINI_API_KEY
```

**Gemini API Key olish:**
- https://aistudio.google.com/app/apikey
- "Create API Key" bosing

---

### d) Qayta deploy qilish:

Environment variables qo'shgandan keyin:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; vercel --prod
```

✅ Supabase ulanishi tayyor!

---

## 3️⃣ Custom Domain (eduprocrm.uz) Ulash

### Vercel'da domain qo'shish:

1. **Vercel Dashboard'ga kiring:**
   - https://vercel.com/dashboard
   - `educontrol-pro` loyihangizni oching

2. **Settings > Domains bo'limiga o'ting**

3. **"Add" tugmasini bosing**

4. **Domeningizni kiriting:**
   ```
   eduprocrm.uz
   ```

5. **"Add" bosing**

Vercel sizga DNS sozlamalari ko'rsatadi.

---

## 4️⃣ DNS Sozlamalari (Eskiz.uz)

### Eskiz.uz dashboard'da:

1. **Domenlarim** bo'limiga o'ting
2. **eduprocrm.uz** ni tanlang
3. **DNS sozlamalari** bo'limiga o'ting

### Quyidagi recordlarni qo'shing/o'zgartiring:

#### A Record (asosiy domen uchun):

```
Type: A
Name: @ (yoki bo'sh)
Value: 76.76.21.21
TTL: 3600
```

#### CNAME Record (www uchun):

```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

### Eski DNS recordlarni o'chirish:

Agar oldingi DNS sozlamalar bo'lsa (masalan, boshqa A yoki CNAME recordlar), ularni o'chiring.

---

## 5️⃣ Tekshirish

### DNS Propagation kutish:

DNS o'zgarishlar 10-30 daqiqa ichida tarqaladi.

### Tekshirish:

1. **Vercel Dashboard'da:**
   - Settings > Domains
   - `eduprocrm.uz` yonida "Valid Configuration" ko'rinishi kerak

2. **Brauzerda:**
   - https://eduprocrm.uz ochib ko'ring
   - HTTPS avtomatik ishlashi kerak (Vercel SSL sertifikat beradi)

---

## 🎉 Tayyor!

Sizning CRM tizimingiz:
- ✅ Supabase database bilan ulangan
- ✅ Custom domain bilan ishlayapti
- ✅ HTTPS bilan xavfsiz

**URL:** https://eduprocrm.uz

---

## 🔧 Muammolarni Hal Qilish

### "Invalid Configuration" xatosi:

- DNS sozlamalarni qayta tekshiring
- 30 daqiqa kutib, qayta urinib ko'ring

### Domain ochilmayapti:

```bash
# DNS tekshirish (PowerShell)
nslookup eduprocrm.uz
```

Natijada `76.76.21.21` ko'rinishi kerak.

### Supabase ulanmayapti:

```bash
# Environment variables tekshirish
vercel env ls
```

`VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` ro'yxatda bo'lishi kerak.
