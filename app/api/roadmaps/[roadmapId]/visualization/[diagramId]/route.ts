import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderingService } from "@/lib/visualization/rendering-service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roadmapId: string; diagramId: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsValue = await params;
    const { roadmapId, diagramId } = paramsValue;

    // Get specific diagram
    const diagram = await prisma.archifyDiagram.findFirst({
      where: { id: diagramId, roadmapId },
    });

    if (!diagram) {
      return NextResponse.json(
        { error: "Diagram not found" },
        { status: 404 }
      );
    }

    // Ensure rendered HTML exists
    if (!diagram.renderedHtml) {
      await renderingService.updateRenderedHtml(diagram.id);
    }

    return NextResponse.json({
      id: diagram.id,
      roadmapId: diagram.roadmapId,
      diagramType: diagram.diagramType,
      status: diagram.status,
      generatedAt: diagram.generatedAt,
      updatedAt: diagram.updatedAt,
      viewerUrl: `/roadmaps/${roadmapId}/visualize?diagramType=${diagram.diagramType}&diagramId=${diagram.id}`,
      isStale: diagram.status === "stale",
    });
  } catch (error) {
    console.error("Error fetching visualization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ roadmapId: string; diagramId: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsValue = await params;
    const { roadmapId, diagramId } = paramsValue;

    // Verify ownership
    const diagram = await prisma.archifyDiagram.findFirst({
      where: { id: diagramId, roadmapId },
    });

    if (!diagram) {
      return NextResponse.json(
        { error: "Diagram not found" },
        { status: 404 }
      );
    }

    // Delete the diagram
    await prisma.archifyDiagram.delete({
      where: { id: diagramId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting visualization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}