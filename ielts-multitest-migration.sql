-- EXISTING TABLES (for context):
-- ielts_attempts, ielts_reading_questions, ielts_listening_questions, ielts_writing_tasks, ielts_speaking_questions, ielts_band_conversion

-- 1. Create IELTS Tests table
CREATE TABLE IF NOT EXISTS public.ielts_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID NOT NULL,
    title TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('academic', 'general')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create IELTS Test PINs table
CREATE TABLE IF NOT EXISTS public.ielts_test_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.ielts_tests(id) ON DELETE CASCADE,
    pin_code VARCHAR(6) NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    used_count INTEGER DEFAULT 0,
    created_by UUID, -- Director/Admin ID
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Add test_id to Question Tables
ALTER TABLE public.ielts_reading_questions ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES public.ielts_tests(id) ON DELETE CASCADE;
ALTER TABLE public.ielts_listening_questions ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES public.ielts_tests(id) ON DELETE CASCADE;
ALTER TABLE public.ielts_writing_tasks ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES public.ielts_tests(id) ON DELETE CASCADE;
ALTER TABLE public.ielts_speaking_questions ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES public.ielts_tests(id) ON DELETE CASCADE;
ALTER TABLE public.ielts_attempts ADD COLUMN IF NOT EXISTS test_id UUID REFERENCES public.ielts_tests(id) ON DELETE SET NULL;
ALTER TABLE public.ielts_attempts ADD COLUMN IF NOT EXISTS pin_code VARCHAR(6);

-- 4. Enable RLS
ALTER TABLE public.ielts_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ielts_test_pins ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- IELTS TESTS: Allow ALL for public (simplifies Admin usage & allows Students to read titles)
DROP POLICY IF EXISTS "Enable all access for public" ON public.ielts_tests;
CREATE POLICY "Enable all access for public" ON public.ielts_tests USING (true) WITH CHECK (true);

-- IELTS TEST PINS: Allow ALL for public (Admin manages, Students check status)
DROP POLICY IF EXISTS "Enable all access for public" ON public.ielts_test_pins;
CREATE POLICY "Enable all access for public" ON public.ielts_test_pins USING (true) WITH CHECK (true);

-- REMOVE OLD AUTH-ONLY POLICIES TO AVOID CONFLICTS/CONFUSION
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ielts_tests;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.ielts_tests;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.ielts_tests;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.ielts_tests;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.ielts_test_pins;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.ielts_test_pins;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.ielts_test_pins;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.ielts_test_pins;

-- Public access for Questions via Test ID (when validated)
DROP POLICY IF EXISTS "Enable read access for public via test_id" ON public.ielts_reading_questions;
CREATE POLICY "Enable read access for public via test_id" ON public.ielts_reading_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for public via test_id" ON public.ielts_listening_questions;
CREATE POLICY "Enable read access for public via test_id" ON public.ielts_listening_questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for public via test_id" ON public.ielts_writing_tasks;
CREATE POLICY "Enable read access for public via test_id" ON public.ielts_writing_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for public via test_id" ON public.ielts_speaking_questions;
CREATE POLICY "Enable read access for public via test_id" ON public.ielts_speaking_questions FOR SELECT USING (true);

-- Public access for Attempts (to save results)
DROP POLICY IF EXISTS "Enable insert for public" ON public.ielts_attempts;
CREATE POLICY "Enable insert for public" ON public.ielts_attempts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for public" ON public.ielts_attempts;
CREATE POLICY "Enable update for public" ON public.ielts_attempts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Enable read for public" ON public.ielts_attempts;
CREATE POLICY "Enable read for public" ON public.ielts_attempts FOR SELECT USING (true);
