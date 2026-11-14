CREATE TYPE "applicant_meeting_mode" AS ENUM ('IN_PERSON', 'ONLINE');

ALTER TABLE "recruitment_settings"
    ADD COLUMN "zoom_enabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "zoom_url" VARCHAR(2048) NOT NULL DEFAULT '';

CREATE TABLE "recruitment_meeting_sessions" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "location" VARCHAR(240) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recruitment_meeting_sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "recruitment_meeting_sessions_capacity_check" CHECK ("capacity" > 0),
    CONSTRAINT "recruitment_meeting_sessions_time_check" CHECK ("ends_at" > "starts_at")
);

ALTER TABLE "recruitment_applications"
    ADD COLUMN "meeting_mode" "applicant_meeting_mode",
    ADD COLUMN "meeting_session_id" UUID,
    ADD CONSTRAINT "recruitment_applications_meeting_choice_check"
        CHECK (
            ("meeting_mode" IS NULL AND "meeting_session_id" IS NULL)
            OR ("meeting_mode" = 'ONLINE' AND "meeting_session_id" IS NULL)
            OR ("meeting_mode" = 'IN_PERSON' AND "meeting_session_id" IS NOT NULL)
        ),
    ADD CONSTRAINT "recruitment_applications_meeting_session_id_fkey"
        FOREIGN KEY ("meeting_session_id") REFERENCES "recruitment_meeting_sessions"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "recruitment_meeting_sessions_is_active_starts_at_idx"
    ON "recruitment_meeting_sessions"("is_active", "starts_at");

CREATE INDEX "recruitment_applications_meeting_session_id_idx"
    ON "recruitment_applications"("meeting_session_id");
