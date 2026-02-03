# 🚀 Vercel orqali Deploy Qilish - Qadamma-qadam

## Usul 1: Vercel CLI (Tavsiya etiladi - Eng oson)

### 1-qadam: Vercel CLI o'rnatish

```bash
npm install -g vercel
```

### 2-qadam: Vercel'ga kirish

```bash
vercel login
```

Bu buyruq brauzeringizni ochadi va Vercel accountingizga kirishni so'raydi.

**Agar accountingiz yo'q bo'lsa:**
- Email, GitHub, GitLab yoki Bitbucket orqali ro'yxatdan o'ting
- Bepul plan yetarli!

### 3-qadam: Loyihani deploy qilish

```bash
cd c:\anti\gravity\educontrol-pro
vercel
```

**Savollarga javoblar:**

1. **Set up and deploy?** → `Y` (Yes)
2. **Which scope?** → O'zingizning accountingizni tanlang
3. **Link to existing project?** → `N` (No)
4. **What's your project's name?** → `educontrol-pro` (yoki o'zingiz xohlagan nom)
5. **In which directory is your code located?** → `./` (Enter bosing)
6. **Want to override the settings?** → `N` (No)

✅ Deploy boshlandi! 1-2 daqiqa kutib turing.

### 4-qadam: Environment Variables qo'shish

Deploy tugagandan keyin, environment variables qo'shish kerak:

```bash
vercel env add VITE_SUPABASE_URL
```

Supabase URL ni kiriting va `Production` tanlang.

```bash
vercel env add VITE_SUPABASE_ANON_KEY
```

Supabase Anon Key ni kiriting va `Production` tanlang.

```bash
vercel env add GEMINI_API_KEY
```

Gemini API key ni kiriting va `Production` tanlang.

### 5-qadam: Qayta deploy qilish

Environment variables qo'shgandan keyin, qayta deploy qiling:

```bash
vercel --prod
```

✅ **Tayyor!** Sizning saytingiz online: `https://educontrol-pro.vercel.app`

---

## Usul 2: Vercel Dashboard orqali (GitHub bilan)

### 1-qadam: GitHub repository yaratish

```bash
cd c:\anti\gravity\educontrol-pro
git init
git add .
git commit -m "Initial commit - EduControl Pro CRM"
git branch -M main
```

GitHub'da yangi repository yarating: `educontrol-pro`

```bash
git remote add origin https://github.com/USERNAME/educontrol-pro.git
git push -u origin main
```

### 2-qadam: Vercel'da import qilish

1. [vercel.com](https://vercel.com) ga kiring
2. **"Add New Project"** tugmasini bosing
3. **"Import Git Repository"** tanlang
4. GitHub accountingizni ulang
5. `educontrol-pro` repository'ni tanlang
6. **"Import"** bosing

### 3-qadam: Build Settings tekshirish

Vercel avtomatik aniqlaydi:
- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

✅ Hammasi to'g'ri bo'lsa, **"Deploy"** bosing!

### 4-qadam: Environment Variables qo'shish

1. Deploy tugagandan keyin, **"Project Settings"** ga o'ting
2. **"Environment Variables"** bo'limini oching
3. Quyidagi o'zgaruvchilarni qo'shing:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Production |
| `GEMINI_API_KEY` | `AIzaSy...` | Production |

4. **"Save"** bosing
5. **"Deployments"** tabiga o'ting
6. Oxirgi deployment'ni toping va **"Redeploy"** bosing

✅ **Tayyor!** Saytingiz ishlayapti!

---

## 🔗 Custom Domain Ulash (Ixtiyoriy)

### Agar o'z domeningiz bo'lsa (masalan: educontrol.uz)

1. Vercel dashboard'da **"Settings"** > **"Domains"**
2. Domeningizni kiriting: `educontrol.uz`
3. **"Add"** bosing
4. DNS provideringizda (masalan: Beget, Uzinfocom) quyidagi recordlarni qo'shing:

**A Record:**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

**CNAME Record (www uchun):**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

5. 10-30 daqiqa kutib turing (DNS propagation)

✅ Domeningiz tayyor: `https://educontrol.uz`

---

## 🔧 Muammolarni Hal Qilish

### "Command not found: vercel"

```bash
npm install -g vercel
```

Agar ishlamasa, PowerShell'ni Administrator sifatida oching.

### Build xatosi

Local'da test qiling:
```bash
npm run build
```

Agar local'da ishlasa, environment variables tekshiring.

### Supabase ulanmayapti

1. Vercel dashboard > Settings > Environment Variables
2. `VITE_SUPABASE_URL` va `VITE_SUPABASE_ANON_KEY` to'g'riligini tekshiring
3. Redeploy qiling

---

## 📊 Deployment Status Tekshirish

```bash
vercel ls
```

Barcha deploymentlaringizni ko'rsatadi.

```bash
vercel logs
```

Oxirgi deployment loglarini ko'rsatadi.

---

## 🎉 Tabriklaymiz!

Sizning CRM tizimingiz online! 🚀

**URL:** `https://educontrol-pro.vercel.app` (yoki custom domeningiz)
