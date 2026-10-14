import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getRoadmapExecution } from "@/lib/business/roadmap-progress";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roadmapId = searchParams.get("roadmapId");

  if (!roadmapId) {
    // Return list of activated roadmaps (existing behavior)
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

  // Return execution state for specific roadmap
  try {
    const template = readRoadmap(roadmapId);
    const activated = await prisma.userRoadmap.findUnique({
      where: { userId_roadmapId: { userId: user.id, roadmapId: template.id } },
      select: { id: true },
    });
    if (!activated) {
      return NextResponse.json(
        { error: "Roadmap not activated" },
        { status: 404 }
      );
    }

    const execution = await getRoadmapExecution(user.id, roadmapId);
    return NextResponse.json(execution);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unknown roadmap template")) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }
    console.error("Failed to get roadmap execution:", error);
    return NextResponse.json(
      { error: "Failed to load roadmap execution" },
      { status: 500 }
    );
  }
}