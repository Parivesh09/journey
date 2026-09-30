import type { ArchifyDiagram } from "@/lib/types/archify";
import type { StoredArchifyDiagram, DiagramType } from "@/lib/types/archify";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { prisma } from "@/lib/prisma";

// Path to the Archify viewer template (from installed skill)
const VIEWER_TEMPLATE_PATH = join(process.cwd(), ".agents", "skills", "archify", "assets", "template.html");

// Minimal i18n replacements for Archify viewer template
const I18N_REPLACEMENTS: Record<string, string> = {
  // Theme
  '{{i18n:viewer.theme.dark}}': 'Dark',
  '{{i18n:viewer.theme.light}}': 'Light',
  '{{i18n:viewer.theme.toggle.title}}': 'Toggle theme',
  '{{i18n:viewer.theme.toggle}}': 'Toggle theme',
  
  // Preset
  '{{i18n:viewer.preset.identity}}': 'Preset',
  '{{i18n:viewer.preset.style}}': 'Style',
  '{{i18n:viewer.preset.choose.title}}': 'Choose visual preset',
  '{{i18n:viewer.preset.choose}}': 'Choose preset',
  '{{i18n:viewer.preset.cycles}}': 'cycles',
  '{{i18n:viewer.preset.menu}}': 'Visual preset',
  '{{i18n:viewer.preset.classic}}': 'Classic',
  '{{i18n:viewer.preset.classic.hint}}': 'Standard preset',
  '{{i18n:viewer.preset.signal-flow}}': 'Signal Flow',
  '{{i18n:viewer.preset.signal-flow.hint}}': 'Signal flow preset',
  '{{i18n:viewer.preset.blueprint}}': 'Blueprint',
  '{{i18n:viewer.preset.blueprint.hint}}': 'Blueprint preset',
  '{{i18n:viewer.preset.editorial}}': 'Editorial',
  '{{i18n:viewer.preset.editorial.hint}}': 'Editorial preset',
  
  // Export
  '{{i18n:viewer.export.button}}': 'Export',
  '{{i18n:viewer.export.diagram}}': 'Diagram',
  '{{i18n:viewer.export.subtitle}}': 'Export diagram as image or vector',
  '{{i18n:viewer.export.share}}': 'Share',
  '{{i18n:viewer.export.copyDiagram}}': 'Copy diagram',
  '{{i18n:viewer.export.clipboardPng}}': 'Copy PNG to clipboard',
  '{{i18n:viewer.export.image}}': 'Image',
  '{{i18n:viewer.export.lossless}}': 'Lossless',
  '{{i18n:viewer.export.compact}}': 'Compact',
  '{{i18n:viewer.export.modern}}': 'Modern',
  '{{i18n:viewer.export.vectorMotion.heading}}': 'Vector & Motion',
  '{{i18n:viewer.export.svg.auto}}': 'SVG (Auto)',
  '{{i18n:viewer.export.svg.auto.hint}}': 'Auto theme SVG',
  '{{i18n:viewer.export.svg.light}}': 'SVG (Light)',
  '{{i18n:viewer.export.svg.light.hint}}': 'Light theme SVG',
  '{{i18n:viewer.export.svg.dark}}': 'SVG (Dark)',
  '{{i18n:viewer.export.svg.dark.hint}}': 'Dark theme SVG',
  '{{i18n:viewer.export.motion6s}}': 'WebM (6s)',
  
  // Navigation
  '{{i18n:viewer.nav.route.short}}': 'Route',
  '{{i18n:viewer.nav.radar.short}}': 'Radar',
  '{{i18n:viewer.nav.lens.short}}': 'Lens',
  
  // Present
  '{{i18n:viewer.present.present}}': 'Present',
  
  // Toolbar
  '{{i18n:viewer.toolbar.actions}}': 'Viewer actions',
};

// Apply i18n replacements to a template string
function applyI18nReplacements(template: string): string {
  let result = template;
  for (const [key, value] of Object.entries(I18N_REPLACEMENTS)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  // Fallback: replace any remaining {{i18n:...}} with their key name (without i18n: prefix)
  result = result.replace(/\{\{i18n:([^}]+)\}\}/g, (_, key) => key);
  return result;
}

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
      // Apply i18n replacements once when loading the template
      this.templateCache = applyI18nReplacements(this.templateCache);
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