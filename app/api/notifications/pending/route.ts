import { NextResponse } from "next/server";

import { getPendingBrowserReminders } from "@/lib/notifications/reminder.service";

export async function GET() {
  const reminders = await getPendingBrowserReminders();
  return NextResponse.json({ reminders });
}
