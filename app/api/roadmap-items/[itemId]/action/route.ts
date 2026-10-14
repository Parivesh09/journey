import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import { getUserMilestones } from "@/lib/business/milestones";
import { completeMilestoneManually, ManualCompleteError } from "@/lib/business/milestones";

export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string; action: string }> }
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, action } = await context.params;
  const body = await request.json();
  const { roadmapId } = body;

  if (!roadmapId) {
    return NextResponse.json(
      { error: "roadmapId is required" },
      { status: 400 }
    );
  }

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

    // Find the task, milestone, or topic
    let task = null;
    let milestone = null;
    let topic = null;

    // Check if it's a task
    task = await prisma.task.findFirst({
      where: {
        id: itemId,
        userId: user.id,
        roadmapId: template.id,
      },
    });

    if (task) {
      // Handle task actions
      switch (action) {
        case "start":
          return NextResponse.json({ started: true, itemId });
        case "pause":
          return NextResponse.json({ paused: true, itemId });
        case "resume":
          return NextResponse.json({ resumed: true, itemId });
        case "restart":
          return NextResponse.json({ restarted: true, itemId });
        case "complete":
          // Complete the task
          await prisma.task.update({
            where: { id: itemId },
            data: { 
              status: "COMPLETED",
              completedAt: new Date()
            }
          });
          return NextResponse.json({ completed: true, itemId });
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }
    }

    // Check if it's a milestone
    milestone = template.milestones.find((m) => m.id === itemId);
    if (milestone) {
      // Handle milestone actions
      switch (action) {
        case "start":
          return NextResponse.json({ started: true, itemId });
        case "pause":
          return NextResponse.json({ paused: true, itemId });
        case "resume":
          return NextResponse.json({ resumed: true, itemId });
        case "restart":
          return NextResponse.json({ restarted: true, itemId });
        case "complete":
          // Complete the milestone manually
          try {
            await completeMilestoneManually(user.id, roadmapId, itemId);
            return NextResponse.json({ completed: true, itemId });
          } catch (error) {
            if (error instanceof ManualCompleteError) {
              return NextResponse.json(
                { 
                  error: error.message, 
                  reasons: error.reasons 
                },
                { status: 409 }
              );
            }
            throw error;
          }
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }
    }

    // Check if it's a topic (need to find it in phases)
    for (const phase of template.phases) {
      if (phase.topics) {
        topic = phase.topics.find((t) => t.id === itemId);
        if (topic) break;
      }
    }

    if (topic) {
      // Handle topic actions
      switch (action) {
        case "start":
          return NextResponse.json({ started: true, itemId });
        case "pause":
          return NextResponse.json({ paused: true, itemId });
        case "resume":
          return NextResponse.json({ resumed: true, itemId });
        case "restart":
          return NextResponse.json({ restarted: true, itemId });
        case "complete":
          // For topics, completion is manual - mark all tasks in topic as complete
          const topicTasks = await prisma.task.findMany({
            where: {
              userId: user.id,
              roadmapId: template.id,
              topicId: topic.id,
              status: { not: "COMPLETED" }
            }
          });

          if (topicTasks.length > 0) {
            await prisma.task.updateMany({
              where: {
                id: { in: topicTasks.map(t => t.id) }
              },
              data: {
                status: "COMPLETED",
                completedAt: new Date()
              }
            });
          }
          return NextResponse.json({ completed: true, itemId });
        default:
          return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
          );
      }
    }

    // Item not found
    return NextResponse.json(
      { error: "Item not found" },
      { status: 404 }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unknown roadmap template")) {
      return NextResponse.json(
        { error: "Roadmap not found" },
        { status: 404 }
      );
    }
    console.error("Failed to process roadmap item action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}