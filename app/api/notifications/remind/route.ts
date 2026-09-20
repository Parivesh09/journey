import { NextResponse } from "next/server";

import {
  previewDueReminders,
  sendDueReminders,
} from "@/lib/notifications/reminder.service";

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

  const url = new URL(request.url);
  if (url.searchParams.get("dryRun") === "true") {
    return NextResponse.json({ preview: await previewDueReminders() });
  }

  return NextResponse.json({ results: await sendDueReminders() });
}

export async function POST(request: Request) {
  return GET(request);
}