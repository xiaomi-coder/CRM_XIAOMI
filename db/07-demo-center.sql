-- ============================================================================
-- 7-qadam: Landing'dagi jonli demo
--
-- Mehmon "Demo'ni sinab ko'rish" tugmasini bossa demo_login() chaqiriladi:
-- 2 soatlik propusk beriladi, ichida centerId = DEMO_CENTER. RLS tufayli u
-- FAQAT demo markazni ko'radi va o'zgartiradi — haqiqiy markazlarga yo'l yo'q.
--
-- Demo to'liq interaktiv (o'quvchi qo'shish, to'lov, davomat...), shuning
-- uchun har kuni tunda reset_demo_center() namunaviy holatga qaytaradi
-- (VPS'da systemd timer: crm-demo-reset.timer, 04:00).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.demo_login() RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp AS $$
DECLARE
  v_ip    text := auth.client_ip();
  v_id    text := 'demo_' || substr(md5(random()::text), 1, 12);
  v_now   int  := extract(epoch FROM now())::int;
  v_token text;
BEGIN
  IF v_ip <> '' AND (SELECT count(*) FROM audit_log
        WHERE ip = v_ip AND action = 'DEMO_LOGIN'
          AND at > now() - interval '1 hour') >= 30 THEN
    RETURN json_build_object('error', 'rate_limited');
  END IF;

  INSERT INTO audit_log ("centerId", username, action, ip)
  VALUES ('DEMO_CENTER', v_id, 'DEMO_LOGIN', NULLIF(v_ip, ''));

  v_token := auth.sign_jwt(
    json_build_object(
      'role', 'authenticated', 'iss', 'crm-vps',
      'sub', v_id, 'username', 'demo',
      'centerId', 'DEMO_CENTER', 'user_role', 'DIRECTOR',
      'iat', v_now, 'exp', v_now + 60 * 60 * 2   -- 2 soat sinashga yetadi
    ),
    current_setting('app.jwt_secret', true)
  );

  RETURN json_build_object(
    'token', v_token,
    'user', json_build_object(
      'id', v_id, 'username', 'demo', 'name', 'Demo Direktor',
      'role', 'DIRECTOR', 'centerId', 'DEMO_CENTER'
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.demo_login() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Demo markazni namunaviy holatga qaytarish. Sanalar har doim "bugun"ga
-- nisbatan hisoblanadi — demo hech qachon eskirib ko'rinmaydi.
-- API orqali chaqirilMAYDI (GRANT yo'q) — faqat psql/timer ishlatadi.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_demo_center() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  c        text   := 'DEMO_CENTER';
  months   text[] := ARRAY['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                           'Iyul','Avgust','Sentyabr','Oktyabr','Noyabr','Dekabr'];
  m_cur    text   := months[extract(month FROM now())::int];
  m_prev   text   := months[((extract(month FROM now())::int + 10) % 12) + 1];
  d        text; -- vaqtinchalik sana
BEGIN
  -- Toza sahifa
  DELETE FROM students   WHERE "centerId" = c;
  DELETE FROM groups     WHERE "centerId" = c;
  DELETE FROM attendance WHERE "centerId" = c;
  DELETE FROM payments   WHERE "centerId" = c;
  DELETE FROM expenses   WHERE "centerId" = c;
  DELETE FROM leads      WHERE "centerId" = c;
  DELETE FROM library    WHERE "centerId" = c;
  DELETE FROM results    WHERE "centerId" = c;
  DELETE FROM users      WHERE "centerId" = c;
  DELETE FROM test_templates WHERE "centerId" = c;
  DELETE FROM ielts_attempts WHERE "centerId" = c;

  -- Markaz sozlamalari (bot ulanmagan — demo hech kimga xabar yubormaydi)
  INSERT INTO settings ("centerId", "centerName", address, phone, "botToken",
                        "notifyAttendance", "notifyPayment",
                        "standardTeacherPercentage", "licenseExpiry", "isBlocked")
  VALUES (c, 'Demo o''quv markazi', 'Toshkent, Chilonzor', '+998 90 000 00 00', '',
          true, true, 40, NULL, false)
  ON CONFLICT ("centerId") DO UPDATE SET
    "centerName" = EXCLUDED."centerName", "botToken" = '', "isBlocked" = false;

  -- O'qituvchilar (xodimlar ekranida ko'rinadi)
  INSERT INTO users (id, "centerId", name, username, password, role, "groupIds", "salaryPercentage") VALUES
    ('demo-t1', c, 'Aziz Karimov',    'demo_aziz',   NULL, 'TEACHER', ARRAY['demo-g1'], 40),
    ('demo-t2', c, 'Malika Tosheva',  'demo_malika', NULL, 'TEACHER', ARRAY['demo-g2'], 40),
    ('demo-t3', c, 'Sardor Aliyev',   'demo_sardor', NULL, 'TEACHER', ARRAY['demo-g3'], 40);

  -- O'quvchilar: 2 tasi qarzdor (nextPaymentDate o'tib ketgan) — Dashboard
  -- "Qarzdorlar" bo'limi bo'sh ko'rinmasin
  INSERT INTO students (id, "centerId", name, phone, "parentName", "parentPhone",
                        balance, coins, "joinedDate", "nextPaymentDate",
                        "tgEnabled", "tgConnectionCode", status) VALUES
    ('demo-s1', c, 'Ali Valiyev',        '+998 90 111 11 11', 'Valijon aka',  '+998 90 111 11 12', 500000, 12, to_char(now() - interval '92 days', 'YYYY-MM-DD'), to_char(now() + interval '12 days', 'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s2', c, 'Malika Nurmatova',   '+998 91 222 22 22', 'Nodira opa',   '+998 91 222 22 23', 400000,  8, to_char(now() - interval '75 days', 'YYYY-MM-DD'), to_char(now() + interval '8 days',  'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s3', c, 'Jasur Toshpulatov',  '+998 93 333 33 33', 'Tohir aka',    '+998 93 333 33 34', 0,       5, to_char(now() - interval '60 days', 'YYYY-MM-DD'), to_char(now() - interval '3 days',  'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s4', c, 'Nilufar Saidova',    '+998 94 444 44 44', 'Salima opa',   '+998 94 444 44 45', 450000, 15, to_char(now() - interval '48 days', 'YYYY-MM-DD'), to_char(now() + interval '10 days', 'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s5', c, 'Bekzod Rahimov',     '+998 95 555 55 55', 'Rahim aka',    '+998 95 555 55 56', 350000,  3, to_char(now() - interval '40 days', 'YYYY-MM-DD'), to_char(now() + interval '15 days', 'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s6', c, 'Zarina Yusupova',    '+998 97 666 66 66', 'Yusuf aka',    '+998 97 666 66 67', 0,       9, to_char(now() - interval '35 days', 'YYYY-MM-DD'), to_char(now() - interval '6 days',  'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s7', c, 'Timur Abdullayev',   '+998 98 777 77 77', 'Abdulla aka',  '+998 98 777 77 78', 500000,  6, to_char(now() - interval '22 days', 'YYYY-MM-DD'), to_char(now() + interval '20 days', 'YYYY-MM-DD'), false, '', 'ACTIVE'),
    ('demo-s8', c, 'Gulnoza Karimova',   '+998 99 888 88 88', 'Karima opa',   '+998 99 888 88 89', 400000, 11, to_char(now() - interval '15 days', 'YYYY-MM-DD'), to_char(now() + interval '18 days', 'YYYY-MM-DD'), false, '', 'ACTIVE');

  -- Guruhlar
  INSERT INTO groups (id, "centerId", name, teacher, subject, days, "time", fee, "studentIds") VALUES
    ('demo-g1', c, 'IELTS Intensive',  'Aziz Karimov',   'Ingliz tili (IELTS)', ARRAY['Du','Ch','Ju'], '18:00 - 20:00', 500000, ARRAY['demo-s1','demo-s3','demo-s7']),
    ('demo-g2', c, 'General English',  'Malika Tosheva', 'Ingliz tili',         ARRAY['Se','Pa','Sh'], '16:00 - 17:30', 400000, ARRAY['demo-s2','demo-s6','demo-s8']),
    ('demo-g3', c, 'Matematika DTM',   'Sardor Aliyev',  'Matematika',          ARRAY['Du','Ch','Ju'], '14:00 - 15:30', 350000, ARRAY['demo-s4','demo-s5']);

  -- Davomat: oxirgi 3 dars kuni, aralash holatlar
  FOR i IN 1..3 LOOP
    d := to_char(now() - (i * 2 - 1 || ' days')::interval, 'YYYY-MM-DD');
    INSERT INTO attendance (id, "centerId", date, "studentId", "groupId", status) VALUES
      (d || '_demo-s1_demo-g1', c, d, 'demo-s1', 'demo-g1', 'PRESENT'),
      (d || '_demo-s3_demo-g1', c, d, 'demo-s3', 'demo-g1', CASE WHEN i = 1 THEN 'ABSENT' ELSE 'PRESENT' END),
      (d || '_demo-s7_demo-g1', c, d, 'demo-s7', 'demo-g1', CASE WHEN i = 2 THEN 'LATE' ELSE 'PRESENT' END),
      (d || '_demo-s2_demo-g2', c, d, 'demo-s2', 'demo-g2', 'PRESENT'),
      (d || '_demo-s6_demo-g2', c, d, 'demo-s6', 'demo-g2', CASE WHEN i = 3 THEN 'ABSENT' ELSE 'PRESENT' END),
      (d || '_demo-s8_demo-g2', c, d, 'demo-s8', 'demo-g2', 'PRESENT');
  END LOOP;

  -- To'lovlar: joriy va o'tgan oy
  INSERT INTO payments (id, "centerId", "studentId", "groupId", amount, date, type, "forMonth") VALUES
    ('demo-p1', c, 'demo-s1', 'demo-g1', 500000, to_char(now() - interval '2 days',  'YYYY-MM-DD'), 'CASH', m_cur),
    ('demo-p2', c, 'demo-s2', 'demo-g2', 400000, to_char(now() - interval '3 days',  'YYYY-MM-DD'), 'CARD', m_cur),
    ('demo-p3', c, 'demo-s4', 'demo-g3', 350000, to_char(now() - interval '5 days',  'YYYY-MM-DD'), 'CASH', m_cur),
    ('demo-p4', c, 'demo-s7', 'demo-g1', 500000, to_char(now() - interval '6 days',  'YYYY-MM-DD'), 'CARD', m_cur),
    ('demo-p5', c, 'demo-s8', 'demo-g2', 400000, to_char(now() - interval '8 days',  'YYYY-MM-DD'), 'CASH', m_cur),
    ('demo-p6', c, 'demo-s5', 'demo-g3', 350000, to_char(now() - interval '9 days',  'YYYY-MM-DD'), 'CASH', m_cur),
    ('demo-p7', c, 'demo-s1', 'demo-g1', 500000, to_char(now() - interval '32 days', 'YYYY-MM-DD'), 'CASH', m_prev),
    ('demo-p8', c, 'demo-s2', 'demo-g2', 400000, to_char(now() - interval '33 days', 'YYYY-MM-DD'), 'CARD', m_prev),
    ('demo-p9', c, 'demo-s3', 'demo-g1', 500000, to_char(now() - interval '35 days', 'YYYY-MM-DD'), 'CASH', m_prev),
    ('demo-p10',c, 'demo-s6', 'demo-g2', 400000, to_char(now() - interval '36 days', 'YYYY-MM-DD'), 'CASH', m_prev);

  -- Xarajatlar
  INSERT INTO expenses (id, "centerId", title, amount, date, category) VALUES
    ('demo-e1', c, 'Ofis ijarasi',        3000000, to_char(now() - interval '10 days', 'YYYY-MM-DD'), 'RENT'),
    ('demo-e2', c, 'Instagram reklama',    500000, to_char(now() - interval '4 days',  'YYYY-MM-DD'), 'ADVERTISING'),
    ('demo-e3', c, 'Kommunal to''lovlar',  400000, to_char(now() - interval '7 days',  'YYYY-MM-DD'), 'OTHER');

  -- Lidlar (voronka bo'sh ko'rinmasin)
  INSERT INTO leads (id, "centerId", name, phone, subject, status, "createdAt", source, note, "followUpDate") VALUES
    ('demo-l1', c, 'Dilshod Ergashev', '+998 90 123 45 67', 'Ingliz tili (IELTS)', 'NEW',       to_char(now(), 'YYYY-MM-DD'),                      'instagram', 'Kechki guruh so''radi', NULL),
    ('demo-l2', c, 'Sevara Mirzayeva', '+998 91 234 56 78', 'Matematika',          'CONTACTED', to_char(now() - interval '2 days', 'YYYY-MM-DD'),  'telegram',  '',                       to_char(now() + interval '1 day', 'YYYY-MM-DD')),
    ('demo-l3', c, 'Otabek Qodirov',   '+998 93 345 67 89', 'Ingliz tili',         'TRIAL',     to_char(now() - interval '5 days', 'YYYY-MM-DD'),  'tanish',    'Sinov darsiga yozildi',  NULL);

  -- Natijalar vitrini
  INSERT INTO results (id, "centerId", "studentId", "studentName", type, title, score, date, description) VALUES
    ('demo-r1', c, 'demo-s1', 'Ali Valiyev',      'IELTS', 'IELTS Academic', 'Band 7.0', to_char(now() - interval '20 days', 'YYYY-MM-DD'), '3 oylik intensiv kursdan keyin'),
    ('demo-r2', c, 'demo-s2', 'Malika Nurmatova', 'CEFR',  'CEFR English',   'B2',       to_char(now() - interval '40 days', 'YYYY-MM-DD'), 'Milliy sertifikat imtihoni');
END;
$$;

-- Darhol bir marta to'ldirib qo'yamiz
SELECT public.reset_demo_center();
