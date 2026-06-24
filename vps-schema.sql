-- ============================================================
-- EduControl Pro CRM — VPS PostgreSQL Schema (PostgREST uchun)
-- Kod (types.ts + komponentlar) asosida tiklangan. Permissiv tiplar:
--   id/centerId/sanalar = TEXT, sonlar = NUMERIC, ro'yxatlar = TEXT[]/JSONB,
--   ichki obyektlar = JSONB. NOT NULL/CHECK/FK qo'yilmagan (frontend mantiqni boshqaradi)
--   => supabase-js yuborgan obyektlar xatosiz tushadi.
-- Ustun nomlari ataylab kod bilan AYNAN bir xil (camelCase yoki snake_case).
-- Idempotent: CREATE TABLE IF NOT EXISTS — qayta ishga tushirish xavfsiz.
-- ============================================================

-- ---------- CORE (camelCase — types.ts) ----------

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  name TEXT,
  username TEXT,
  password TEXT,
  role TEXT,
  "groupIds" TEXT[],
  "salaryPercentage" NUMERIC,
  permissions JSONB
);

CREATE TABLE IF NOT EXISTS settings (
  "centerId" TEXT PRIMARY KEY,
  "centerName" TEXT,
  address TEXT,
  phone TEXT,
  "botToken" TEXT,
  "notifyAttendance" BOOLEAN DEFAULT true,
  "notifyPayment" BOOLEAN DEFAULT true,
  "standardTeacherPercentage" NUMERIC DEFAULT 40,
  "licenseExpiry" TEXT,
  "isBlocked" BOOLEAN DEFAULT false,
  "geminiApiKey" TEXT,
  "reportChatId" TEXT
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  name TEXT,
  phone TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  balance NUMERIC DEFAULT 0,
  coins NUMERIC DEFAULT 0,
  "joinedDate" TEXT,
  "nextPaymentDate" TEXT,
  "tgEnabled" BOOLEAN DEFAULT false,
  "tgChatId" TEXT,
  "tgConnectionCode" TEXT,
  status TEXT DEFAULT 'ACTIVE',
  "lastGroup" TEXT,
  "lastTeacher" TEXT,
  "exitDate" TEXT,
  "exitNote" TEXT
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  name TEXT,
  teacher TEXT,
  subject TEXT,
  days TEXT[],
  time TEXT,
  fee NUMERIC DEFAULT 0,
  "studentIds" TEXT[]
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  date TEXT,
  "studentId" TEXT,
  "groupId" TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "studentId" TEXT,
  "groupId" TEXT,
  amount NUMERIC DEFAULT 0,
  date TEXT,
  type TEXT,
  "forMonth" TEXT
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  title TEXT,
  amount NUMERIC DEFAULT 0,
  date TEXT,
  category TEXT
);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  name TEXT,
  phone TEXT,
  "parentName" TEXT,
  "parentPhone" TEXT,
  subject TEXT,
  status TEXT,
  "createdAt" TEXT,
  note TEXT,
  "testId" TEXT,
  "testScore" NUMERIC,
  "testStatus" TEXT,
  "testPin" TEXT,
  "examBand" NUMERIC,
  "examType" TEXT,
  "examAttemptId" TEXT
);

CREATE TABLE IF NOT EXISTS library (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  "fileData" TEXT,
  "fileType" TEXT,
  "uploadedBy" TEXT,
  "uploadedAt" TEXT
);

CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "studentId" TEXT,
  "studentName" TEXT,
  type TEXT,
  title TEXT,
  score TEXT,
  date TEXT,
  description TEXT,
  "certificateImage" TEXT
);

CREATE TABLE IF NOT EXISTS test_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  subject TEXT,
  title TEXT,
  questions JSONB,
  "durationMinutes" NUMERIC
);

-- ---------- IELTS (5 ta — camelCase, ielts-schema.sql) ----------

CREATE TABLE IF NOT EXISTS ielts_attempts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "studentId" TEXT,
  "studentName" TEXT,
  "examType" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "readingStatus" TEXT DEFAULT 'not_started',
  "listeningStatus" TEXT DEFAULT 'not_started',
  "writingStatus" TEXT DEFAULT 'not_started',
  "speakingStatus" TEXT DEFAULT 'not_started',
  "readingScore" NUMERIC,
  "listeningScore" NUMERIC,
  "writingScore" NUMERIC,
  "speakingScore" NUMERIC,
  "overallScore" NUMERIC,
  "readingAnswers" JSONB,
  "listeningAnswers" JSONB,
  "writingTask1Text" TEXT,
  "writingTask2Text" TEXT,
  "writingTask1Scores" JSONB,
  "writingTask2Scores" JSONB,
  "speakingScores" JSONB,
  status TEXT DEFAULT 'not_started',
  "leadId" TEXT,
  "createdAt" TEXT DEFAULT now()::text,
  "updatedAt" TEXT,
  -- multitest qo'shimchalari (migration snake_case + types camelCase, ikkalasi ham)
  test_id TEXT,
  "testId" TEXT,
  pin_code TEXT,
  "pinCode" TEXT
);

