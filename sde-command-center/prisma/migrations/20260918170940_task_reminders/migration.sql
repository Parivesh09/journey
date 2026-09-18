/*
  Warnings:

  - A unique constraint covering the columns `[reminderKey]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "reminderKey" TEXT,
ADD COLUMN     "taskId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Notification_reminderKey_key" ON "Notification"("reminderKey");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
