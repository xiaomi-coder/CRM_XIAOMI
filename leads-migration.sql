-- Lidlar bo'limini kengaytirish uchun yangi ustunlar.
-- Faqat QO'SHADI — mavjud ma'lumotga tegmaydi, hech narsa o'chmaydi.
--
-- VPS'da ishga tushirish:
--   psql -U postgres -d crm -f leads-migration.sql
-- yoki:
--   sudo -u postgres psql -d crm
--   (keyin quyidagi qatorlarni qo'ying)
--
-- Keyin PostgREST keshini yangilash SHART, aks holda yangi ustunlarni ko'rmaydi:
--   sudo systemctl restart postgrest

ALTER TABLE leads ADD COLUMN IF NOT EXISTS "followUpDate" TEXT;   -- qayta qo'ng'iroq sanasi (YYYY-MM-DD)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;           -- lid qayerdan keldi: instagram, telegram, tanish, reklama, boshqa
ALTER TABLE leads ADD COLUMN IF NOT EXISTS "studentId" TEXT;      -- o'quvchiga aylangach, qaysi o'quvchi ekani
ALTER TABLE leads ADD COLUMN IF NOT EXISTS history JSONB;         -- harakatlar tarixi: [{at, from, to, note}]

-- Tekshirish:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position;
