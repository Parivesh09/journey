import type { ArchifyDiagram } from "@/lib/types/archify";
import type { StoredArchifyDiagram, DiagramType } from "@/lib/types/archify";
import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
import { prisma } from "@/lib/prisma";
import { normalizeComponentSizes } from "@/lib/visualization/component-sizing";

const ARCHIFY_RENDERER_PATH = join(process.env.HOME || "", ".agents", "skills", "archify", "renderers", "architecture", "render-architecture.mjs");
const ARCHIFY_TEMPLATE_PATH = join(process.env.HOME || "", ".agents", "skills", "archify", "assets", "template.html");

async function runArchifyRenderer(diagramJson: ArchifyDiagram, diagramType: DiagramType): Promise<string> {
  const tmpDir = await mkdtemp(join(tmpdir(), "archify-"));
  const inputPath = join(tmpDir, "input.json");
  const outputPath = join(tmpDir, "output.html");

  // Preprocess diagram: ensure components have adequate size for labels
  // Also set meta.output to a valid .html path since it's required by the schema
  const processedJson = JSON.parse(JSON.stringify(diagramJson)); // deep copy
  if (processedJson.meta && typeof processedJson.meta === 'object') {
    processedJson.meta.output = `${diagramType}.html`;
  }

  // The renderer is the strictest validator in the pipeline; widen components
  // to fit their own text so it stops rejecting model output.
  normalizeComponentSizes(processedJson as unknown as Record<string, unknown>);

  await writeFile(inputPath, JSON.stringify(processedJson, null, 2));

  return new Promise((resolve, reject) => {
    const proc = spawn("node", [ARCHIFY_RENDERER_PATH, inputPath, outputPath], {
      stdio: ["ignore", "pipe", "pipe"],
      cwd: join(process.env.HOME || "", ".agents", "skills", "archify"),
    });

    let stderr = "";
    proc.stderr?.on("data", (data) => { stderr += data.toString(); });

    proc.on("close", async (code) => {
      if (code !== 0) {
        reject(new Error(`Archify renderer exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        const html = await readFile(outputPath, "utf-8");
        resolve(html);
      } catch (err) {
        reject(new Error(`Failed to read renderer output: ${err}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to spawn Archify renderer: ${err.message}`));
    });
  });
}

export class RenderingService {
  async renderDiagram(diagram: StoredArchifyDiagram): Promise<string> {
    return runArchifyRenderer(diagram.sourceJson, diagram.diagramType);
  }

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

export const renderingService = new RenderingService();