-- ==========================================
-- IELTS Mock Exam System — Supabase Schema
-- ==========================================

-- IELTS Attempts (asosiy jadval)
CREATE TABLE IF NOT EXISTS ielts_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" UUID NOT NULL,
  "studentId" UUID,
  "studentName" TEXT NOT NULL,
  "examType" TEXT NOT NULL DEFAULT 'academic' CHECK ("examType" IN ('academic', 'general')),
  "startTime" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "endTime" TIMESTAMPTZ,
  "readingStatus" TEXT DEFAULT 'not_started',
  "listeningStatus" TEXT DEFAULT 'not_started',
  "writingStatus" TEXT DEFAULT 'not_started',
  "speakingStatus" TEXT DEFAULT 'not_started',
  "readingScore" DECIMAL(3,1),
  "listeningScore" DECIMAL(3,1),
  "writingScore" DECIMAL(3,1),
  "speakingScore" DECIMAL(3,1),
  "overallScore" DECIMAL(3,1),
  "readingAnswers" JSONB,
  "listeningAnswers" JSONB,
  "writingTask1Text" TEXT,
  "writingTask2Text" TEXT,
  "writingTask1Scores" JSONB,
  "writingTask2Scores" JSONB,
  "speakingScores" JSONB,
  status TEXT DEFAULT 'not_started',
  "leadId" UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Reading Questions
CREATE TABLE IF NOT EXISTS ielts_reading_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" UUID NOT NULL,
  "examType" TEXT NOT NULL DEFAULT 'academic',
  "passageNumber" INT NOT NULL CHECK ("passageNumber" BETWEEN 1 AND 3),
  "passageTitle" TEXT NOT NULL,
  "passageText" TEXT NOT NULL,
  "questionNumber" INT NOT NULL,
  "questionType" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  options JSONB,
  "correctAnswer" TEXT NOT NULL,
  points INT DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Listening Questions
CREATE TABLE IF NOT EXISTS ielts_listening_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" UUID NOT NULL,
  "examType" TEXT NOT NULL DEFAULT 'academic',
  "sectionNumber" INT NOT NULL CHECK ("sectionNumber" BETWEEN 1 AND 4),
  "sectionTitle" TEXT NOT NULL,
  "audioUrl" TEXT DEFAULT 'placeholder',
  "questionNumber" INT NOT NULL,
  "questionType" TEXT NOT NULL,
  "questionText" TEXT NOT NULL,
  options JSONB,
  "correctAnswer" TEXT NOT NULL,
  points INT DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Writing Tasks
CREATE TABLE IF NOT EXISTS ielts_writing_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" UUID NOT NULL,
  "examType" TEXT NOT NULL DEFAULT 'academic',
  "taskNumber" INT NOT NULL CHECK ("taskNumber" IN (1, 2)),
  "taskPrompt" TEXT NOT NULL,
  "taskImageUrl" TEXT,
  "wordLimitMin" INT DEFAULT 150,
  "timeMinutes" INT DEFAULT 60,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Speaking Questions
CREATE TABLE IF NOT EXISTS ielts_speaking_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" UUID NOT NULL,
  "partNumber" INT NOT NULL CHECK ("partNumber" BETWEEN 1 AND 3),
  "questionText" TEXT NOT NULL,
  "cueCardTopic" TEXT,
  "cueCardPoints" JSONB,
  "preparationTime" INT,
  "speakingTime" INT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Band Conversion Table
CREATE TABLE IF NOT EXISTS ielts_band_conversion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "examType" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "rawScore" INT NOT NULL,
  "bandScore" DECIMAL(3,1) NOT NULL,
  UNIQUE ("examType", "section", "rawScore")
);

-- ==========================================
-- RLS (Row Level Security) Policies
-- ==========================================

ALTER TABLE ielts_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_reading_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_listening_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_writing_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_speaking_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_band_conversion ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (simplified)
CREATE POLICY "Allow all for authenticated" ON ielts_attempts FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ielts_reading_questions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ielts_listening_questions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ielts_writing_tasks FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ielts_speaking_questions FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated" ON ielts_band_conversion FOR ALL USING (true);

-- ==========================================
-- Indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_ielts_attempts_center ON ielts_attempts ("centerId");
CREATE INDEX IF NOT EXISTS idx_ielts_reading_center ON ielts_reading_questions ("centerId", "examType");
CREATE INDEX IF NOT EXISTS idx_ielts_listening_center ON ielts_listening_questions ("centerId", "examType");
CREATE INDEX IF NOT EXISTS idx_ielts_writing_center ON ielts_writing_tasks ("centerId", "examType");
CREATE INDEX IF NOT EXISTS idx_ielts_speaking_center ON ielts_speaking_questions ("centerId");
