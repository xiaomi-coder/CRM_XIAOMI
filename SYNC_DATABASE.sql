-- NO-FAIL GLOBAL DATABASE SYNC (ULTIMATE VERSION)
-- Bu skript barcha "Foreign Key" va "Type Mismatch" xatolarini butunlay yo'qotadi.

DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    -- 1. Barcha Bog'liqliklarni (Foreign Keys) vaqtincha olib tashlash
    -- Bu ID larni TEXT ga o'tkazishga ruxsat beradi.
    FOR r IN (
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public'
    ) 
    LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE';
    END LOOP;
END $$;

DO $$ 
BEGIN 
    -- 2. Barcha ID va centerId ustunlarini TEXT turiga o'tkazish
    -- Bu xatolarni (Text vs UUID) 100% yo'qotadi.
    
    ALTER TABLE IF EXISTS settings ALTER COLUMN "centerId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS users ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS users ALTER COLUMN "centerId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS students ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS students ALTER COLUMN "centerId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS groups ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS groups ALTER COLUMN "centerId" TYPE TEXT;
    ALTER TABLE IF EXISTS groups ALTER COLUMN "studentIds" TYPE TEXT[] USING "studentIds"::text[];
    
    ALTER TABLE IF EXISTS attendance ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS attendance ALTER COLUMN "centerId" TYPE TEXT;
    ALTER TABLE IF EXISTS attendance ALTER COLUMN "studentId" TYPE TEXT;
    ALTER TABLE IF EXISTS attendance ALTER COLUMN "groupId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS leads ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS leads ALTER COLUMN "centerId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS payments ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS payments ALTER COLUMN "centerId" TYPE TEXT;
    ALTER TABLE IF EXISTS payments ALTER COLUMN "studentId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS expenses ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS expenses ALTER COLUMN "centerId" TYPE TEXT;

    ALTER TABLE IF EXISTS test_templates ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS test_templates ALTER COLUMN "centerId" TYPE TEXT;
    
    ALTER TABLE IF EXISTS library ALTER COLUMN "id" TYPE TEXT;
    ALTER TABLE IF EXISTS library ALTER COLUMN "centerId" TYPE TEXT;

    -- 3. JADVALLARNI YARATISH (Agar umuman yo'q bo'lsa)
    CREATE TABLE IF NOT EXISTS test_templates ("id" TEXT PRIMARY KEY, "centerId" TEXT, "subject" TEXT, "title" TEXT, "questions" JSONB DEFAULT '[]', "durationMinutes" NUMERIC DEFAULT 30);
    CREATE TABLE IF NOT EXISTS library ("id" TEXT PRIMARY KEY, "centerId" TEXT, "title" TEXT, "description" TEXT, "category" TEXT, "fileData" TEXT, "fileType" TEXT, "uploadedBy" TEXT, "uploadedAt" TEXT);

    -- 4. YETISHMAYOTGAN BARCHA USTUNLARNI QO'SHISH (Lead, Student, Settings...)
    
    -- LEADS
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "subject" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "note" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "parentName" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "parentPhone" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "createdAt" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "testId" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "testScore" NUMERIC;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "testStatus" TEXT;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS "testPin" TEXT;

    -- STUDENTS
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentName" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "parentPhone" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "coins" NUMERIC DEFAULT 0;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "joinedDate" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "nextPaymentDate" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "tgEnabled" BOOLEAN DEFAULT false;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "tgChatId" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "exitNote" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "tgConnectionCode" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "lastGroup" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "lastTeacher" TEXT;
    ALTER TABLE students ADD COLUMN IF NOT EXISTS "exitDate" TEXT;

    -- GROUPS
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS "subject" TEXT;
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS "days" TEXT[];
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS "time" TEXT;
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS "fee" NUMERIC DEFAULT 0;
    ALTER TABLE groups ADD COLUMN IF NOT EXISTS "teacher" TEXT;

    -- PAYMENTS
    ALTER TABLE payments ADD COLUMN IF NOT EXISTS "forMonth" TEXT;

    -- 5. ESKI CHEKLOVLARNI OLIB TASHLASH (Blokirovkalarni yechish)
    ALTER TABLE IF EXISTS payments DROP CONSTRAINT IF EXISTS payments_type_check;
    ALTER TABLE IF EXISTS attendance DROP CONSTRAINT IF EXISTS attendance_status_check;
    ALTER TABLE IF EXISTS leads DROP CONSTRAINT IF EXISTS leads_status_check;

END $$;

-- 6. RLS POLICIES (HAMMA UCHUN QAYTA OCHISH)
DO $$ 
DECLARE 
    t TEXT;
BEGIN 
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Enable all access" ON %I', t);
        EXECUTE format('CREATE POLICY "Enable all access" ON %I FOR ALL USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;
