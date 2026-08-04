-- ============================================================================
-- 9-qadam: Oylik davomat hisoboti SERVERDA
--
-- Avval Vercel cron (api/send-monthly-report.ts) anon kalit bilan o'qirdi —
-- RLS yoqilgach 0 qator ko'rib, JIMGINA ishlamay qolgan edi. Endi eslatmalar
-- kabi VPS'da: crm-monthly-report.timer (har oy 1-sanada 10:00) →
-- /root/crm-monthly-report.py → shu funksiya.
--
-- Takror ketmasligi uchun reminder_log ishlatiladi: kind='MONTHLY',
-- "dueDate" = hisobot oyi ('YYYY-MM').
-- ============================================================================

CREATE OR REPLACE FUNCTION public.monthly_report_data() RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH prev AS (
    SELECT to_char(date_trunc('month', current_date) - interval '1 month', 'YYYY-MM') AS key
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT s.id            AS "studentId",
           s."centerId",
           s.name,
           s."tgChatId",
           st."botToken",
           st."centerName",
           (SELECT key FROM prev) AS month_key,
           count(*) FILTER (WHERE a.status IN ('PRESENT','DISMISSED','LATE')) AS present,
           count(*) FILTER (WHERE a.status = 'ABSENT')                        AS absent,
           count(*) FILTER (WHERE a.status = 'LATE')                          AS late,
           count(*)                                                           AS total
    FROM students s
    JOIN settings st ON st."centerId" = s."centerId"
    JOIN attendance a ON a."studentId" = s.id
                     AND a."centerId"  = s."centerId"
                     AND a.date LIKE (SELECT key FROM prev) || '%'
    WHERE COALESCE(s."tgChatId", '') <> ''
      AND COALESCE(s."tgEnabled", false)
      AND COALESCE(st."botToken", '') <> ''
      AND NOT COALESCE(st."isBlocked", false)
      AND st."centerId" <> 'DEMO_CENTER'
      AND NOT EXISTS (
        SELECT 1 FROM reminder_log r
        WHERE r."studentId" = s.id
          AND r.kind        = 'MONTHLY'
          AND r."dueDate"   = (SELECT key FROM prev)
      )
    GROUP BY s.id, s."centerId", s.name, s."tgChatId", st."botToken", st."centerName"
    HAVING count(*) > 0
    ORDER BY st."centerName", s.name
  ) t;
$$;

-- GRANT YO'Q — faqat VPS skripti (postgres roli) chaqiradi.
