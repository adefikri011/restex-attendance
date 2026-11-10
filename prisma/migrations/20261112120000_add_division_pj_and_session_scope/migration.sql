ALTER TYPE "user_role" ADD VALUE 'DIVISION_PJ';

ALTER TABLE "sessions"
ADD COLUMN "division" VARCHAR(100);

CREATE INDEX "sessions_period_id_division_status_scheduled_at_idx"
ON "sessions"("period_id", "division", "status", "scheduled_at");
