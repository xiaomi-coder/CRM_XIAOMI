-- ============================================================================
-- 13-qadam: Telegram'ga HAVOLA orqali ulanish (bitta bosish)
--
-- Muammo: ota-ona botni topib, /start bosib, keyin o'quvchi KODINI QO'LDA
-- terishi kerak edi. Natija: 38 o'quvchidan atigi 7 tasi ulangan (18%).
-- Ustiga-ustak kod = id ning oxirgi 3-4 belgisi, ya'ni taxmin qilsa bo'ladi —
-- begona odam boshqa bolaning davomati va to'lovini ko'rishi mumkin edi.
--
-- Yechim: har o'quvchiga UZUN tasodifiy kod. Direktor havola beradi:
--   https://t.me/<bot>?start=<kod>
-- Ota-ona bosadi → Start → ulandi. Terish yo'q, taxmin qilib bo'lmaydi.
-- ============================================================================

-- Markazning bot username'i — havolani yasash uchun kerak.
-- (Avval faqat botToken saqlanardi, username esa hech qayerda yo'q edi.)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS "botUsername" TEXT;

-- ---------------------------------------------------------------------------
-- Har o'quvchida kod BO'LISHI kafolatlanadi.
-- Frontend `tgConnectionCode: ''` yuboradi, shuning uchun DEFAULT yetarli
-- emas — trigger kerak.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fill_connect_code() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NULLIF(TRIM(COALESCE(NEW."tgConnectionCode", '')), '') IS NULL THEN
    -- 12 belgi, base32-ga o'xshash (chalkashadigan 0/O/1/I ishlatilmaydi)
    NEW."tgConnectionCode" := (
      SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                               (floor(random() * 32) + 1)::int, 1), '')
      FROM generate_series(1, 12)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS students_fill_connect_code ON students;
CREATE TRIGGER students_fill_connect_code
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION public.fill_connect_code();

-- Mavjud o'quvchilarga kod berish (bo'sh bo'lganlariga)
UPDATE students SET "tgConnectionCode" = ''
WHERE NULLIF(TRIM(COALESCE("tgConnectionCode", '')), '') IS NULL;
-- ^ trigger UPDATE'da ishlaydi va bo'shlarni to'ldiradi

-- ---------------------------------------------------------------------------
-- tg_connect yangilandi.
--
-- MUHIM o'zgarish: id ning oxirgi 3-4 belgisi bo'yicha ulanish OLIB TASHLANDI.
-- U taxmin qilinadigan edi (36^3 ≈ 46k variant) va begona odam boshqa
-- bolaning ma'lumotiga ulanishi mumkin edi. Endi faqat uzun kod ishlaydi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.tg_connect(
  p_bot_token text, p_chat_id text, p_code text
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  st     record;
  stud   record;
  v_code text := upper(trim(COALESCE(p_code, '')));
BEGIN
  IF COALESCE(p_bot_token, '') = '' OR COALESCE(p_chat_id, '') = '' OR v_code = '' THEN
    RETURN json_build_object('status', 'no_center');
  END IF;

  SELECT "centerId", "centerName" INTO st
  FROM settings WHERE "botToken" = p_bot_token LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'no_center');
  END IF;

  SELECT id, name, "tgChatId" INTO stud
  FROM students
  WHERE "centerId" = st."centerId"
    AND upper(COALESCE("tgConnectionCode", '')) = v_code
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('status', 'not_found',
                             'centerName', st."centerName");
  END IF;

  IF COALESCE(stud."tgChatId", '') = p_chat_id THEN
    RETURN json_build_object('status', 'already', 'name', stud.name,
                             'centerName', st."centerName");
  END IF;

  UPDATE students SET "tgChatId" = p_chat_id, "tgEnabled" = true
  WHERE id = stud.id;

  RETURN json_build_object('status', 'ok', 'name', stud.name,
                           'centerName', st."centerName");
END;
$$;

GRANT EXECUTE ON FUNCTION public.tg_connect(text, text, text) TO anon, authenticated;
