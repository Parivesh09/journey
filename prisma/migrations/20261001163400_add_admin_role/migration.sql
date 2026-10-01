-- Add admin role enum and column to User model
-- This is an additive migration only. All existing users default to USER role.

-- 1. Create UserRole enum type
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add role column to User table with default USER
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'USER';

-- 3. Create index on role for efficient admin lookups
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");

-- 4. Backfill existing users to USER role (defensive, default should handle this)
UPDATE "User" SET "role" = 'USER' WHERE "role" IS NULL;
