CREATE TABLE "role_page_access" (
    "id" UUID NOT NULL,
    "role" "user_role" NOT NULL,
    "page_key" VARCHAR(60) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "role_page_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_page_access_role_page_key_key"
ON "role_page_access"("role", "page_key");
CREATE INDEX "role_page_access_page_key_enabled_idx"
ON "role_page_access"("page_key", "enabled");

CREATE TABLE "position_page_access" (
    "id" UUID NOT NULL,
    "position" VARCHAR(60) NOT NULL,
    "page_key" VARCHAR(60) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "position_page_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "position_page_access_position_page_key_key"
ON "position_page_access"("position", "page_key");
CREATE INDEX "position_page_access_page_key_enabled_idx"
ON "position_page_access"("page_key", "enabled");

CREATE TABLE "officer_assignments" (
    "id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "period_id" UUID NOT NULL,
    "position" VARCHAR(60) NOT NULL,
    "division" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "officer_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "officer_assignments_member_id_period_id_position_key"
ON "officer_assignments"("member_id", "period_id", "position");
CREATE INDEX "officer_assignments_period_id_position_idx"
ON "officer_assignments"("period_id", "position");
CREATE INDEX "officer_assignments_member_id_period_id_idx"
ON "officer_assignments"("member_id", "period_id");

ALTER TABLE "officer_assignments"
ADD CONSTRAINT "officer_assignments_member_id_fkey"
FOREIGN KEY ("member_id") REFERENCES "members"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "officer_assignments"
ADD CONSTRAINT "officer_assignments_period_id_fkey"
FOREIGN KEY ("period_id") REFERENCES "periods"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