CREATE TABLE IF NOT EXISTS ielts_reading_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "examType" TEXT,
  "passageNumber" INTEGER,
  "passageTitle" TEXT,
  "passageText" TEXT,
  "questionNumber" INTEGER,
  "questionType" TEXT,
  "questionText" TEXT,
  options JSONB,
  "correctAnswer" TEXT,
  points NUMERIC DEFAULT 1,
  "createdAt" TEXT DEFAULT now()::text,
  test_id TEXT
);

CREATE TABLE IF NOT EXISTS ielts_listening_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "examType" TEXT,
  "sectionNumber" INTEGER,
  "sectionTitle" TEXT,
  "audioUrl" TEXT,
  "questionNumber" INTEGER,
  "questionType" TEXT,
  "questionText" TEXT,
  options JSONB,
  "correctAnswer" TEXT,
  points NUMERIC DEFAULT 1,
  "createdAt" TEXT DEFAULT now()::text,
  test_id TEXT
);

CREATE TABLE IF NOT EXISTS ielts_writing_tasks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "examType" TEXT,
  "taskNumber" INTEGER,
  "taskPrompt" TEXT,
  "taskImageUrl" TEXT,
  "wordLimitMin" INTEGER DEFAULT 150,
  "timeMinutes" INTEGER DEFAULT 60,
  "createdAt" TEXT DEFAULT now()::text,
  test_id TEXT
);

CREATE TABLE IF NOT EXISTS ielts_speaking_questions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "centerId" TEXT,
  "examType" TEXT,
  "partNumber" INTEGER,
  "questionText" TEXT,
  "cueCardTopic" TEXT,
  "cueCardPoints" JSONB,
  "preparationTime" INTEGER,
  "speakingTime" INTEGER,
  "createdAt" TEXT DEFAULT now()::text,
  test_id TEXT
);

-- ---------- IELTS MULTITEST (2 ta — snake_case, migration; + camelCase nusxa) ----------

CREATE TABLE IF NOT EXISTS ielts_tests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  center_id TEXT,
  "centerId" TEXT,
  title TEXT,
  exam_type TEXT,
  "examType" TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT now()::text,
  "createdAt" TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS ielts_test_pins (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  test_id TEXT,
  "testId" TEXT,
  pin_code TEXT,
  "pinCode" TEXT,
  status TEXT DEFAULT 'active',
  used_count NUMERIC DEFAULT 0,
  "usedCount" NUMERIC,
  created_by TEXT,
  "createdBy" TEXT,
  expires_at TEXT,
  "expiresAt" TEXT,
  created_at TEXT DEFAULT now()::text,
  "createdAt" TEXT
);

-- ---------- Indekslar (centerId bo'yicha tez filtrlash) ----------
CREATE INDEX IF NOT EXISTS idx_users_centerId        ON users("centerId");
CREATE INDEX IF NOT EXISTS idx_users_username        ON users(username);
CREATE INDEX IF NOT EXISTS idx_students_centerId     ON students("centerId");
CREATE INDEX IF NOT EXISTS idx_groups_centerId       ON groups("centerId");
CREATE INDEX IF NOT EXISTS idx_attendance_centerId   ON attendance("centerId");
CREATE INDEX IF NOT EXISTS idx_attendance_studentId  ON attendance("studentId");
CREATE INDEX IF NOT EXISTS idx_payments_centerId     ON payments("centerId");
CREATE INDEX IF NOT EXISTS idx_expenses_centerId     ON expenses("centerId");
CREATE INDEX IF NOT EXISTS idx_leads_centerId        ON leads("centerId");
CREATE INDEX IF NOT EXISTS idx_library_centerId      ON library("centerId");
CREATE INDEX IF NOT EXISTS idx_results_centerId      ON results("centerId");

-- ============================================================
-- GRANTS — PostgREST (anon/authenticated/service_role) uchun
-- Eski Supabase'dagi "allow-all" xatti-harakatini takrorlaydi.
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
