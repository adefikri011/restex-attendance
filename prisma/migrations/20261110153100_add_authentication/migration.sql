ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" SET DEFAULT 'MEMBER',
  ALTER COLUMN "password_hash" DROP NOT NULL,
  ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "image" VARCHAR(2048);

CREATE TABLE "auth_sessions" (
  "id" VARCHAR(191) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "token" VARCHAR(191) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "ip_address" VARCHAR(64),
  "user_agent" VARCHAR(512),
  "user_id" UUID NOT NULL,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auth_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "auth_accounts" (
  "id" VARCHAR(191) NOT NULL,
  "account_id" VARCHAR(191) NOT NULL,
  "provider_id" VARCHAR(191) NOT NULL,
  "user_id" UUID NOT NULL,
  "access_token" TEXT,
  "refresh_token" TEXT,
  "id_token" TEXT,
  "access_token_expires_at" TIMESTAMPTZ(3),
  "refresh_token_expires_at" TIMESTAMPTZ(3),
  "scope" TEXT,
  "password" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "auth_accounts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "auth_verifications" (
  "id" VARCHAR(191) NOT NULL,
  "identifier" VARCHAR(191) NOT NULL,
  "value" TEXT NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "auth_verifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts"("user_id");
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications"("identifier");
