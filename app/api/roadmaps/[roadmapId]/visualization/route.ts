import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generationService } from "@/lib/visualization/generation-service";
import { renderingService } from "@/lib/visualization/rendering-service";
import { getAIService } from "@/lib/ai/provider";
import { AIProviderError } from "@/lib/ai/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paramsValue = await params;
    const { roadmapId } = paramsValue;
    
    // Get diagramId from query params
    const { searchParams } = new URL(request.url);
    const diagramId = searchParams.get("diagramId");

    // Get visualization config to check permissions
    const config = await prisma.roadmapVisualizationConfig.findUnique({
      where: { roadmapId },
    });

    if (!config?.archifyEnabled) {
      return NextResponse.json(
        { error: "Visualization not enabled for this roadmap" },
        { status: 403 }
      );
    }

    if (diagramId) {
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
    } else {
      // Get latest diagram for this roadmap and diagram type (from query param, default to architecture)
      const { searchParams } = new URL(request.url);
      const diagramType = searchParams.get("diagramType") || "architecture";
      const diagram = await prisma.archifyDiagram.findFirst({
        where: { roadmapId, diagramType },
        orderBy: { updatedAt: "desc" },
      });

      if (!diagram) {
        return NextResponse.json(
          { error: "No visualization found. Generate one first." },
          { status: 404 }
        );
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
    }
  } catch (error) {
    console.error("Error fetching visualization:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roadmapId: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const paramsValue = await params;
    const { roadmapId } = paramsValue;

    // Check if AI is configured for archify feature
    const aiService = getAIService();
    if (!aiService.isFeatureConfigured("archify_generation")) {
      return NextResponse.json(
        { error: "AI generation is not configured for Archify" },
        { status: 503 }
      );
    }

    // Get visualization config
    const config = await prisma.roadmapVisualizationConfig.findUnique({
      where: { roadmapId },
    });

    if (!config?.archifyEnabled) {
      return NextResponse.json(
        { error: "Visualization not enabled for this roadmap" },
        { status: 403 }
      );
    }

    if (!config?.aiGenerationEnabled) {
      return NextResponse.json(
        { error: "AI generation not enabled for this roadmap" },
        { status: 403 }
      );
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({})) as { forceRegenerate?: boolean; diagramType?: string };
    const forceRegenerate = body.forceRegenerate === true;
    const diagramType = (body.diagramType || "architecture") as "architecture" | "sequence" | "lifecycle" | "dataflow";

    // Generate diagram
    const result = await generationService.generateDiagram({
      roadmapId,
      diagramType,
      forceRegenerate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating visualization:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        code: error instanceof AIProviderError ? error.code : undefined,
      },
      { status: 500 }
    );
  }
}