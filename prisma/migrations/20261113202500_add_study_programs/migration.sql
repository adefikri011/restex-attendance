CREATE TABLE "study_programs" (
    "id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "normalized_name" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "recruitment_applications"
    ADD COLUMN "study_program_id" UUID;

INSERT INTO "study_programs" ("id", "name", "normalized_name")
SELECT
    gen_random_uuid(),
    MIN("display_name"),
    "normalized_name"
FROM (
    SELECT
        COALESCE(
            NULLIF(
                regexp_replace(btrim("study_program"), '[[:space:]]+', ' ', 'g'),
                ''
            ),
            'Belum diisi'
        ) AS "display_name",
        COALESCE(
            NULLIF(
                lower(regexp_replace(btrim("study_program"), '[[:space:]]+', ' ', 'g')),
                ''
            ),
            '__belum_diisi__'
        ) AS "normalized_name"
    FROM "recruitment_applications"
) AS "legacy_programs"
GROUP BY "normalized_name";

UPDATE "recruitment_applications" AS "application"
SET "study_program_id" = "program"."id"
FROM "study_programs" AS "program"
WHERE "program"."normalized_name" = COALESCE(
    NULLIF(
        lower(
            regexp_replace(
                btrim("application"."study_program"),
                '[[:space:]]+',
                ' ',
                'g'
            )
        ),
        ''
    ),
    '__belum_diisi__'
);

UPDATE "study_programs"
SET "name" = 'Belum diisi'
WHERE "normalized_name" = '__belum_diisi__';

ALTER TABLE "recruitment_applications"
    ALTER COLUMN "study_program_id" SET NOT NULL;

CREATE UNIQUE INDEX "study_programs_normalized_name_key"
    ON "study_programs"("normalized_name");

CREATE INDEX "study_programs_name_idx"
    ON "study_programs"("name");

CREATE INDEX "recruitment_applications_study_program_id_idx"
    ON "recruitment_applications"("study_program_id");

ALTER TABLE "recruitment_applications"
    ADD CONSTRAINT "recruitment_applications_study_program_id_fkey"
    FOREIGN KEY ("study_program_id") REFERENCES "study_programs"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "recruitment_applications"
    DROP COLUMN "study_program";
