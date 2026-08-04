-- ============================================================================
-- 3-qadam: RLS — markazlarni bazaning O'ZI ajratadi
--
-- Oldin: ajratish faqat brauzerdagi .filter() da edi, ya'ni "iltimos".
-- Endi:  har so'rovga propuskdagi centerId qo'llanadi. Propusksiz (anon)
--        so'rovga hech narsa ko'rinmaydi.
--
-- GLOBAL — super admin, hammasini ko'radi.
-- Platforma testlari (00000000-...-0001) — barcha markazga ko'rinadi.
-- ============================================================================

CREATE OR REPLACE FUNCTION auth.jwt_center() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'centerId',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION auth.is_global() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT auth.jwt_center() = 'GLOBAL';
$$;

-- ---------------------------------------------------------------------------
-- Oddiy jadvallar: faqat o'z markazi
-- ---------------------------------------------------------------------------
DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'students','groups','attendance','payments','expenses','settings',
    'leads','library','results','users','test_templates','ielts_attempts'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS center_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY center_isolation ON %I FOR ALL '
      'USING (auth.is_global() OR "centerId" = auth.jwt_center()) '
      'WITH CHECK (auth.is_global() OR "centerId" = auth.jwt_center())', t);
  END LOOP;
END
$do$;

-- ---------------------------------------------------------------------------
-- IELTS kontenti: o'z markazi + platforma testlari (hammaga ochiq)
-- ---------------------------------------------------------------------------
DO $do$
DECLARE
  t text;
  platform text := '00000000-0000-0000-0000-000000000001';
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'ielts_reading_questions','ielts_listening_questions',
    'ielts_writing_tasks','ielts_speaking_questions'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS center_isolation ON %I', t);
    EXECUTE format(
      'CREATE POLICY center_isolation ON %I FOR ALL '
      'USING (auth.is_global() OR "centerId" = auth.jwt_center() OR "centerId" = %L) '
      'WITH CHECK (auth.is_global() OR "centerId" = auth.jwt_center())', t, platform);
  END LOOP;
END
$do$;

-- ielts_tests — ikkita ustun bor (center_id va centerId)
ALTER TABLE ielts_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS center_isolation ON ielts_tests;
CREATE POLICY center_isolation ON ielts_tests FOR ALL
  USING (
    auth.is_global()
    OR COALESCE(center_id, "centerId") = auth.jwt_center()
    OR COALESCE(center_id, "centerId") = '00000000-0000-0000-0000-000000000001'
  )
  WITH CHECK (auth.is_global() OR COALESCE(center_id, "centerId") = auth.jwt_center());

-- ielts_test_pins — markaz ustuni yo'q, PIN ni yaratgan markaz created_by da
ALTER TABLE ielts_test_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS center_isolation ON ielts_test_pins;
CREATE POLICY center_isolation ON ielts_test_pins FOR ALL
  USING (auth.is_global() OR COALESCE(created_by, "createdBy") = auth.jwt_center())
  WITH CHECK (auth.is_global() OR COALESCE(created_by, "createdBy") = auth.jwt_center());
