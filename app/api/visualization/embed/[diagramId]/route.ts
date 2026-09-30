import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderingService } from "@/lib/visualization/rendering-service";
import type { StoredArchifyDiagram, DiagramType, ArchifyDiagram } from "@/lib/types/archify";

function toStoredDiagram(diagram: any): StoredArchifyDiagram | null {
  if (!diagram) return null;
  return {
    ...diagram,
    diagramType: diagram.diagramType as DiagramType,
    sourceJson: diagram.sourceJson as unknown as ArchifyDiagram,
    errorMetadata: diagram.errorMetadata ? JSON.parse(diagram.errorMetadata as string) : undefined,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ diagramId: string }> }
) {
  try {
    const user = await requireUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const paramsValue = await params;
    const { diagramId } = paramsValue;

    // Get theme from query params
    const { searchParams } = new URL(request.url);
    const theme = searchParams.get("theme") || "dark";

    const diagram = await prisma.archifyDiagram.findFirst({
      where: { id: diagramId },
    });

    if (!diagram) {
      return new NextResponse("Diagram not found", { status: 404 });
    }

    const storedDiagram = toStoredDiagram(diagram);

    // Ensure we have rendered HTML
    let html = diagram.renderedHtml;
    if (!html) {
      const storedDiagram = toStoredDiagram(diagram);
      if (!storedDiagram) {
        return new NextResponse("Diagram not found", { status: 404 });
      }
      html = await renderingService.renderDiagram(storedDiagram);
      // Update the database with rendered HTML for next time
      await prisma.archifyDiagram.update({
        where: { id: diagramId },
        data: { renderedHtml: html },
      });
    }

    // Inject theme into HTML by setting data-theme attribute
    if (theme === "light" || theme === "dark") {
      html = html.replace(
        /<html([^>]*)>/,
        `<html$1 data-theme="${theme}">`
      );
    }

    // Return HTML with proper headers for iframe embedding
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Allow embedding from same origin
        "X-Frame-Options": "SAMEORIGIN",
        // Cache for 5 minutes since visualization shouldn't change frequently
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error serving visualization embed:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}