-- ============================================================================
-- 10-qadam: Telegram bot ulanishi RLS ostida ham ishlashi
--
-- api/telegram-webhook.ts avval settings/students jadvallarini anon kalit
-- bilan O'QIRDI — RLS yoqilgach hech narsa topolmay, ota-ona kod kiritsa
-- doim "o'quvchi topilmadi" qaytarardi (jimgina buzilgan edi).
--
-- Endi webhook faqat shu funksiyani chaqiradi. Bot tokenining o'zi "kalit"
-- vazifasini bajaradi: tokenni bilmagan odam hech narsa qila olmaydi, token
-- esa faqat o'sha markazning o'z botida bor.
-- ============================================================================

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

  -- Kod: id ning oxirgi 3-4 belgisi yoki tgConnectionCode
  SELECT id, name, "tgChatId" INTO stud
  FROM students
  WHERE "centerId" = st."centerId"
    AND (upper(right(id, 3)) = v_code
         OR upper(right(id, 4)) = v_code
         OR upper(COALESCE("tgConnectionCode", '')) = v_code)
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

-- Webhook anon kalit bilan chaqiradi
GRANT EXECUTE ON FUNCTION public.tg_connect(text, text, text) TO anon, authenticated;
