CREATE TABLE "divisions" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");
CREATE INDEX "divisions_is_active_sort_order_name_idx" ON "divisions"("is_active", "sort_order", "name");

INSERT INTO "divisions" ("id", "name", "is_active", "sort_order") VALUES
    (gen_random_uuid(), 'Wiring & Electrical', true, 1),
    (gen_random_uuid(), 'Programing', true, 2),
    (gen_random_uuid(), 'Research', true, 3),
    (gen_random_uuid(), 'Manufacture & Mechanical', true, 4);

INSERT INTO "divisions" ("id", "name", "is_active")
SELECT gen_random_uuid(), legacy."name", false
FROM (
    SELECT DISTINCT "division" AS "name" FROM "memberships"
    UNION
    SELECT DISTINCT "managed_division" AS "name"
    FROM "users"
    WHERE "managed_division" IS NOT NULL
) AS legacy
WHERE NOT EXISTS (
    SELECT 1 FROM "divisions" WHERE "divisions"."name" = legacy."name"
);
