-- FIX DATABASE SCHEMA
-- Frontend kodi talab qiladigan, lekin bazada yetishmayotgan ustunlarni qo'shish.

-- 1. SETTINGS jadvalini to'ldirish
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "botToken" TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "notifyAttendance" BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "notifyPayment" BOOLEAN DEFAULT true;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "standardTeacherPercentage" NUMERIC DEFAULT 40;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "licenseExpiry" DATE;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN DEFAULT false;

-- 2. USERS jadvalini to'ldirish
ALTER TABLE users ADD COLUMN IF NOT EXISTS "groupIds" TEXT[]; -- Guruhlar ro'yxati
ALTER TABLE users ADD COLUMN IF NOT EXISTS "salaryPercentage" NUMERIC DEFAULT 0;

-- 3. STUDENTS jadvalini to'ldirish (Telegram integratsiyasi uchun)
ALTER TABLE students ADD COLUMN IF NOT EXISTS "tgEnabled" BOOLEAN DEFAULT false;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "tgConnectionCode" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "lastGroup" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "exitDate" DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "lastTeacher" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "nextPaymentDate" DATE;

-- 4. Xavfsizlik uchun qshimcha (agar oldin qilinmagan bo'lsa)
-- Settings jadvaliga INSERT qilishga ruxsat bormi?
DROP POLICY IF EXISTS "Enable insert for all settings" ON settings;
CREATE POLICY "Enable insert for all settings" ON settings FOR INSERT WITH CHECK (true);

-- Users jadvaliga INSERT qilishga ruxsat bormi?
DROP POLICY IF EXISTS "Enable insert for all users" ON users;
CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
