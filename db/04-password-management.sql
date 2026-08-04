-- ============================================================================
-- Parol boshqaruvi
--
-- Uchta ehtiyoj:
--   1. Foydalanuvchi o'z parolini o'zgartirsin (eski parolni bilishi shart).
--   2. Direktor xodimining parolini tiklasin (o'z markazi doirasida).
--      Super admin esa istalgan foydalanuvchining parolini tiklay olsin.
--   3. Yangi markaz yaratilganda parol darrov hash bo'lsin — hozir ochiq
--      matnda yozilib, faqat birinchi kirishda hash'ga o'tardi.
--
-- Hammasi SECURITY DEFINER: anon/authenticated users jadvalini o'zgartira
-- olmaydi, faqat shu funksiyalar orqali.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- O'z parolini o'zgartirish
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.change_password(p_old text, p_new text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_id text := NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'sub';
  u    record;
BEGIN
  IF v_id IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  IF length(COALESCE(p_new, '')) < 6 THEN
    RETURN json_build_object('error', 'too_short');
  END IF;

  SELECT * INTO u FROM users WHERE id = v_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  -- Eski parol: bcrypt bo'lsa crypt bilan, hali ochiq bo'lsa to'g'ridan-to'g'ri
  IF u.password LIKE '$2%' THEN
    IF u.password <> crypt(p_old, u.password) THEN
      RETURN json_build_object('error', 'wrong_password');
    END IF;
  ELSIF u.password <> p_old THEN
    RETURN json_build_object('error', 'wrong_password');
  END IF;

  UPDATE users SET password = crypt(p_new, gen_salt('bf', 10)) WHERE id = v_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- Boshqa foydalanuvchining parolini tiklash.
-- Direktor — faqat o'z markazidagini; super admin — istalganini.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_password(p_user_id text, p_new text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  claims   json := NULLIF(current_setting('request.jwt.claims', true), '')::json;
  v_center text := claims ->> 'centerId';
  v_role   text := claims ->> 'user_role';
  target   record;
BEGIN
  IF claims IS NULL THEN
    RETURN json_build_object('error', 'not_authenticated');
  END IF;

  IF v_role NOT IN ('SUPER_ADMIN', 'DIRECTOR') THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  IF length(COALESCE(p_new, '')) < 6 THEN
    RETURN json_build_object('error', 'too_short');
  END IF;

  SELECT * INTO target FROM users WHERE id = p_user_id LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;

  -- Direktor faqat o'z markazi ichida
  IF v_role = 'DIRECTOR' AND target."centerId" IS DISTINCT FROM v_center THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  UPDATE users SET password = crypt(p_new, gen_salt('bf', 10)) WHERE id = p_user_id;
  RETURN json_build_object('ok', true);
END;
$$;

-- ---------------------------------------------------------------------------
-- Yangi markaz admini uchun parolni hash qilib qo'yish.
-- Faqat super admin chaqira oladi (markaz yaratish jarayonida).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_initial_password(p_user_id text, p_password text)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_role text := NULLIF(current_setting('request.jwt.claims', true), '')::json ->> 'user_role';
BEGIN
  IF v_role IS DISTINCT FROM 'SUPER_ADMIN' THEN
    RETURN json_build_object('error', 'forbidden');
  END IF;

  UPDATE users SET password = crypt(p_password, gen_salt('bf', 10)) WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'not_found');
  END IF;
  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.change_password(text, text)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_password(text, text)       TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_initial_password(text, text) TO authenticated;
