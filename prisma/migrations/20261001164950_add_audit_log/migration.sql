-- Add AuditLog model for developer-facing audit trails
-- Append-only table with redaction in application layer

-- 1. Create AuditOutcome enum
DO $$ BEGIN
    CREATE TYPE "AuditOutcome" AS ENUM ('SUCCESS', 'FAILURE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create AuditSource enum
DO $$ BEGIN
    CREATE TYPE "AuditSource" AS ENUM ('UI', 'API', 'CLI', 'SCRIPT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create AuditLog table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorUserId" TEXT,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "changedFields" TEXT[] NOT NULL DEFAULT '{}',
    "outcome" "AuditOutcome" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "method" TEXT,
    "path" TEXT,
    "route" TEXT,
    "statusCode" INTEGER,
    "durationMs" INTEGER,
    "requestId" TEXT,
    "source" "AuditSource" NOT NULL DEFAULT 'API',
    "errorMessage" TEXT,
    "metadata" JSONB,
    
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 4. Add indexes for query performance
CREATE INDEX "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_outcome_idx" ON "AuditLog"("outcome");
CREATE INDEX "AuditLog_requestId_idx" ON "AuditLog"("requestId");

-- 5. Add foreign key to User
ALTER TABLE "AuditLog" 
    ADD CONSTRAINT "AuditLog_actorUserId_fkey" 
    FOREIGN KEY ("actorUserId") REFERENCES "User"("id") 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;
