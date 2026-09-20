ALTER TABLE "User"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC',
  ADD COLUMN "onboardingDismissedAt" TIMESTAMP(3);

ALTER TABLE "NotificationPreference"
  ALTER COLUMN "browserEnabled" SET DEFAULT false,
  ALTER COLUMN "dailyReminderEnabled" SET DEFAULT false,
  ALTER COLUMN "missedTaskReminderEnabled" SET DEFAULT false,
  ALTER COLUMN "revisionReminderEnabled" SET DEFAULT false,
  ALTER COLUMN "weeklySummaryEnabled" SET DEFAULT false;
