-- ============================================================================
-- 12-qadam: PLATFORMA boti — ro'yxatda Telegram raqam tasdig'i
--
-- Har markazning o'z boti (ota-onalar uchun) ALOHIDA qoladi. Bu — platformaning
-- bitta umumiy boti: (1) ro'yxatdan o'tishda raqamni tasdiqlaydi (Telegram'ning
-- "Raqamni ulashish" tugmasi — soxtalashtirib bo'lmaydi), (2) direktorga sinov
-- muddati eslatmalari boradi, (3) egaga (siz) yangi ro'yxat xabarlari.
--
-- YOQISH (bot token kelganda):
--   INSERT INTO platform_config VALUES ('bot_token', '<TOKEN>'),
--                                      ('bot_username', '<username>'),
--                                      ('owner_chat_id', '<sizning chat id>');
--   + Telegram webhook: https://eduprocrm.uz/api/platform-bot?token=<TOKEN>
-- Config bo'sh ekan hech narsa o'zgarmaydi: register_center eski tartibda
-- ishlaydi (tasdiq talab qilinmaydi).
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_config (
  key   text PRIMARY KEY,
  value text NOT NULL
);
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;  -- API'dan yopiq (GRANT yo'q)

CREATE TABLE IF NOT EXISTS tg_verifications (
  token        text PRIMARY KEY,             -- saytga beriladigan bir martalik kod
  phone_form   text NOT NULL,                -- saytda kiritilgan raqam (raqamlargina)
  phone_tg     text,                         -- Telegram tasdiqlagan raqam (raqamlargina)
  chat_id      text,                         -- direktorning platforma botdagi chati
  tg_name      text,
  status       text NOT NULL DEFAULT 'PENDING',  -- PENDING → VERIFIED → USED
  created_at   timestamptz NOT NULL DEFAULT now(),
  verified_at  timestamptz
);
CREATE INDEX IF NOT EXISTS tg_verif_chat_idx ON tg_verifications (chat_id, status, created_at DESC);
ALTER TABLE tg_verifications ENABLE ROW LEVEL SECURITY;

-- Sozlamalarga direktorning platforma-chat maydoni (sinov eslatmalari uchun)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "platformChatId" TEXT;

-- ---------------------------------------------------------------------------
-- Yordamchilar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.platform_cfg(p_key text) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT value FROM platform_config WHERE key = p_key;
$$;

