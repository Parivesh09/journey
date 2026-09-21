-- AlterTable: roadmap identity on tasks + personal routines
ALTER TABLE "Task"
  ADD COLUMN "roadmapId" TEXT,
  ADD COLUMN "milestoneId" TEXT,
  ADD COLUMN "milestoneTitle" TEXT,
  ADD COLUMN "isPersonalDaily" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Task_userId_roadmapId_isPersonalDaily_idx"
  ON "Task"("userId", "roadmapId", "isPersonalDaily");

-- AlterTable: TaskCompletion now links to User/Task and enforces one completion per day
ALTER TABLE "TaskCompletion"
  ADD CONSTRAINT "TaskCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion"
  ADD CONSTRAINT "TaskCompletion_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TaskCompletion_userId_taskId_completedAt_key"
  ON "TaskCompletion"("userId", "taskId", "completedAt");

-- CreateTable: a roadmap task explicitly connected to the user's daily list
CREATE TABLE "DailyTaskPin" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyTaskPin_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DailyTaskPin_userId_taskId_key" ON "DailyTaskPin"("userId", "taskId");
CREATE INDEX "DailyTaskPin_userId_createdAt_idx" ON "DailyTaskPin"("userId", "createdAt");
ALTER TABLE "DailyTaskPin" ADD CONSTRAINT "DailyTaskPin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyTaskPin" ADD CONSTRAINT "DailyTaskPin_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: which roadmaps a user has activated (parallel templates)
CREATE TABLE "UserRoadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRoadmap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserRoadmap_userId_roadmapId_key" ON "UserRoadmap"("userId", "roadmapId");
CREATE INDEX "UserRoadmap_userId_activatedAt_idx" ON "UserRoadmap"("userId", "activatedAt");
ALTER TABLE "UserRoadmap" ADD CONSTRAINT "UserRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: manual milestone overrides (only "done manually" rows are stored)
CREATE TABLE "UserMilestone" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "milestoneId" TEXT NOT NULL,
    "manuallyCompletedAt" TIMESTAMP(3),

    CONSTRAINT "UserMilestone_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMilestone_userId_roadmapId_milestoneId_key" ON "UserMilestone"("userId", "roadmapId", "milestoneId");
CREATE INDEX "UserMilestone_userId_roadmapId_idx" ON "UserMilestone"("userId", "roadmapId");
ALTER TABLE "UserMilestone" ADD CONSTRAINT "UserMilestone_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;