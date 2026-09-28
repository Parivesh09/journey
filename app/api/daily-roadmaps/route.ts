import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import type { LinkedRoadmap, LinkRoadmapResponse, UnlinkRoadmapResponse, DailyRoadmapsResponse, RoadmapSummary } from "@/lib/types";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const linkedRoadmaps = await prisma.userDailyRoadmap.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  const formattedRoadmaps: LinkedRoadmap[] = linkedRoadmaps.map((lr) => {
    let roadmapSummary: RoadmapSummary;
    try {
      const roadmap = readRoadmap(lr.roadmapId);
      roadmapSummary = {
        id: roadmap.id,
        title: roadmap.title,
        description: roadmap.description ?? null,
        activated: true,
        dailyTaskCount: 0,
      };
    } catch {
      roadmapSummary = {
        id: lr.roadmapId,
        title: lr.roadmapId,
        description: null,
        activated: true,
        dailyTaskCount: 0,
      };
    }
    return {
      id: lr.id,
      roadmapId: lr.roadmapId,
      roadmap: roadmapSummary,
    };
  });

  return NextResponse.json<DailyRoadmapsResponse>({ linkedRoadmaps: formattedRoadmaps });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as { roadmapId?: string };
  if (typeof body.roadmapId !== "string" || !body.roadmapId) {
    return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });
  }

  // Check if already linked
  const existing = await prisma.userDailyRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: body.roadmapId } }
  });
  
  if (existing) {
    return NextResponse.json<LinkRoadmapResponse>({ 
      message: "Roadmap already linked to daily tasks",
      linked: true,
      userDailyRoadmap: existing
    });
  }

  const userDailyRoadmap = await prisma.userDailyRoadmap.create({
    data: { userId: user.id, roadmapId: body.roadmapId }
  });

  return NextResponse.json<LinkRoadmapResponse>({ 
    message: "Roadmap linked to daily tasks",
    linked: true,
    userDailyRoadmap 
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const roadmapId = url.searchParams.get("roadmapId");

  if (!roadmapId) {
    return NextResponse.json({ error: "roadmapId is required" }, { status: 400 });
  }

  const deleted = await prisma.userDailyRoadmap.delete({
    where: { userId_roadmapId: { userId: user.id, roadmapId } }
  });

  if (!deleted) {
    return NextResponse.json({ error: "Linked roadmap not found" }, { status: 404 });
  }

  return NextResponse.json<UnlinkRoadmapResponse>({ 
    message: "Roadmap unlinked from daily tasks",
    linked: false 
  });
}