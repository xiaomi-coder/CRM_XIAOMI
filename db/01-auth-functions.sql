-- ============================================================================
-- CRM autentifikatsiyasi: bcrypt parollar + shaxsiy JWT
--
-- Oldin: brauzer users jadvalidan parolni o'qib, o'zi solishtirardi.
--        Ya'ni parollar ochiq matnda va API orqali o'qilardi.
-- Endi:  parol bcrypt hash bilan saqlanadi, tekshiruv BAZA ichida bo'ladi,
--        natijada foydalanuvchiga shaxsiy JWT (propusk) beriladi.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- JWT imzolash. pgjwt kengaytmasi yo'q, shuning uchun pgcrypto asosida yozildi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION auth.b64url(data bytea) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  SELECT translate(encode(data, 'base64'), E'+/=\n', '-_');
$$;

CREATE OR REPLACE FUNCTION auth.sign_jwt(payload json, secret text) RETURNS text
LANGUAGE sql IMMUTABLE AS $$
  WITH header AS (
    SELECT auth.b64url(convert_to('{"alg":"HS256","typ":"JWT"}', 'utf8')) AS h
  ), body AS (
    SELECT auth.b64url(convert_to(payload::text, 'utf8')) AS b
  ), signing AS (
    SELECT header.h || '.' || body.b AS data FROM header, body
  )
  SELECT signing.data || '.' || auth.b64url(hmac(signing.data, secret, 'sha256'))
  FROM signing;
$$;

-- ---------------------------------------------------------------------------
-- Login. Parolni tekshiradi va propusk qaytaradi.
-- SECURITY DEFINER — anon roli users jadvalini o'qiy olmasa ham bu ishlaydi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.login(p_username text, p_password text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  u          record;
  s          record;
  secret     text;
  expires    int;
  token      text;
BEGIN
  SELECT * INTO u FROM users WHERE username = p_username LIMIT 1;

  -- Foydalanuvchi topilmasa ham, parol xato bo'lsa ham — bir xil javob.
  -- (Aks holda qaysi login mavjudligini bilib olish mumkin bo'lardi.)
  IF u IS NULL THEN
    RETURN json_build_object('error', 'invalid_credentials');
  END IF;

  -- Bcrypt hash ($2a$/$2b$ bilan boshlanadi) yoki eski ochiq parol
  IF u.password LIKE '$2%' THEN
    IF u.password <> crypt(p_password, u.password) THEN
      RETURN json_build_object('error', 'invalid_credentials');
    END IF;
  ELSE
    -- Eski ochiq parol: to'g'ri bo'lsa darhol bcrypt ga o'tkazamiz
    IF u.password <> p_password THEN
      RETURN json_build_object('error', 'invalid_credentials');
    END IF;
    UPDATE users SET password = crypt(p_password, gen_salt('bf', 10)) WHERE id = u.id;
  END IF;

  -- Markaz holati (GLOBAL — bu creator, markazi yo'q)
  IF u."centerId" IS NOT NULL AND u."centerId" <> 'GLOBAL' THEN
    SELECT * INTO s FROM settings WHERE "centerId" = u."centerId" LIMIT 1;
    IF s IS NULL THEN
      RETURN json_build_object('error', 'center_not_found');
    END IF;
    IF COALESCE(s."isBlocked", false) THEN
      RETURN json_build_object('error', 'center_blocked');
    END IF;
  END IF;

  secret  := current_setting('app.jwt_secret', true);
  expires := extract(epoch FROM now())::int + 60 * 60 * 12;  -- 12 soat

  token := auth.sign_jwt(
    json_build_object(
      'role',     'authenticated',
      'iss',      'crm-vps',
      'sub',      u.id,
      'username', u.username,
      'centerId', COALESCE(u."centerId", ''),
      'user_role', COALESCE(u.role, ''),
      'iat',      extract(epoch FROM now())::int,
      'exp',      expires
    ),
    secret
  );

  RETURN json_build_object(
    'token', token,
    'user', json_build_object(
      'id', u.id, 'username', u.username, 'name', u.name,
      'role', u.role, 'centerId', u."centerId"
    )
  );
END;
$$;

-- Login hammaga ochiq bo'lishi kerak (kirmasdan turib chaqiriladi)
GRANT EXECUTE ON FUNCTION public.login(text, text) TO anon, authenticated;
