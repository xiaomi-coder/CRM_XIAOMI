-- ============================================================================
-- 8-qadam: To'lov eslatmalari SERVERDA
--
-- Avval eslatmalar brauzerda yuborilardi (AuthenticatedApp): direktor ilovani
-- ochgandagina ishlaydi, hech kim kirmagan kuni eslatma KETMASDI, "yuborildi"
-- belgisi esa localStorage'da (qurilmaga bog'liq — boshqa kompyuterdan ikki
-- marta ketishi mumkin) edi.
--
-- Endi: VPS'dagi kunlik timer (crm-payment-reminders.timer, 09:00) shu yerdagi
-- funksiyadan nomzodlarni oladi, Telegram orqali yuboradi va reminder_log'ga
-- yozadi — ilova ochilishiga bog'liq emas, takror ketmaydi.
--
-- Kimga: faqat ACTIVE o'quvchi + tgChatId ulangan + markazda bot va
-- notifyPayment yoqiq + markaz bloklanmagan. Kunlar: 5, 3, 1 kun qolganda
-- va to'lov kunining o'zida (0).
-- ============================================================================

CREATE TABLE IF NOT EXISTS reminder_log (
  id          bigserial PRIMARY KEY,
  "studentId" text NOT NULL,
  "centerId"  text,
  kind        text NOT NULL,     -- D5, D3, D1, D0 (necha kun qolganda)
  "dueDate"   text NOT NULL,     -- o'sha paytdagi nextPaymentDate
  at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("studentId", "dueDate", kind)
);

-- API orqali ko'rinmasin: GRANT yo'q + RLS yopiq
ALTER TABLE reminder_log ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Bugun yuborilishi kerak bo'lgan eslatmalar (hali yuborilmaganlari)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.due_payment_reminders() RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT s.id            AS "studentId",
           s."centerId",
           s.name,
           s."tgChatId",
           s."nextPaymentDate",
           (s."nextPaymentDate"::date - current_date) AS days_left,
           st."botToken",
           st."centerName"
    FROM students s
    JOIN settings st ON st."centerId" = s."centerId"
    WHERE COALESCE(s."tgChatId", '') <> ''
      AND COALESCE(s.status, 'ACTIVE') = 'ACTIVE'
      AND s."nextPaymentDate" ~ '^\d{4}-\d{2}-\d{2}$'
      AND COALESCE(st."botToken", '') <> ''
      AND COALESCE(st."notifyPayment", true)
      AND NOT COALESCE(st."isBlocked", false)
      AND st."centerId" <> 'DEMO_CENTER'
      AND (s."nextPaymentDate"::date - current_date) IN (5, 3, 1, 0)
      AND NOT EXISTS (
        SELECT 1 FROM reminder_log r
        WHERE r."studentId" = s.id
          AND r."dueDate"   = s."nextPaymentDate"
          AND r.kind        = 'D' || (s."nextPaymentDate"::date - current_date)
      )
    ORDER BY st."centerName", s.name
  ) t;
$$;

-- Yuborilgani belgilanadi (takror yubormaslik uchun)
CREATE OR REPLACE FUNCTION public.mark_reminder_sent(
  p_student text, p_center text, p_due text, p_kind text
) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  INSERT INTO reminder_log ("studentId", "centerId", "dueDate", kind)
  VALUES (p_student, p_center, p_due, p_kind)
  ON CONFLICT DO NOTHING;
$$;

-- Ataylab GRANT YO'Q: bu funksiyalarni faqat VPS'dagi skript (postgres roli)
-- chaqiradi, API orqali chaqirib bo'lmaydi.
