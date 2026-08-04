-- ============================================================================
-- 6-qadam: Markaz O'ZI ro'yxatdan o'tadi (landing'dagi "Bepul sinab ko'ring")
--
-- Avval yangi markazni faqat creator qo'lda ochardi. Endi anon chaqiradigan
-- register_center() bor. Suiiste'moldan himoya:
--   - telefon va login takrorlanmaydi (mavjudlari bilan solishtiriladi),
--   - sinov muddati avtomatik 14 kun (landing va'dasi bilan bir xil),
--   - tezlik cheklovi: bitta IP'dan soatiga 5 urinish / sutkasiga 2 ta
--     muvaffaqiyatli ro'yxat; butun tizim bo'yicha sutkasiga 30 ta.
--   Barcha urinishlar audit_log'ga IP bilan yoziladi.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Mijoz IP'si. nginx X-Real-IP sarlavhasini qo'shadi, PostgREST esa uni
-- request.headers ichida beradi. Topilmasa bo'sh qator.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.client_ip() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.headers', true), '')::json ->> 'x-real-ip',
    NULLIF(split_part(
      COALESCE(NULLIF(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''),
      ',', 1), ''),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.register_center(
  p_center_name text,
  p_phone       text,
  p_admin_name  text,
  p_username    text,
  p_password    text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_ip        text := auth.client_ip();
  v_phone     text := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_username  text := lower(trim(COALESCE(p_username, '')));
  v_center_id text := gen_random_uuid()::text;
  v_admin_id  text := gen_random_uuid()::text;
  v_expiry    text := to_char(now() + interval '14 days', 'YYYY-MM-DD');
  v_now       int  := extract(epoch FROM now())::int;
  v_token     text;
BEGIN
  -- Tezlik cheklovi (IP bo'yicha va umumiy)
  IF v_ip <> '' AND (SELECT count(*) FROM audit_log
        WHERE ip = v_ip AND action LIKE 'REGISTER%'
          AND at > now() - interval '1 hour') >= 5 THEN
    RETURN json_build_object('error', 'rate_limited');
  END IF;
  IF v_ip <> '' AND (SELECT count(*) FROM audit_log
        WHERE ip = v_ip AND action = 'REGISTER_OK'
          AND at > now() - interval '24 hours') >= 2 THEN
    RETURN json_build_object('error', 'rate_limited');
  END IF;
  IF (SELECT count(*) FROM audit_log
        WHERE action = 'REGISTER_OK'
          AND at > now() - interval '24 hours') >= 30 THEN
    RETURN json_build_object('error', 'rate_limited');
  END IF;

  -- Maydonlar
  IF length(trim(COALESCE(p_center_name, ''))) < 3 THEN
    RETURN json_build_object('error', 'invalid_center_name');
  END IF;
  IF length(trim(COALESCE(p_admin_name, ''))) < 3 THEN
    RETURN json_build_object('error', 'invalid_admin_name');
  END IF;
  IF v_username !~ '^[a-z0-9_.]{4,30}$' THEN
    RETURN json_build_object('error', 'invalid_username');
  END IF;
  IF length(COALESCE(p_password, '')) < 6 THEN
    RETURN json_build_object('error', 'weak_password');
  END IF;
  IF length(v_phone) < 9 OR length(v_phone) > 15 THEN
    RETURN json_build_object('error', 'invalid_phone');
  END IF;

  -- Takrorlar
  IF EXISTS (SELECT 1 FROM users WHERE lower(username) = v_username) THEN
    INSERT INTO audit_log (username, action, detail, ip)
    VALUES (v_username, 'REGISTER_FAIL', 'login band', NULLIF(v_ip, ''));
    RETURN json_build_object('error', 'username_exists');
  END IF;
  IF EXISTS (SELECT 1 FROM settings
             WHERE regexp_replace(COALESCE(phone, ''), '\D', '', 'g') = v_phone) THEN
    INSERT INTO audit_log (username, action, detail, ip)
    VALUES (v_username, 'REGISTER_FAIL', 'telefon band: ' || v_phone, NULLIF(v_ip, ''));
    RETURN json_build_object('error', 'phone_exists');
  END IF;

  -- Markaz + direktor. Parol darrov bcrypt.
  INSERT INTO settings ("centerId", "centerName", address, phone, "botToken",
                        "notifyAttendance", "notifyPayment",
                        "standardTeacherPercentage", "licenseExpiry", "isBlocked")
  VALUES (v_center_id, trim(p_center_name), '', trim(p_phone), '',
          true, true, 40, v_expiry, false);

  INSERT INTO users (id, "centerId", name, username, password, role,
                     "groupIds", "salaryPercentage")
  VALUES (v_admin_id, v_center_id, trim(p_admin_name), v_username,
          crypt(p_password, gen_salt('bf', 10)), 'DIRECTOR', '{}', 100);

  INSERT INTO audit_log ("centerId", "userId", username, action, detail, ip)
  VALUES (v_center_id, v_admin_id, v_username, 'REGISTER_OK',
          trim(p_center_name) || ' · sinov ' || v_expiry || ' gacha', NULLIF(v_ip, ''));

  -- Darrov tizimga kiritib yuboramiz (login bilan bir xil propusk)
  v_token := auth.sign_jwt(
    json_build_object(
      'role', 'authenticated', 'iss', 'crm-vps',
      'sub', v_admin_id, 'username', v_username,
      'centerId', v_center_id, 'user_role', 'DIRECTOR',
      'iat', v_now, 'exp', v_now + 60 * 60 * 12
    ),
    current_setting('app.jwt_secret', true)
  );

  RETURN json_build_object(
    'token', v_token,
    'trialUntil', v_expiry,
    'user', json_build_object(
      'id', v_admin_id, 'username', v_username, 'name', trim(p_admin_name),
      'role', 'DIRECTOR', 'centerId', v_center_id
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_center(text, text, text, text, text) TO anon, authenticated;
