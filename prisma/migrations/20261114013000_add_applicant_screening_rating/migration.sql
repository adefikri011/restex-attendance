CREATE TYPE "applicant_screening_rating" AS ENUM (
    'RECOMMENDED',
    'CONSIDER',
    'NOT_RECOMMENDED'
);

ALTER TABLE "recruitment_applications"
    ADD COLUMN "screening_rating" "applicant_screening_rating";

CREATE INDEX "recruitment_applications_screening_rating_stage_idx"
    ON "recruitment_applications"("screening_rating", "stage");
