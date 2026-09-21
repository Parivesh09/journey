import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getUserMilestones } from "@/lib/business/milestones";
import { readRoadmap } from "@/lib/business/roadmap-templates";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const roadmapId = url.searchParams.get("roadmapId") ?? "";
  if (!roadmapId) {
    return NextResponse.json(
      { error: "roadmapId is required" },
      { status: 400 },
    );
  }

  let template;
  try {
    template = readRoadmap(roadmapId);
  } catch {
    return NextResponse.json(
      { error: `Unknown roadmap template: ${roadmapId}` },
      { status: 404 },
    );
  }

  const activated = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: template.id } },
    select: { id: true },
  });
  if (!activated) {
    return NextResponse.json(
      { error: "Roadmap not activated" },
      { status: 404 },
    );
  }

  const [data, pinnedTasks] = await Promise.all([
    getUserMilestones(user.id, template.id),
    prisma.dailyTaskPin.findMany({
      where: { userId: user.id, task: { roadmapId: template.id } },
      select: { taskId: true },
    }),
  ]);

  return NextResponse.json({
    ...data,
    pinnedTaskIds: pinnedTasks.map((pin) => pin.taskId),
  });
}