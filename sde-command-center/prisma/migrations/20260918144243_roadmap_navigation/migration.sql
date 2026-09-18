-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "phaseId" TEXT,
ADD COLUMN     "phaseTitle" TEXT,
ADD COLUMN     "sequenceOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topicId" TEXT,
ADD COLUMN     "topicTitle" TEXT;

-- CreateIndex
CREATE INDEX "Task_userId_sequenceOrder_idx" ON "Task"("userId", "sequenceOrder");

-- CreateIndex
CREATE INDEX "Task_userId_phaseId_idx" ON "Task"("userId", "phaseId");

-- CreateIndex
CREATE INDEX "Task_userId_topicId_idx" ON "Task"("userId", "topicId");

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_idx" ON "Task"("userId", "dueDate");
