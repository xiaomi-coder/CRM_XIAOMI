-- EduControl Pro - Multi-tenancy Update (SaaS)
-- Bu skript barcha jadvallarga 'centerId' qo'shadi va yetishmayotgan jadvallarni yaratadi.

-- 1. Yetishmayotgan jadvallarni yaratish

-- USERS jadvali (Login tizimi uchun)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  password TEXT NOT NULL, -- Eslatma: Haqiqiy productionda hashlanishi kerak
  name TEXT,
  role TEXT,
  centerId TEXT, -- UUID emas, chunki masalan 'GLOBAL' bo'lishi mumkin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LEADS jadvali (Lidlar uchun)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  status TEXT,
  source TEXT,+
  centerId TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- LIBRARY jadvali (Kutubxona uchun)
CREATE TABLE IF NOT EXISTS library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  link TEXT,
  type TEXT,
  uploadedBy TEXT,
  uploadedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  centerId TEXT
);

-- 2. Mavjud jadvallarga centerId qo'shish (agar yo'q bo'lsa)

DO $$ 
BEGIN 
    -- Students
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'centerId') THEN
        ALTER TABLE students ADD COLUMN "centerId" TEXT;
        CREATE INDEX idx_students_centerId ON students("centerId");
    END IF;

    -- Groups
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'groups' AND column_name = 'centerId') THEN
        ALTER TABLE groups ADD COLUMN "centerId" TEXT;
        CREATE INDEX idx_groups_centerId ON groups("centerId");
    END IF;

    -- Teachers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'centerId') THEN
        ALTER TABLE teachers ADD COLUMN "centerId" TEXT;
        CREATE INDEX idx_teachers_centerId ON teachers("centerId");
    END IF;

    -- Attendance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'centerId') THEN
        ALTER TABLE attendance ADD COLUMN "centerId" TEXT;
        CREATE INDEX idx_attendance_centerId ON attendance("centerId");
    END IF;

    -- Payments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'centerId') THEN
        ALTER TABLE payments ADD COLUMN "centerId" TEXT;
        CREATE INDEX idx_payments_centerId ON payments("centerId");
    END IF;

    -- Expenses
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'centerId') THEN
        ALTER TABLE expenses ADD COLUMN "centerId" TEXT;
        CREATE INDEX idx_expenses_centerId ON expenses("centerId");
    END IF;
END $$;

-- 3. RLS Policies (Xavfsizlik)
-- Hozircha oddiy policies, keyinchalik Supabase Auth ga o'tganda kuchaytiriladi.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE library ENABLE ROW LEVEL SECURITY;

-- Hammaga ruxsat berish (Hozirgi Auth tizimi uchun kerak)
CREATE POLICY "Enable all for users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for leads" ON leads FOR ALL USING (true);
CREATE POLICY "Enable all for library" ON library FOR ALL USING (true);
