import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import {
  completeMilestoneManually,
  ManualCompleteError,
} from "@/lib/business/milestones";

export async function POST(
  request: Request,
  context: { params: Promise<{ milestoneId: string }> },
) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { milestoneId } = await context.params;
  const body = (await request.json()) as { roadmapId?: string };
  if (typeof body.roadmapId !== "string" || !body.roadmapId) {
    return NextResponse.json(
      { error: "roadmapId is required" },
      { status: 400 },
    );
  }

  try {
    const result = await completeMilestoneManually(
      user.id,
      body.roadmapId,
      milestoneId,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (
      error instanceof ManualCompleteError &&
      error.message.startsWith("Milestone not found")
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ManualCompleteError) {
      return NextResponse.json(
        { error: error.message, reasons: error.reasons },
        { status: 409 },
      );
    }
    throw error;
  }
}