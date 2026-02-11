-- Natijalar jadvali
CREATE TABLE IF NOT EXISTS results (
  id TEXT PRIMARY KEY,
  "centerId" TEXT,
  "studentId" TEXT,
  "studentName" TEXT,
  type TEXT DEFAULT 'OTHER',
  title TEXT,
  score TEXT,
  date TEXT,
  description TEXT,
  "certificateImage" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policy
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for results" ON results
  FOR ALL USING (true) WITH CHECK (true);
