import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAIService } from "@/lib/ai/provider";
import type { AIError } from "@/lib/ai/types";
import { AIProviderError } from "@/lib/ai/types";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

import {
  buildVisualizationContext,
  buildCompactContext,
  computeRoadmapVersion,
  computeSourceHash,
  type RoadmapVisualizationContext,
  type ContextBuilderOptions,
  type SourceHashInput,
} from "@/lib/visualization/context-builder";
import {
  buildArchitecturePrompt,
  buildWorkflowPrompt,
  buildSequencePrompt,
  buildDataflowPrompt,
  buildLifecyclePrompt,
  type DiagramType,
  PROMPT_VERSION,
  GENERATION_VERSION,
} from "@/lib/visualization/prompts";
import type {
  ArchifyDiagram,
  RoadmapVisualizationConfig,
  StoredArchifyDiagram,
  GenerationResponse,
  DiagramStatus,
} from "@/lib/types/archify";
import type { RoadmapTemplate } from "@/lib/business/roadmap-templates";
import { validateArchifyJSON } from "@/lib/visualization/validation";
import { renderingService } from "@/lib/visualization/rendering-service";

/**
 * Convert Prisma RoadmapVisualizationConfig to our custom type
 */
function toVisualizationConfig(prismaConfig: any): RoadmapVisualizationConfig | null {
  if (!prismaConfig) return null;
  return {
    ...prismaConfig,
    defaultDiagramType: prismaConfig.defaultDiagramType as DiagramType,
    allowedDiagramTypes: prismaConfig.allowedDiagramTypes as DiagramType[],
  };
}

/**
 * Convert Prisma ArchifyDiagram to our custom type
 */
function toStoredDiagram(prismaDiagram: any): StoredArchifyDiagram | null {
  if (!prismaDiagram) return null;
  return {
    ...prismaDiagram,
    diagramType: prismaDiagram.diagramType as DiagramType,
    sourceJson: prismaDiagram.sourceJson as unknown as ArchifyDiagram,
    errorMetadata: prismaDiagram.errorMetadata ? JSON.parse(prismaDiagram.errorMetadata as string) : undefined,
  };
}

const MAX_GENERATION_ATTEMPTS = 3;

const ARCHIFY_FEATURE_ID = "archify_generation";

export class GenerationService {
  private aiService = getAIService();

  async generateDiagram(request: {
    roadmapId: string;
    diagramType: DiagramType;
    forceRegenerate?: boolean;
    userId?: string;
  }): Promise<GenerationResponse> {
    const { roadmapId, diagramType, forceRegenerate = false } = request;

    // Get roadmap and config
    const [roadmap, config] = await Promise.all([
      this.getRoadmap(roadmapId),
      this.getVisualizationConfig(roadmapId),
    ]);

    if (!roadmap) {
      throw new Error(`Roadmap not found: ${roadmapId}`);
    }

    if (!config?.archifyEnabled) {
      throw new Error("Archify visualization is not enabled for this roadmap");
    }

    if (!config?.aiGenerationEnabled) {
      throw new Error("AI generation is not enabled for this roadmap");
    }

    // Check if AI is configured for archify feature — prefer DB default provider
    // when available (user-configured), otherwise fall back to env-based config.
    let dbProvider = null;
    if (request.userId) {
      dbProvider = await aiProviderService.getDefaultProvider();
      if (!dbProvider?.enabled) {
        dbProvider = null;
      }
    }

    const hasEnvProvider = this.aiService.isFeatureConfigured(ARCHIFY_FEATURE_ID);
    const hasAnyProvider = !!dbProvider || hasEnvProvider;

    if (!hasAnyProvider) {
      throw new AIProviderError(
        "AI provider not configured for Archify generation. Please configure an AI provider in Settings.",
        { code: "API_KEY_MISSING" }
      );
    }

    // Check if we can use cached version
    if (!forceRegenerate) {
      const cached = await this.getCachedDiagram(roadmapId, diagramType);
      if (cached && cached.status === "ready") {
        return {
          diagramId: cached.id,
          status: cached.status,
          diagramType: cached.diagramType as DiagramType,
          generatedAt: cached.generatedAt.toISOString(),
          isStale: await this.isStale(cached, roadmap),
          viewerUrl: `/roadmaps/${roadmapId}/visualize?diagramType=${cached.diagramType}&diagramId=${cached.id}`,
        };
      }
    }

    // Build context and source hash
    const context = buildVisualizationContext(roadmapId, {
      maxSections: 12,
      maxTopicsPerSection: 6,
      maxTasksPerTopic: 4,
      includeDescriptions: true,
    });

    const roadmapTemplate = (await this.getRoadmapTemplate(roadmap.id)) as RoadmapTemplate;
    const roadmapVersion = computeRoadmapVersion(roadmapTemplate);
    const sourceHashInput = {
      roadmapId,
      diagramType,
      context,
      promptVersion: PROMPT_VERSION,
      generationVersion: GENERATION_VERSION,
    };
    const sourceHash = computeSourceHash(sourceHashInput);

    // Try generation with repair loop
    let lastError: Error | undefined;
    let diagram: StoredArchifyDiagram | null = null;

    for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
      try {
        diagram = await this.generateWithAttempt(
          attempt,
          diagramType,
          context,
          roadmap,
          config,
          roadmapVersion,
          sourceHash,
          lastError,
          dbProvider,
          request.userId
        );

        // If we get here, generation succeeded
        break;
      } catch (error) {
        lastError = error as Error;
        if (attempt === MAX_GENERATION_ATTEMPTS) {
          throw error;
        }
        // Continue to next attempt
      }
    }

