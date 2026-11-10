UPDATE "periods"
SET "is_active" = true
WHERE "name" = '2026-2027'
  AND NOT EXISTS (SELECT 1 FROM "periods" WHERE "is_active" = true);

INSERT INTO "periods" ("id", "name", "start_date", "end_date", "is_active", "created_at")
SELECT gen_random_uuid(), '2026-2027', DATE '2026-09-01', DATE '2027-08-31', true, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "periods" WHERE "is_active" = true)
  AND NOT EXISTS (SELECT 1 FROM "periods" WHERE "name" = '2026-2027');
