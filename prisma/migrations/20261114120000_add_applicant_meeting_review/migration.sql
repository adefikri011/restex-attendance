CREATE TYPE "applicant_meeting_attendance" AS ENUM ('PRESENT', 'ABSENT');

ALTER TABLE "recruitment_applications"
    ADD COLUMN "meeting_attendance" "applicant_meeting_attendance",
    ADD COLUMN "meeting_notes" TEXT;
