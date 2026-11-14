CREATE TABLE "recruitment_settings" (
    "id" VARCHAR(20) NOT NULL DEFAULT 'global',
    "open" BOOLEAN NOT NULL DEFAULT false,
    "opens_at" DATE,
    "closes_at" DATE,
    "register_url" VARCHAR(2048) NOT NULL DEFAULT '',
    "notify_url" VARCHAR(2048) NOT NULL DEFAULT '',
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "recruitment_settings_pkey" PRIMARY KEY ("id")
);
