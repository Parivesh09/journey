import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Return a safe user object (same as safeUserSelect)
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    timezone: user.timezone,
    dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
    theme: user.theme,
    onboardingDismissedAt: user.onboardingDismissedAt,
    role: user.role,
  };
  return NextResponse.json({ user: safeUser });
}