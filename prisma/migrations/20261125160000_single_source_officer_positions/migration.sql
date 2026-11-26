DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
      AND "is_active" = true
      AND "managed_division" IS NULL
  ) THEN
    RAISE EXCEPTION 'Active division officers must have a division before migrating their roles';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
      AND "is_active" = true
    GROUP BY "role", "managed_division"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate active division officers must be resolved before migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users" AS account
    JOIN "members" AS member ON member."user_id" = account."id"
    JOIN "periods" AS period ON period."is_active" = true
    JOIN "memberships" AS membership
      ON membership."member_id" = member."id"
      AND membership."period_id" = period."id"
    WHERE account."role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
      AND account."is_active" = true
      AND membership."status" <> 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Active division officers must have active membership in the active period';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
  ) AND NOT EXISTS (
    SELECT 1 FROM "periods" WHERE "is_active" = true
  ) THEN
    RAISE EXCEPTION 'An active period is required to migrate division officers';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "users"
    WHERE "role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
  ) AND (
    SELECT COUNT(*) FROM "periods" WHERE "is_active" = true
  ) <> 1 THEN
    RAISE EXCEPTION 'Exactly one active period is required to migrate division officers';
  END IF;
END $$;

WITH active_period AS (
  SELECT
    "id",
    EXTRACT(YEAR FROM "start_date")::integer AS "period_year"
  FROM "periods"
  WHERE "is_active" = true
  ORDER BY "start_date" DESC
  LIMIT 1
),
member_code_base AS (
  SELECT
    period."period_year",
    COALESCE(
      MAX(substring(member."member_code" FROM ('^RTX-' || period."period_year" || '-([0-9]+)$'))::integer),
      0
    ) AS "last_serial"
  FROM active_period AS period
  LEFT JOIN "members" AS member
    ON member."member_code" ~ ('^RTX-' || period."period_year" || '-[0-9]+$')
  GROUP BY period."period_year"
),
users_without_member AS (
  SELECT
    account."id",
    account."name",
    account."created_at",
    code."period_year",
    code."last_serial",
    ROW_NUMBER() OVER (ORDER BY account."created_at", account."id") AS "row_number"
  FROM "users" AS account
  CROSS JOIN member_code_base AS code
  LEFT JOIN "members" AS member ON member."user_id" = account."id"
  WHERE account."role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
    AND member."id" IS NULL
)
INSERT INTO "members" (
  "id",
  "member_code",
  "full_name",
  "nim",
  "cohort",
  "user_id",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  'RTX-' || "period_year" || '-' || LPAD(("last_serial" + "row_number")::text, 3, '0'),
  "name",
  'PENG' || SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 28),
  NULL,
  "id",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users_without_member;

INSERT INTO "memberships" (
  "id",
  "member_id",
  "period_id",
  "division",
  "status",
  "joined_at",
  "ended_at"
)
SELECT
  gen_random_uuid(),
  member."id",
  period."id",
  COALESCE(account."managed_division", 'Organisasi'),
  CASE WHEN account."is_active" THEN 'ACTIVE'::"membership_status" ELSE 'EXITED'::"membership_status" END,
  CURRENT_TIMESTAMP,
  CASE WHEN account."is_active" THEN NULL ELSE CURRENT_TIMESTAMP END
FROM "users" AS account
JOIN "members" AS member ON member."user_id" = account."id"
CROSS JOIN (
  SELECT "id" FROM "periods" WHERE "is_active" = true ORDER BY "start_date" DESC LIMIT 1
) AS period
LEFT JOIN "memberships" AS membership
  ON membership."member_id" = member."id"
  AND membership."period_id" = period."id"
WHERE account."role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
  AND membership."id" IS NULL;

INSERT INTO "officer_assignments" (
  "id",
  "member_id",
  "period_id",
  "position",
  "division"
)
SELECT
  gen_random_uuid(),
  member."id",
  period."id",
  CASE account."role"
    WHEN 'DIVISION_LEAD' THEN 'ketua-divisi'
    ELSE 'pj-divisi'
  END,
  account."managed_division"
FROM "users" AS account
JOIN "members" AS member ON member."user_id" = account."id"
JOIN "periods" AS period ON period."is_active" = true
JOIN "memberships" AS membership
  ON membership."member_id" = member."id"
  AND membership."period_id" = period."id"
  AND membership."status" = 'ACTIVE'
WHERE account."role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
  AND account."is_active" = true
ON CONFLICT ("member_id", "period_id", "position")
DO UPDATE SET "division" = EXCLUDED."division";

INSERT INTO "position_page_access" (
  "id",
  "position",
  "page_key",
  "enabled",
  "updated_at"
)
SELECT
  gen_random_uuid(),
  CASE access."role"
    WHEN 'DIVISION_LEAD' THEN 'ketua-divisi'
    ELSE 'pj-divisi'
  END,
  access."page_key",
  access."enabled",
  access."updated_at"
FROM "role_page_access" AS access
WHERE access."role" IN ('DIVISION_LEAD', 'DIVISION_PJ')
ON CONFLICT ("position", "page_key") DO NOTHING;

DELETE FROM "role_page_access"
WHERE "role" IN ('DIVISION_LEAD', 'DIVISION_PJ');

UPDATE "users"
SET "role" = 'MEMBER',
    "managed_division" = NULL
WHERE "role" IN ('DIVISION_LEAD', 'DIVISION_PJ');
