import type { RoadmapTemplate } from "@/lib/business/roadmap-templates";

export interface RoadmapVisualizationContext {
  roadmap: {
    id: string;
    title: string;
    description: string | null;
  };
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    topics: Array<{
      id: string;
      title: string;
      description?: string;
      tasks: Array<{
        id: string;
        title: string;
        description?: string;
        dependencies?: string[];
      }>;
    }>;
  }>;
  metadata: {
    totalSections: number;
    totalTopics: number;
    totalTasks: number;
    generatedAt: string;
  };
}

export interface ContextBuilderOptions {
  maxSections?: number;
  maxTopicsPerSection?: number;
  maxTasksPerTopic?: number;
  includeDescriptions?: boolean;
  summarize?: boolean;
}

export interface SourceHashInput {
  roadmapId: string;
  diagramType: string;
  context: RoadmapVisualizationContext;
  config: {
    promptVersion: string;
    generationVersion: string;
  };
}