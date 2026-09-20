import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId: user.id },
    select: {
      browserEnabled: true,
      emailEnabled: true,
      smsEnabled: true,
      phoneNumber: true,
      dailyReminderEnabled: true,
    },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
      theme: user.theme,
      onboardingDismissedAt: user.onboardingDismissedAt,
    },
    notificationPreferences: preferences,
  });
}