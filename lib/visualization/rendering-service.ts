import type { ArchifyDiagram } from "@/lib/types/archify";
import type { StoredArchifyDiagram, DiagramType } from "@/lib/types/archify";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";

// Path to the Archify viewer template (vendored copy)
const VIEWER_TEMPLATE_PATH = join(process.cwd(), "vendor", "archify", "viewer", "template.source.html");

/**
 * Rendering service that takes Archify JSON and produces standalone HTML
 */
export class RenderingService {
  private templateCache: string | null = null;

  /**
   * Load the viewer template (cached)
   */
  private async getTemplate(): Promise<string> {
    if (this.templateCache) {
      return this.templateCache;
    }

    try {
      this.templateCache = await readFile(VIEWER_TEMPLATE_PATH, "utf-8");
      return this.templateCache;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Failed to load Archify viewer template: ${msg}`);
    }
  }

  /**
   * Render an Archify diagram to HTML string
   */
  async renderDiagram(diagram: StoredArchifyDiagram): Promise<string> {
    const template = await this.getTemplate();
    const jsonData = JSON.stringify(diagram.sourceJson, null, 2);

    // Replace the placeholder in the template with the actual JSON data
    // The Archify template expects a script tag with id="archify-data" containing the JSON
    const html = template.replace(
      '<script id="archify-data" type="application/json">{};</script>',
      `<script id="archify-data" type="application/json">${jsonData}</script>`
    );

    // Also update the title in the HTML template
    const titledHtml = html.replace(
      /<title>[^<]*<\/title>/,
      `<title>${diagram.sourceJson.meta?.title ?? "Archify Diagram"}</title>`
    );

    return titledHtml;
  }

  /**
   * Update the stored diagram with rendered HTML
   */
  async updateRenderedHtml(diagramId: string): Promise<StoredArchifyDiagram> {
    const diagram = await this.getDiagram(diagramId);
    if (!diagram) {
      throw new Error(`Diagram not found: ${diagramId}`);
    }

    const html = await this.renderDiagram(diagram);

    const updated = await prisma.archifyDiagram.update({
      where: { id: diagramId },
      data: { renderedHtml: html },
    });

    return {
      ...updated,
      diagramType: updated.diagramType as DiagramType,
      sourceJson: updated.sourceJson as unknown as ArchifyDiagram,
    } as StoredArchifyDiagram;
  }

  private async getDiagram(diagramId: string): Promise<StoredArchifyDiagram | null> {
    const diagram = await prisma.archifyDiagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram) return null;

    return {
      ...diagram,
      diagramType: diagram.diagramType as DiagramType,
      sourceJson: diagram.sourceJson as unknown as ArchifyDiagram,
    } as StoredArchifyDiagram;
  }
}

// Singleton instance
export const renderingService = new RenderingService();