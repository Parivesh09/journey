import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const linkedRoadmaps = await (prisma as any).userDailyRoadmap.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ linkedRoadmaps });
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
  const existing = await (prisma as any).userDailyRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: body.roadmapId } }
  });
  
  if (existing) {
    return NextResponse.json({ 
      message: "Roadmap already linked to daily tasks",
      linked: true 
    });
  }

  const userDailyRoadmap = await (prisma as any).userDailyRoadmap.create({
    data: { userId: user.id, roadmapId: body.roadmapId }
  });

  return NextResponse.json({ 
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

  const deleted = await (prisma as any).userDailyRoadmap.delete({
    where: { userId_roadmapId: { userId: user.id, roadmapId } }
  });

  if (!deleted) {
    return NextResponse.json({ error: "Linked roadmap not found" }, { status: 404 });
  }

  return NextResponse.json({ 
    message: "Roadmap unlinked from daily tasks",
    linked: false 
  });
}