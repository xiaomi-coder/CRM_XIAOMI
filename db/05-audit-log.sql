-- ============================================================================
-- Audit jurnali — kim, qachon, nima qildi
--
-- Oldin "LOGLAR" ekrani butunlay soxta edi: yozuvlar frontend kodiga qo'lda
-- yozib qo'yilgan, mavjud bo'lmagan markazlar nomi bilan ("Elite Center").
-- Endi haqiqiy hodisalar bazaga yoziladi.
--
-- Eng qimmatlisi — MUVAFFAQIYATSIZ kirish urinishlari: parol tanlashga
-- urinishni faqat shundan bilib olish mumkin.
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id         bigserial PRIMARY KEY,
  at         timestamptz NOT NULL DEFAULT now(),
  "centerId" text,            -- global hodisalarda bo'sh (masalan mavjud bo'lmagan login)
  "userId"   text,
  username   text,
  action     text NOT NULL,   -- LOGIN_OK, LOGIN_FAIL, PASSWORD_CHANGED, ...
  detail     text,
  ip         text
);

CREATE INDEX IF NOT EXISTS audit_log_at_idx     ON audit_log (at DESC);
CREATE INDEX IF NOT EXISTS audit_log_center_idx ON audit_log ("centerId", at DESC);

-- Yozish faqat SECURITY DEFINER funksiyalar orqali bo'ladi
CREATE OR REPLACE FUNCTION auth.log_event(
  p_center text, p_user text, p_username text, p_action text, p_detail text DEFAULT NULL
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  INSERT INTO audit_log ("centerId", "userId", username, action, detail)
  VALUES (NULLIF(p_center, ''), NULLIF(p_user, ''), p_username, p_action, p_detail);
$$;

-- ---------------------------------------------------------------------------
-- Ko'rish: super admin hammasini, direktor faqat o'z markazini.
-- O'qish uchun funksiya — jadvalga to'g'ridan-to'g'ri kirish kerak emas.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_audit_log(p_limit int DEFAULT 200)
RETURNS TABLE (at timestamptz, "centerId" text, username text, action text, detail text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  claims   json := NULLIF(current_setting('request.jwt.claims', true), '')::json;
  v_center text := claims ->> 'centerId';
  v_role   text := claims ->> 'user_role';
BEGIN
  IF claims IS NULL OR v_role NOT IN ('SUPER_ADMIN', 'DIRECTOR') THEN
    RETURN;  -- ruxsat yo'q — bo'sh ro'yxat
  END IF;

  RETURN QUERY
  SELECT a.at, a."centerId", a.username, a.action, a.detail
  FROM audit_log a
  WHERE v_role = 'SUPER_ADMIN' OR a."centerId" = v_center
  ORDER BY a.at DESC
  LIMIT LEAST(GREATEST(p_limit, 1), 500);
END;
$$;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;  -- to'g'ridan-to'g'ri o'qishni yopadi

GRANT EXECUTE ON FUNCTION public.get_audit_log(int) TO authenticated;
