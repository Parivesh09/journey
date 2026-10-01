-- Scope AI provider secrets to a user so one user's key can never be read by another.
--
-- Legacy rows had no owner. They are attributed to the earliest-created user rather
-- than deleted, because an unattributable global key is still a real credential; that
-- user must rotate it. If no user exists there is nothing to own, so rows are dropped.

-- 1. Add nullable owner column.
ALTER TABLE "AIProviderSecret" ADD COLUMN "userId" TEXT;

-- 2. Backfill legacy global secrets to the earliest user.
UPDATE "AIProviderSecret" s
SET "userId" = (SELECT u.id FROM "User" u ORDER BY u."createdAt" ASC, u.id ASC LIMIT 1)
WHERE s."userId" IS NULL;

-- 3. Drop orphans that no user can own.
DELETE FROM "AIProviderSecret" WHERE "userId" IS NULL;

-- 4. Enforce ownership.
ALTER TABLE "AIProviderSecret" ALTER COLUMN "userId" SET NOT NULL;

-- 5. Replace the global uniqueness with per-user uniqueness.
ALTER TABLE "AIProviderSecret" DROP CONSTRAINT IF EXISTS "unique_provider_secret_version";
DROP INDEX IF EXISTS "idx_ai_provider_secret_provider_id";

ALTER TABLE "AIProviderSecret"
  ADD CONSTRAINT "unique_user_provider_secret_version" UNIQUE ("userId", "providerId", "version");

CREATE INDEX "idx_ai_provider_secret_user_provider" ON "AIProviderSecret"("userId", "providerId");

-- 6. Owner cascade.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ai_provider_secret_user'
  ) THEN
    ALTER TABLE "AIProviderSecret"
      ADD CONSTRAINT "fk_ai_provider_secret_user"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;
