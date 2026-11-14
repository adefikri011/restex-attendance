ALTER TYPE "user_role" ADD VALUE 'CANDIDATE';

CREATE TYPE "applicant_stage" AS ENUM (
    'SUBMITTED',
    'SCREENING',
    'MEETING_INVITED',
    'FORM_TWO_OPEN',
    'FORM_TWO_SUBMITTED',
    'FINAL_REVIEW'
);

CREATE TYPE "applicant_decision" AS ENUM (
    'ACCEPTED',
    'REJECTED',
    'WAITLISTED'
);

CREATE TABLE "recruitment_applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(160) NOT NULL,
    "nim" VARCHAR(32) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "study_program" VARCHAR(160) NOT NULL,
    "cohort" VARCHAR(4) NOT NULL,
    "stage" "applicant_stage" NOT NULL DEFAULT 'SUBMITTED',
    "decision" "applicant_decision",
    "division" VARCHAR(100),
    "division_reason" TEXT,
    "experience" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recruitment_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recruitment_applications_user_id_key"
    ON "recruitment_applications"("user_id");

CREATE UNIQUE INDEX "recruitment_applications_nim_key"
    ON "recruitment_applications"("nim");

CREATE INDEX "recruitment_applications_stage_created_at_idx"
    ON "recruitment_applications"("stage", "created_at");

ALTER TABLE "recruitment_applications"
    ADD CONSTRAINT "recruitment_applications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
