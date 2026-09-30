-- Migration: 20260930154000_ai_provider_system
-- Description: Add AI Provider system tables for database-driven AI configuration


-- Create AIProviderDefinition table
CREATE TABLE "AIProviderDefinition" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "capabilities" JSON NOT NULL,
    "endpoint" TEXT,
    "apiKeyRequired" BOOLEAN NOT NULL DEFAULT true,
    "supportsModelDiscovery" BOOLEAN NOT NULL DEFAULT false,
    "documentationUrl" TEXT,
    "metadata" JSON,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id")
);

-- Create AIProvider table
CREATE TABLE "AIProvider" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENABLED',
    "endpoint" TEXT NOT NULL,
    "model" TEXT,
    "capabilities" JSON,
    "configuration" JSON,
    "metadata" JSON,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isManagedByEnv" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "definitionId" TEXT,
    PRIMARY KEY ("id"),
    CONSTRAINT "AIProvider_slug_key" UNIQUE ("slug"),
    CONSTRAINT "fk_ai_provider_definition" FOREIGN KEY ("definitionId") REFERENCES "AIProviderDefinition"("id") ON DELETE SET NULL
);

-- Create AIProviderSecret table
CREATE TABLE "AIProviderSecret" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "providerId" TEXT NOT NULL,
    "encryptedApiKey" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    PRIMARY KEY ("id"),
    CONSTRAINT "unique_provider_secret_version" UNIQUE ("providerId", "version"),
    CONSTRAINT "fk_ai_provider_secret" FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id") ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX "idx_ai_provider_slug" ON "AIProvider" ("slug");
CREATE INDEX "idx_ai_provider_status" ON "AIProvider" ("status");
CREATE INDEX "idx_ai_provider_is_system" ON "AIProvider" ("isSystem");
CREATE INDEX "idx_ai_provider_is_default" ON "AIProvider" ("isDefault");
CREATE INDEX "idx_ai_provider_secret_provider_id" ON "AIProviderSecret" ("providerId");


-- Modify ArchifyDiagram table to add provider reference
ALTER TABLE "ArchifyDiagram" ADD COLUMN "providerId" TEXT;
ALTER TABLE "ArchifyDiagram" ADD COLUMN "modelUsed" TEXT;
ALTER TABLE "ArchifyDiagram" ADD CONSTRAINT "fk_archify_diagram_provider" FOREIGN KEY ("providerId") REFERENCES "AIProvider"("id") ON DELETE SET NULL;
CREATE INDEX "idx_archify_diagram_provider_id" ON "ArchifyDiagram" ("providerId");
