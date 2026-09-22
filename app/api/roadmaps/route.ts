import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { provisionRoadmapForUser } from "@/lib/business/roadmap-provision";
import { readRoadmap } from "@/lib/business/roadmap-templates";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const activations = await prisma.userRoadmap.findMany({
    where: { userId: user.id },
    orderBy: { activatedAt: "asc" },
  });

  const roadmaps = await Promise.all(
    activations.map(async (activation) => {
      let summary: { id: string; title: string; description: string | null; activated: boolean };
      try {
        const template = readRoadmap(activation.roadmapId);
        summary = {
          id: template.id,
          title: template.title,
          description: template.description ?? null,
          activated: true,
        };
      } catch {
        summary = {
          id: activation.roadmapId,
          title: activation.roadmapId,
          description: null,
          activated: false,
        };
      }
      return summary;
    })
  );

  return NextResponse.json({ roadmaps });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { roadmapId?: string };
  const roadmapId = body.roadmapId;
  if (typeof roadmapId !== "string" || !roadmapId) {
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

  const existing = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: template.id } },
    select: { id: true },
  });

  const result = await provisionRoadmapForUser(user.id, template.id);
  return NextResponse.json({
    activated: !existing,
    ...result,
  });
}