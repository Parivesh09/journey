-- CreateTable
CREATE TABLE "RoadmapVisualizationConfig" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "roadmapId" TEXT NOT NULL,
    "archifyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "defaultDiagramType" TEXT NOT NULL DEFAULT 'architecture',
    "allowedDiagramTypes" TEXT[] NOT NULL DEFAULT ARRAY['architecture']::TEXT[],
    "aiGenerationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "generationStrategy" TEXT,
    "regenerationPolicy" TEXT,
    "maxNodes" INTEGER,
    "promptVersion" TEXT NOT NULL DEFAULT '1',
    "generationVersion" TEXT NOT NULL DEFAULT '1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "RoadmapVisualizationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapVisualizationConfig_roadmapId_key" ON "RoadmapVisualizationConfig"("roadmapId");

-- CreateTable
CREATE TABLE "ArchifyDiagram" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "roadmapId" TEXT NOT NULL,
    "diagramType" TEXT NOT NULL,
    "sourceJson" JSON NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "roadmapVersion" TEXT NOT NULL,
    "generationVersion" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "errorMetadata" JSON,
    "renderedHtml" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),

    CONSTRAINT "ArchifyDiagram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArchifyDiagram_roadmapId_diagramType_idx" ON "ArchifyDiagram"("roadmapId", "diagramType");

-- CreateIndex
CREATE INDEX "ArchifyDiagram_roadmapId_status_idx" ON "ArchifyDiagram"("roadmapId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ArchifyDiagram_roadmapId_diagramType_roadmapVersion_key" ON "ArchifyDiagram"("roadmapId", "diagramType", "roadmapVersion");

-- CreateTrigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "RoadmapVisualizationConfig_updatedAt" BEFORE UPDATE ON "RoadmapVisualizationConfig" FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER "ArchifyDiagram_updatedAt" BEFORE UPDATE ON "ArchifyDiagram" FOR EACH ROW EXECUTE FUNCTION set_updated_at();