-- Webhook o'zini bot token bilan tanishtiradi — token faqat Telegram'da
-- webhook URL'ida va VPS'da bor, begonaga ma'lum emas.
CREATE OR REPLACE FUNCTION auth.platform_secret_ok(p_secret text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(auth.platform_cfg('bot_token') = NULLIF(p_secret, ''), false);
$$;

-- ---------------------------------------------------------------------------
-- 1) Sayt: tasdiqlash yoqilganmi? (Register sahifasi so'raydi)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_platform_status() RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
  SELECT json_build_object(
    'enabled', auth.platform_cfg('bot_token') IS NOT NULL,
    'botUsername', COALESCE(auth.platform_cfg('bot_username'), '')
  );
$$;
GRANT EXECUTE ON FUNCTION public.tg_platform_status() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Sayt: tasdiqlashni boshlash — bir martalik token yaratiladi.
--    Foydalanuvchi t.me/<bot>?start=<token> ga o'tadi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_tg_verification(p_phone text) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_phone text := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_token text := encode(gen_random_bytes(16), 'hex');
BEGIN
  IF auth.platform_cfg('bot_token') IS NULL THEN
    RETURN json_build_object('error', 'not_enabled');
  END IF;
  IF length(v_phone) < 9 OR length(v_phone) > 15 THEN
    RETURN json_build_object('error', 'invalid_phone');
  END IF;
  -- Tezlik cheklovi: bitta raqamga soatiga 5, tizimga soatiga 60
  IF (SELECT count(*) FROM tg_verifications
      WHERE phone_form = v_phone AND created_at > now() - interval '1 hour') >= 5
     OR (SELECT count(*) FROM tg_verifications
         WHERE created_at > now() - interval '1 hour') >= 60 THEN
    RETURN json_build_object('error', 'rate_limited');
  END IF;

  INSERT INTO tg_verifications (token, phone_form) VALUES (v_token, v_phone);
  RETURN json_build_object('token', v_token,
                           'botUsername', COALESCE(auth.platform_cfg('bot_username'), ''));
END;
$$;
GRANT EXECUTE ON FUNCTION public.start_tg_verification(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3) Webhook: /start <token> keldi — chatni tokenga bog'laymiz
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attach_tg_chat(
  p_token text, p_chat_id text, p_secret text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
BEGIN
  IF NOT auth.platform_secret_ok(p_secret) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;
  UPDATE tg_verifications
     SET chat_id = p_chat_id
   WHERE token = p_token AND status = 'PENDING'
     AND created_at > now() - interval '1 hour';
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.attach_tg_chat(text, text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Webhook: kontakt keldi — raqamni yozib, tasdiqlaymiz.
--    Telegram raqami HAQIQAT MANBAI: saytdagidan farq qilsa ham qabul
--    qilinadi (match=false qaytadi, bot buni aytadi).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.confirm_tg_verification(
  p_chat_id text, p_phone text, p_name text, p_secret text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_phone text := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_row   record;
BEGIN
  IF NOT auth.platform_secret_ok(p_secret) THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  SELECT * INTO v_row FROM tg_verifications
   WHERE chat_id = p_chat_id AND status = 'PENDING'
     AND created_at > now() - interval '1 hour'
   ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'no_pending');
  END IF;

  UPDATE tg_verifications
     SET phone_tg = v_phone, tg_name = NULLIF(trim(COALESCE(p_name, '')), ''),
         status = 'VERIFIED', verified_at = now()
   WHERE token = v_row.token;

  RETURN json_build_object(
    'ok', true,
    'match', v_row.phone_form = v_phone,
    'phone', v_phone,
    'phoneForm', v_row.phone_form
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.confirm_tg_verification(text, text, text, text) TO anon, authenticated;

-- Webhook egaga xabar yuborishi uchun (faqat bot token bilan ochiladi)
CREATE OR REPLACE FUNCTION public.platform_owner_chat(p_secret text) RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
  SELECT CASE WHEN auth.platform_secret_ok(p_secret)
    THEN json_build_object('chatId', COALESCE(auth.platform_cfg('owner_chat_id'), ''))
    ELSE json_build_object('error', 'forbidden') END;
$$;
GRANT EXECUTE ON FUNCTION public.platform_owner_chat(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 5) Sayt: holatni tekshirish (poll). Token — sirning o'zi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_tg_verification(p_token text) RETURNS json
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(
    (SELECT json_build_object('status', status, 'phone', COALESCE(phone_tg, ''),
                              'tgName', COALESCE(tg_name, ''))
     FROM tg_verifications WHERE token = p_token),
    json_build_object('status', 'unknown')
  );
$$;
GRANT EXECUTE ON FUNCTION public.check_tg_verification(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6) register_center YANGILANADI: tasdiqlash yoqilgan bo'lsa, VERIFIED token
--    shart; markaz raqami sifatida TELEGRAM tasdiqlagan raqam olinadi va
--    direktorning chati settings."platformChatId" ga yoziladi.
--    Yoqilmagan bo'lsa — avvalgidek (o'zgarish yo'q).
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.register_center(text, text, text, text, text);
CREATE OR REPLACE FUNCTION public.register_center(
  p_center_name text,
  p_phone       text,
  p_admin_name  text,
  p_username    text,
  p_password    text,
  p_tg_token    text DEFAULT NULL
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
  v_verif     record;
  v_chat      text := NULL;
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

  -- Telegram tasdig'i (platforma boti sozlangan bo'lsa MAJBURIY)
  IF auth.platform_cfg('bot_token') IS NOT NULL THEN
    SELECT * INTO v_verif FROM tg_verifications
     WHERE token = COALESCE(p_tg_token, '') AND status = 'VERIFIED'
       AND verified_at > now() - interval '1 hour';
    IF NOT FOUND THEN
      RETURN json_build_object('error', 'tg_required');
    END IF;
    v_phone := v_verif.phone_tg;   -- Telegram raqami — haqiqat manbai
    v_chat  := v_verif.chat_id;
    UPDATE tg_verifications SET status = 'USED' WHERE token = v_verif.token;
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
                        "standardTeacherPercentage", "licenseExpiry", "isBlocked",
                        "platformChatId")
  VALUES (v_center_id, trim(p_center_name), '', '+' || v_phone, '',
          true, true, 40, v_expiry, false, v_chat);

  INSERT INTO users (id, "centerId", name, username, password, role,
                     "groupIds", "salaryPercentage")
  VALUES (v_admin_id, v_center_id, trim(p_admin_name), v_username,
          crypt(p_password, gen_salt('bf', 10)), 'DIRECTOR', '{}', 100);

  INSERT INTO audit_log ("centerId", "userId", username, action, detail, ip)
  VALUES (v_center_id, v_admin_id, v_username, 'REGISTER_OK',
          trim(p_center_name) || ' · sinov ' || v_expiry || ' gacha'
          || CASE WHEN v_chat IS NOT NULL THEN ' · tg tasdiqlangan' ELSE '' END,
          NULLIF(v_ip, ''));

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

GRANT EXECUTE ON FUNCTION public.register_center(text, text, text, text, text, text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7) Sinov muddati tugayotgan markazlar (VPS timer o'qiydi, GRANT yo'q).
--    3 kun va 1 kun qolganda platforma bot orqali direktorga eslatma.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trial_expiring_centers() RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT st."centerId", st."centerName", st."platformChatId",
           st."licenseExpiry",
           (st."licenseExpiry"::date - current_date) AS days_left
    FROM settings st
    WHERE COALESCE(st."platformChatId", '') <> ''
      AND st."licenseExpiry" ~ '^\d{4}-\d{2}-\d{2}$'
      AND NOT COALESCE(st."isBlocked", false)
      AND (st."licenseExpiry"::date - current_date) IN (3, 1)
      AND NOT EXISTS (
        SELECT 1 FROM reminder_log r
        WHERE r."studentId" = 'center_' || st."centerId"
          AND r.kind = 'TRIAL' || (st."licenseExpiry"::date - current_date)
          AND r."dueDate" = st."licenseExpiry"
      )
    ORDER BY st."centerName"
  ) t;
$$;
