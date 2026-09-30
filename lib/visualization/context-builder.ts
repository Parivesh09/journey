import { readRoadmap, type RoadmapTemplate } from "@/lib/business/roadmap-templates";
import type { RoadmapVisualizationContext, ContextBuilderOptions } from "@/lib/types/visualization";

const DEFAULT_OPTIONS: ContextBuilderOptions = {
  maxSections: 12,
  maxTopicsPerSection: 6,
  maxTasksPerTopic: 4,
  includeDescriptions: true,
  summarize: true,
};

export function buildVisualizationContext(
  roadmapId: string,
  options: ContextBuilderOptions = {}
): RoadmapVisualizationContext {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const template = readRoadmap(roadmapId);

  const sections = template.phases.slice(0, opts.maxSections).map((phase) => {
    const topics = (phase.topics ?? [])
      .slice(0, opts.maxTopicsPerSection)
      .map((topic) => {
        const tasks = (topic.tasks ?? [])
          .slice(0, opts.maxTasksPerTopic)
          .map((task) => ({
            id: task.id,
            title: task.title,
            description: opts.includeDescriptions ? (task as any).description ?? (task as any).type : undefined,
          }));

        return {
          id: topic.id,
          title: topic.title,
          description: opts.includeDescriptions ? (topic as any).category : undefined,
          tasks,
        };
      });

    return {
      id: phase.id,
      title: phase.title,
      description: opts.includeDescriptions ? (phase as any).category : undefined,
      topics,
    };
  });

  const totalTasks = sections.reduce(
    (sum, s) => sum + s.topics.reduce((tSum, t) => tSum + t.tasks.length, 0),
    0
  );

  return {
    roadmap: {
      id: template.id,
      title: template.title,
      description: template.description ?? null,
    },
    sections,
    metadata: {
      totalSections: sections.length,
      totalTopics: sections.reduce((s, sec) => s + sec.topics.length, 0),
      totalTasks,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function buildCompactContext(
  roadmapId: string
): RoadmapVisualizationContext {
  const template = readRoadmap(roadmapId);

  const sections = template.phases.map((phase) => ({
    id: phase.id,
    title: phase.title,
    description: undefined,
    topics: (phase.topics ?? []).map((topic) => ({
      id: topic.id,
      title: topic.title,
      description: undefined,
      tasks: (topic.tasks ?? []).map((task) => ({
        id: task.id,
        title: task.title,
      })),
    })),
  }));

  return {
    roadmap: {
      id: template.id,
      title: template.title,
      description: template.description ?? null,
    },
    sections,
    metadata: {
      totalSections: sections.length,
      totalTopics: sections.reduce((s, sec) => s + sec.topics.length, 0),
      totalTasks: sections.reduce(
        (s, sec) => s + sec.topics.reduce((t, top) => t + top.tasks.length, 0),
        0
      ),
      generatedAt: new Date().toISOString(),
    },
  };
}

export function computeRoadmapVersion(template: RoadmapTemplate): string {
  const parts = [
    template.id,
    template.milestones.length,
    template.phases.length,
    template.phases.reduce(
      (s, p) => s + (p.topics ?? []).length,
      0
    ),
  ];
  return parts.join(":");
}

export function computeSourceHash(input: {
  roadmapId: string;
  diagramType: string;
  context: RoadmapVisualizationContext;
  promptVersion: string;
  generationVersion: string;
}): string {
  const { roadmapId, diagramType, context, promptVersion, generationVersion } = input;
  const stable = JSON.stringify({
    roadmapId,
    diagramType,
    title: context.roadmap.title,
    sections: context.sections.map((s) => ({
      id: s.id,
      title: s.title,
      topics: s.topics.map((t) => ({
        id: t.id,
        title: t.title,
        tasks: t.tasks.map((task) => ({ id: task.id, title: task.title })),
      })),
    })),
    promptVersion,
    generationVersion,
  });
  return hashString(stable);
}

function hashString(input: string): string {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  const hex = (h >>> 0).toString(16).padStart(8, "0");
  return `v${hex}`;
}

// Re-export types
export type { RoadmapVisualizationContext, ContextBuilderOptions, SourceHashInput } from "@/lib/types/visualization";