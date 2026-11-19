CREATE TYPE "announcement_type" AS ENUM ('ANNOUNCEMENT', 'ACTIVITY', 'OPPORTUNITY');

CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "excerpt" VARCHAR(320) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "announcement_type" NOT NULL DEFAULT 'ANNOUNCEMENT',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "announcements_slug_key" ON "announcements"("slug");
CREATE INDEX "announcements_is_published_published_at_idx" ON "announcements"("is_published", "published_at");
