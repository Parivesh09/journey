-- AlterEnum
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'SMS';
ALTER TYPE "NotificationChannel" ADD VALUE IF NOT EXISTS 'WHATSAPP';

-- AlterTable
ALTER TABLE "User"
  ADD COLUMN "dailyStudyTargetMinutes" INTEGER NOT NULL DEFAULT 240,
  ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'dark';

-- AlterTable
ALTER TABLE "NotificationPreference"
  ADD COLUMN "phoneNumber" TEXT,
  ADD COLUMN "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "whatsappEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reminderSchedule" JSONB,
  ADD COLUMN "overdueRemindersEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "excludeCompletedTasks" BOOLEAN NOT NULL DEFAULT true;