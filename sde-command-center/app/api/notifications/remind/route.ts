import { NextResponse } from "next/server";

import { sendNextTaskReminder } from "@/lib/notifications/reminder.service";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return (
    Boolean(secret) &&
    request.headers.get("authorization") === `Bearer ${secret}`
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await sendNextTaskReminder());
}

export async function POST(request: Request) {
  return GET(request);
}