    if (!diagram) {
      throw lastError ?? new Error("Generation failed after all attempts");
    }

    return {
      diagramId: diagram.id,
      status: diagram.status,
      diagramType: diagram.diagramType,
      generatedAt: diagram.generatedAt.toISOString(),
      isStale: await this.isStale(diagram, roadmap),
      viewerUrl: `/roadmaps/${roadmapId}/visualize?diagramType=${diagram.diagramType}&diagramId=${diagram.id}`,
    };
  }

  private async generateWithAttempt(
    attempt: number,
    diagramType: DiagramType,
    context: RoadmapVisualizationContext,
    roadmap: any,
    config: RoadmapVisualizationConfig,
    roadmapVersion: string,
    sourceHash: string,
    previousError?: Error,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dbProvider?: { generateStructuredOutput<T>(userId: string, request: any): Promise<any> } | null,
    userId?: string
  ): Promise<StoredArchifyDiagram> {
    // Build prompt
    let systemPrompt: string;
    let userPrompt: string;

    switch (diagramType) {
      case "architecture":
        ({ systemPrompt, userPrompt } = buildArchitecturePrompt(context));
        break;
      case "workflow":
        ({ systemPrompt, userPrompt } = buildWorkflowPrompt(context));
        break;
      case "sequence":
        ({ systemPrompt, userPrompt } = buildSequencePrompt(context));
        break;
      case "dataflow":
        ({ systemPrompt, userPrompt } = buildDataflowPrompt(context));
        break;
      case "lifecycle":
        ({ systemPrompt, userPrompt } = buildLifecyclePrompt(context));
        break;
      default:
        throw new Error(`Unsupported diagram type: ${diagramType}`);
    }

    // Add repair context if we have a previous error
    if (previousError && attempt > 1) {
      userPrompt += `\n\nPrevious attempt failed with error: ${previousError.message}\n`
        + `Fix exactly what that error reports. If it names a component, keep that `
        + `component's id and shorten its label/sublabel or make room for it rather `
        + `than deleting it. Re-check the whole diagram still renders.`;
    }

    // Generate structured output using the appropriate provider
    let result: Awaited<ReturnType<typeof this.aiService.generateStructuredOutput<ArchifyDiagram>>>;
    if (dbProvider && userId) {
      result = await dbProvider.generateStructuredOutput(userId, {
        systemPrompt,
        userPrompt,
        model: process.env.ARCHIFY_MODEL,
        temperature: 0.2,
        maxOutputTokens: 8192,
        timeoutMs: 120000,
      });
    } else {
      result = await this.aiService.generateStructuredOutput<ArchifyDiagram>(ARCHIFY_FEATURE_ID, {
        systemPrompt,
        userPrompt,
        schema: {}, // We validate after generation
        temperature: 0.2,
        maxOutputTokens: 8192,
        timeoutMs: 120000,
      });
    }

    // Validate the generated JSON
    const validationError = validateArchifyJSON(result.data, diagramType);
    if (validationError) {
      const validationErr = new Error(`Validation failed: ${validationError}`) as AIError;
      validationErr.recoverable = true;
      validationErr.validationErrors = [validationError];
      throw validationErr;
    }

    // Render before storing. The renderer is the strictest validator we have:
    // schema validation passes diagrams it will still reject (component text
    // wider than its box, connections too short). Rendering here feeds those
    // diagnostics back through the repair loop, and it means a diagram is only
    // ever marked "ready" once it has actually produced HTML — otherwise the
    // row would be cached as ready and 500 forever on every view.
    let renderedHtml: string;
    try {
      renderedHtml = await renderingService.renderDiagram({
        sourceJson: result.data,
        diagramType,
      } as StoredArchifyDiagram);
    } catch (error) {
      const renderErr = new Error(
        `Rendering failed: ${(error as Error).message}`
      ) as AIError;
      renderErr.recoverable = true;
      throw renderErr;
    }

    // Store the diagram
    const stored = await this.storeDiagram({
      roadmapId: roadmap.id,
      diagramType,
      sourceJson: result.data,
      sourceHash,
      roadmapVersion,
      generationVersion: GENERATION_VERSION,
      promptVersion: PROMPT_VERSION,
      status: "ready",
      renderedHtml,
    });

    return stored;
  }

  private async getRoadmap(roadmapId: string) {
    // Roadmaps are defined as JSON templates, not in the database
    // Return a minimal object with the ID
    return { id: roadmapId };
  }

  private async getRoadmapTemplate(roadmapId: string) {
    return (await import("@/lib/business/roadmap-templates")).readRoadmap(roadmapId);
  }

  private async getVisualizationConfig(roadmapId: string) {
    const config = await prisma.roadmapVisualizationConfig.findUnique({
      where: { roadmapId },
    });
    return toVisualizationConfig(config);
  }

  private async getCachedDiagram(roadmapId: string, diagramType: string) {
    const diagram = await prisma.archifyDiagram.findFirst({
      where: { roadmapId, diagramType, status: "ready" },
      orderBy: { updatedAt: "desc" },
    });
    return toStoredDiagram(diagram);
  }

  private async isStale(diagram: StoredArchifyDiagram, roadmap: any): Promise<boolean> {
    // Simple implementation: check if roadmap has been updated since diagram generation
    const roadmapUpdated = roadmap.updatedAt ?? new Date();
    return roadmapUpdated > diagram.updatedAt;
  }

  private async storeDiagram(data: {
    roadmapId: string;
    diagramType: DiagramType;
    sourceJson: ArchifyDiagram;
    sourceHash: string;
    roadmapVersion: string;
    generationVersion: string;
    promptVersion: string;
    status: DiagramStatus;
    errorMetadata?: unknown;
    renderedHtml?: string;
  }): Promise<StoredArchifyDiagram> {
    // Upsert on the unique key rather than deleteMany + create. The two-step
    // version races: concurrent requests both delete, both create, and the
    // loser dies on ArchifyDiagram_roadmapId_diagramType_roadmapVersion_key.
    // Upserting converges them on one row and makes the explicit delete moot.
    const uniqueKey = {
      roadmapId_diagramType_roadmapVersion: {
        roadmapId: data.roadmapId,
        diagramType: data.diagramType,
        roadmapVersion: data.roadmapVersion,
      },
    };

    const fields = {
      sourceJson: data.sourceJson as any,
      sourceHash: data.sourceHash,
      generationVersion: data.generationVersion,
      promptVersion: data.promptVersion,
      status: data.status,
      errorMetadata: data.errorMetadata ? JSON.stringify(data.errorMetadata) : Prisma.JsonNull,
      renderedHtml: data.renderedHtml ?? "",
    };

    const saved = await prisma.archifyDiagram.upsert({
      where: uniqueKey,
      create: { ...uniqueKey.roadmapId_diagramType_roadmapVersion, ...fields },
      update: fields,
    });

    return {
      ...saved,
      diagramType: saved.diagramType as DiagramType,
      sourceJson: saved.sourceJson as unknown as ArchifyDiagram,
      errorMetadata: saved.errorMetadata ? JSON.parse(saved.errorMetadata as string) : undefined,
    } as StoredArchifyDiagram;
  }

  async getDiagram(diagramId: string): Promise<StoredArchifyDiagram | null> {
    const diagram = await prisma.archifyDiagram.findUnique({
      where: { id: diagramId },
    });

    if (!diagram) return null;

    return {
      ...diagram,
      diagramType: diagram.diagramType as DiagramType,
      sourceJson: diagram.sourceJson as unknown as ArchifyDiagram,
      errorMetadata: diagram.errorMetadata ? JSON.parse(diagram.errorMetadata as string) : undefined,
    } as StoredArchifyDiagram;
  }

  async regenerateDiagram(diagramId: string): Promise<GenerationResponse> {
    const diagram = await this.getDiagram(diagramId);
    if (!diagram) {
      throw new Error(`Diagram not found: ${diagramId}`);
    }

    return this.generateDiagram({
      roadmapId: diagram.roadmapId,
      diagramType: diagram.diagramType as DiagramType,
      forceRegenerate: true,
    });
  }
}

// Singleton instance
export const generationService = new GenerationService();