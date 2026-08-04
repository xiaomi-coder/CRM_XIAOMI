-- ============================================================================
-- 2-qadam: super admin bazada + PIN tekshiruvi bazada
--
-- Nega kerak: RLS yoqilgach anon roli jadvallarni to'g'ridan-to'g'ri o'qiy
-- olmaydi. Hozir esa (a) creator faqat frontendda yozilgan, (b) PIN oqimi
-- BARCHA markazning lidlarini yuklab ichidan qidiradi. Ikkalasi ham
-- bazadagi funksiyaga ko'chiriladi.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Super admin — endi haqiqiy foydalanuvchi. Paroli bcrypt.
-- ---------------------------------------------------------------------------
INSERT INTO users (id, "centerId", name, username, password, role)
SELECT 'SUPER_ADMIN_ID', 'GLOBAL', 'Super Admin', 'creator',
       crypt('xiaomicoder', gen_salt('bf', 10)), 'SUPER_ADMIN'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'creator');

-- ---------------------------------------------------------------------------
-- PIN bilan kirish. IELTS PIN yoki eski test PIN — ikkalasi ham shu yerda.
-- Mehmonga cheklangan propusk beriladi (faqat o'sha markaz doirasida).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_pin(p_pin text, p_student_name text DEFAULT '')
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_pin     record;
  v_test    record;
  v_lead    record;
  v_center  text;
  v_token   text;
  v_now     int := extract(epoch FROM now())::int;
BEGIN
  -- 1) IELTS test PIN
  SELECT * INTO v_pin FROM ielts_test_pins
   WHERE pin_code = p_pin AND status = 'active' LIMIT 1;

  IF FOUND THEN
    SELECT * INTO v_test FROM ielts_tests WHERE id = v_pin.test_id LIMIT 1;
    v_center := COALESCE(v_test.center_id, v_test."centerId", 'GLOBAL');

    UPDATE ielts_test_pins
       SET used_count = COALESCE(used_count, 0) + 1
     WHERE id = v_pin.id;

    v_token := auth.sign_jwt(
      json_build_object(
        'role', 'authenticated', 'iss', 'crm-vps',
        'sub', 'guest_' || p_pin, 'username', 'student_' || p_pin,
        'centerId', v_center, 'user_role', 'STUDENT',
        'iat', v_now, 'exp', v_now + 60 * 60 * 6   -- imtihonga 6 soat yetadi
      ),
      current_setting('app.jwt_secret', true)
    );

    RETURN json_build_object('kind', 'ielts', 'testId', v_pin.test_id,
                             'centerId', v_center, 'token', v_token);
  END IF;

  -- 2) Eski test PIN (lidga biriktirilgan)
  SELECT * INTO v_lead FROM leads
   WHERE "testPin" = p_pin AND "testStatus" = 'PENDING' LIMIT 1;

  IF FOUND THEN
    v_token := auth.sign_jwt(
      json_build_object(
        'role', 'authenticated', 'iss', 'crm-vps',
        'sub', 'guest_' || p_pin, 'username', 'lead_' || v_lead.id,
        'centerId', v_lead."centerId", 'user_role', 'STUDENT',
        'iat', v_now, 'exp', v_now + 60 * 60 * 6
      ),
      current_setting('app.jwt_secret', true)
    );

    RETURN json_build_object(
      'kind', 'quiz', 'token', v_token,
      'lead', row_to_json(v_lead),
      'template', (SELECT row_to_json(t) FROM test_templates t WHERE t.id = v_lead."testId")
    );
  END IF;

  RETURN json_build_object('error', 'invalid_pin');
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_pin(text, text) TO anon, authenticated;
