/*
  Warnings:

  - A unique constraint covering the columns `[userId,sourceId]` on the table `Task` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dailySlot" TEXT,
ADD COLUMN     "isDailyTask" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "plannedMinutes" INTEGER;

-- CreateIndex
CREATE INDEX "Task_userId_dueDate_isDailyTask_idx" ON "Task"("userId", "dueDate", "isDailyTask");

-- CreateIndex
CREATE UNIQUE INDEX "Task_userId_sourceId_key" ON "Task"("userId", "sourceId");
