-- ============================================================================
-- 11-qadam: "Ketib qolish" xavfi — haftalik hisobot uchun ma'lumot
--
-- Qoidalar frontend (services/churnRisk.ts) bilan AYNAN bir xil bo'lishi kerak:
--   streak  — oxirgi belgilangan darslardan boshlab 3+ ABSENT  → 3 ball
--   recent  — so'nggi 14 kunda 3+ dars belgilangan, <50% keldi → 2 ball
--   payment — nextPaymentDate 7+ kun o'tib ketgan              → 2 ball
--   4+ ball = HIGH, 2-3 ball = MEDIUM.
--
-- Har dushanba 10:30 da crm-risk-report.timer → /root/crm-risk-report.py
-- shu funksiyadan o'qib, direktorning botiga (reportChatId) yuboradi.
-- Takror ketmasligi reminder_log: kind='RISK', studentId='center_<id>',
-- dueDate='IYYY-IW' (hafta kaliti).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.churn_risk_data() RETURNS json
LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp AS $$
  WITH att AS (
    SELECT a."studentId", a.status, a.date,
           row_number() OVER (PARTITION BY a."studentId" ORDER BY a.date DESC) AS rn
    FROM attendance a
    WHERE a.date ~ '^\d{4}-\d{2}-\d{2}'
      AND a.date >= to_char(current_date - 60, 'YYYY-MM-DD')
  ),
  streak AS (
    -- Eng yangi darsdan boshlab uzluksiz ABSENT zanjiri
    SELECT a1."studentId", count(*) AS absent_streak
    FROM att a1
    WHERE a1.status = 'ABSENT'
      AND NOT EXISTS (
        SELECT 1 FROM att a2
        WHERE a2."studentId" = a1."studentId"
          AND a2.rn < a1.rn AND a2.status <> 'ABSENT'
      )
    GROUP BY a1."studentId"
  ),
  recent14 AS (
    SELECT "studentId",
           count(*) AS total,
           count(*) FILTER (WHERE status IN ('PRESENT','LATE','DISMISSED')) AS present
    FROM att
    WHERE date >= to_char(current_date - 14, 'YYYY-MM-DD')
    GROUP BY "studentId"
  ),
  scored AS (
    SELECT s.id, s."centerId", s.name, s.phone, s."parentPhone",
           st."centerName", st."botToken", st."reportChatId",
           COALESCE(k.absent_streak, 0) AS absent_streak,
           COALESCE(r.total, 0)         AS recent_total,
           COALESCE(r.present, 0)       AS recent_present,
           CASE WHEN s."nextPaymentDate" ~ '^\d{4}-\d{2}-\d{2}$'
                THEN current_date - s."nextPaymentDate"::date
                ELSE 0 END              AS overdue_days,
           (CASE WHEN COALESCE(k.absent_streak, 0) >= 3 THEN 3 ELSE 0 END
            + CASE WHEN COALESCE(r.total, 0) >= 3
                    AND COALESCE(r.present, 0) * 100 < COALESCE(r.total, 1) * 50
                   THEN 2 ELSE 0 END
            + CASE WHEN s."nextPaymentDate" ~ '^\d{4}-\d{2}-\d{2}$'
                    AND current_date - s."nextPaymentDate"::date >= 7
                   THEN 2 ELSE 0 END)   AS score
    FROM students s
    JOIN settings st ON st."centerId" = s."centerId"
    LEFT JOIN streak  k ON k."studentId" = s.id
    LEFT JOIN recent14 r ON r."studentId" = s.id
    WHERE COALESCE(s.status, 'ACTIVE') = 'ACTIVE'
      AND COALESCE(st."botToken", '') <> ''
      AND COALESCE(st."reportChatId", '') <> ''
      AND NOT COALESCE(st."isBlocked", false)
      AND st."centerId" <> 'DEMO_CENTER'
  )
  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) FROM (
    SELECT *, CASE WHEN score >= 4 THEN 'HIGH' ELSE 'MEDIUM' END AS level
    FROM scored
    WHERE score >= 2
      AND NOT EXISTS (
        SELECT 1 FROM reminder_log rl
        WHERE rl."studentId" = 'center_' || scored."centerId"
          AND rl.kind        = 'RISK'
          AND rl."dueDate"   = to_char(current_date, 'IYYY-IW')
      )
    ORDER BY "centerName", score DESC, name
  ) t;
$$;

-- GRANT YO'Q — faqat VPS skripti (postgres roli) chaqiradi.
