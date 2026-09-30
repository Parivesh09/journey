-- AlterTable
ALTER TABLE "ArchifyDiagram" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "sourceJson" SET DATA TYPE JSONB,
ALTER COLUMN "errorMetadata" SET DATA TYPE JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "RoadmapVisualizationConfig" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "plannedHours" INTEGER,
ADD COLUMN     "plannedSeconds" INTEGER,
ADD COLUMN     "startTime" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "ArchifyDiagram" ADD CONSTRAINT "ArchifyDiagram_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "RoadmapVisualizationConfig"("roadmapId") ON DELETE CASCADE ON UPDATE CASCADE;
