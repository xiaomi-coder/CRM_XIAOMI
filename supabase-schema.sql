-- EduControl Pro CRM - Database Schema
-- Supabase PostgreSQL Database

-- 1. Students jadvali
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  groupId UUID,
  balance NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Groups jadvali
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  teacherId UUID,
  schedule TEXT,
  monthlyFee NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Teachers jadvali
CREATE TABLE IF NOT EXISTS teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  salary NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Attendance jadvali
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID REFERENCES students(id) ON DELETE CASCADE,
  groupId UUID REFERENCES groups(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Payments jadvali
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studentId UUID REFERENCES students(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment', 'expense', 'salary')),
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Expenses jadvali
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Settings jadvali
CREATE TABLE IF NOT EXISTS settings (
  centerId UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  centerName TEXT,
  phone TEXT,
  address TEXT,
  telegramBotToken TEXT,
  telegramChatId TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign Key Constraints qo'shish
ALTER TABLE students 
  ADD CONSTRAINT fk_students_group 
  FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE SET NULL;

ALTER TABLE groups 
  ADD CONSTRAINT fk_groups_teacher 
  FOREIGN KEY (teacherId) REFERENCES teachers(id) ON DELETE SET NULL;

-- Indexes yaratish (performance uchun)
CREATE INDEX IF NOT EXISTS idx_students_groupId ON students(groupId);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_groups_teacherId ON groups(teacherId);
CREATE INDEX IF NOT EXISTS idx_attendance_studentId ON attendance(studentId);
CREATE INDEX IF NOT EXISTS idx_attendance_groupId ON attendance(groupId);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_payments_studentId ON payments(studentId);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- Row Level Security (RLS) yoqish
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public access policies (hozircha barcha ma'lumotlarga ruxsat)
-- Keyinchalik authentication qo'shilganda bu policylarni o'zgartirish kerak

CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON students FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON students FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON groups FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON groups FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON groups FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON groups FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON teachers FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON teachers FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON teachers FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON teachers FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON attendance FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON attendance FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON attendance FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON payments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON payments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON payments FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON expenses FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON expenses FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON expenses FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON settings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON settings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON settings FOR DELETE USING (true);

-- Trigger funksiyasi: updated_at avtomatik yangilash
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggerlarni qo'shish
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
