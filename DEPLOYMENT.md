# 🚀 EduControl Pro - Online Deploy Qilish Qo'llanmasi

Bu qo'llanma sizga **EduControl Pro CRM** loyihangizni online ishga tushirishda yordam beradi.

---

## 📋 Talab qilinadigan narsalar

- ✅ Node.js (v18 yoki yuqori)
- ✅ Supabase account (bepul)
- ✅ Vercel yoki Netlify account (bepul)
- ✅ Gemini API key (ixtiyoriy, AI funksiyalar uchun)

---

## 1️⃣ Supabase Database Sozlash

### 1.1 Supabase Project Yaratish

1. [Supabase](https://supabase.com) saytiga kiring
2. "New Project" tugmasini bosing
3. Project nomini kiriting: `educontrol-pro`
4. Database parolini yarating va saqlang
5. Region tanlang (eng yaqinini tanlang, masalan: Singapore)
6. "Create new project" tugmasini bosing

### 1.2 Database Schema Yaratish

1. Supabase dashboard'da **SQL Editor** bo'limiga o'ting
2. "New query" tugmasini bosing
3. `supabase-schema.sql` faylidagi barcha SQL kodini nusxalang
4. SQL Editor'ga joylashtiring
5. "Run" tugmasini bosing (yoki `Ctrl+Enter`)

✅ Barcha jadvallar muvaffaqiyatli yaratildi!

### 1.3 API Keys Olish

1. Supabase dashboard'da **Settings** > **API** bo'limiga o'ting
2. Quyidagi ma'lumotlarni nusxalang:
   - **Project URL** (masalan: `https://xxxxx.supabase.co`)
   - **anon/public key** (uzun string)

📝 Bu ma'lumotlarni xavfsiz joyda saqlang!

---

## 2️⃣ Loyihani Tayyorlash

### 2.1 Dependencies O'rnatish

```bash
cd c:\anti\gravity\educontrol-pro
npm install
```

### 2.2 Environment Variables Sozlash

`.env.production` faylini oching va quyidagi ma'lumotlarni to'ldiring:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

**Qayerdan olish:**
- `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` - Supabase Settings > API
- `GEMINI_API_KEY` - [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2.3 Local Test Qilish

```bash
npm run build
npm run preview
```

Brauzerda `http://localhost:4173` ochiladi. Agar hammasi ishlasa, deploy qilishga tayyorsiz! ✅

---

## 3️⃣ Vercel orqali Deploy Qilish (Tavsiya etiladi)

### 3.1 Vercel Account Yaratish

1. [Vercel](https://vercel.com) saytiga kiring
2. GitHub, GitLab yoki Email orqali ro'yxatdan o'ting

### 3.2 Loyihani Deploy Qilish

**Variant A: GitHub orqali (Tavsiya etiladi)**

1. GitHub'da yangi repository yarating
2. Loyihani GitHub'ga yuklang:
   ```bash
   cd c:\anti\gravity\educontrol-pro
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username/educontrol-pro.git
   git push -u origin main
   ```
3. Vercel dashboard'da "New Project" bosing
4. GitHub repository'ni tanlang
5. "Import" bosing

**Variant B: Vercel CLI orqali**

```bash
npm install -g vercel
cd c:\anti\gravity\educontrol-pro
vercel
```

### 3.3 Environment Variables Qo'shish

1. Vercel dashboard'da loyihangizni oching
2. **Settings** > **Environment Variables** bo'limiga o'ting
3. Quyidagi o'zgaruvchilarni qo'shing:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production |
| `GEMINI_API_KEY` | `AIzaSy...` | Production |

4. "Save" bosing
5. **Deployments** > **Redeploy** bosing

✅ Loyihangiz online! URL: `https://educontrol-pro.vercel.app`

---

## 4️⃣ Netlify orqali Deploy Qilish

### 4.1 Netlify Account Yaratish

1. [Netlify](https://netlify.com) saytiga kiring
2. GitHub, GitLab yoki Email orqali ro'yxatdan o'ting

### 4.2 Loyihani Deploy Qilish

**Variant A: Drag & Drop**

1. Loyihani build qiling:
   ```bash
   npm run build
   ```
2. Netlify dashboard'da "Add new site" > "Deploy manually"
3. `dist` papkasini drag & drop qiling

**Variant B: GitHub orqali**

1. GitHub'da repository yarating (yuqoridagi ko'rsatmalar)
2. Netlify dashboard'da "Add new site" > "Import from Git"
3. GitHub repository'ni tanlang
4. Build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. "Deploy site" bosing

### 4.3 Environment Variables Qo'shish

1. Netlify dashboard'da **Site settings** > **Environment variables**
2. Quyidagi o'zgaruvchilarni qo'shing:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
3. **Deploys** > **Trigger deploy** bosing

✅ Loyihangiz online! URL: `https://educontrol-pro.netlify.app`

---

## 5️⃣ Custom Domain Ulash (Ixtiyoriy)

### Vercel uchun:

1. Vercel dashboard > **Settings** > **Domains**
2. Domeningizni kiriting (masalan: `educontrol.uz`)
3. DNS provideringizda A record qo'shing:
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21`

### Netlify uchun:

1. Netlify dashboard > **Domain settings** > **Add custom domain**
2. Domeningizni kiriting
3. DNS provideringizda CNAME record qo'shing:
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-site.netlify.app`

---

## 6️⃣ Test va Tekshirish

Deploy qilingan saytni ochib, quyidagilarni tekshiring:

- ✅ Sahifa to'g'ri yuklanmoqda
- ✅ Supabase ulanishi ishlayapti
- ✅ Ma'lumotlar saqlanmoqda
- ✅ Davomat, to'lovlar, o'quvchilar bo'limlari ishlayapti
- ✅ Mobile versiya to'g'ri ko'rinmoqda

---

## 🔧 Muammolarni Hal Qilish

### Supabase ulanmayapti

1. `.env.production` faylidagi URL va Key to'g'riligini tekshiring
2. Hosting platformasida environment variables to'g'ri sozlanganini tekshiring
3. Supabase dashboard'da RLS policies yoqilganini tekshiring

### Build xatosi

```bash
# Cache tozalash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### 404 Error (SPA routing)

- Vercel: `vercel.json` fayli mavjudligini tekshiring
- Netlify: `netlify.toml` fayli mavjudligini tekshiring

---

## 📞 Yordam

Agar muammo yuzaga kelsa:
- Supabase: [docs.supabase.com](https://docs.supabase.com)
- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Netlify: [docs.netlify.com](https://docs.netlify.com)

---

## 🎉 Tabriklaymiz!

Sizning **EduControl Pro CRM** loyihangiz muvaffaqiyatli online ishga tushdi! 🚀

**Keyingi qadamlar:**
- 🔐 Authentication qo'shish (Supabase Auth)
- 📊 Analytics qo'shish (Google Analytics)
- 🔔 Push notifications sozlash
- 💳 To'lov tizimini integratsiya qilish
