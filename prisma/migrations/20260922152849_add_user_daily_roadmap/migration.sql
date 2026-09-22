-- DropIndex
DROP INDEX "UserMilestone_userId_roadmapId_idx";

-- DropIndex
DROP INDEX "UserRoadmap_userId_activatedAt_idx";

-- CreateTable
CREATE TABLE "UserDailyRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDailyRoadmap_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserDailyRoadmap_userId_idx" ON "UserDailyRoadmap"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyRoadmap_userId_roadmapId_key" ON "UserDailyRoadmap"("userId", "roadmapId");

-- AddForeignKey
ALTER TABLE "UserDailyRoadmap" ADD CONSTRAINT "UserDailyRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
