import fs from "node:fs";
import path from "node:path";

export type RoadmapTemplateTask = {
  id: string;
  title: string;
  type?: string;
  difficulty?: string;
};

export type RoadmapTemplateTopic = {
  id: string;
  title: string;
  category?: string;
  estimated_days?: number;
  tasks?: RoadmapTemplateTask[];
};

export type RoadmapTemplatePhase = {
  id: string;
  title: string;
  category?: string;
  topics?: RoadmapTemplateTopic[];
};

export type RoadmapTemplateMilestone = {
  id: string;
  title: string;
  description?: string;
  phases: string[];
  prerequisites: string[];
};

export type RoadmapTemplate = {
  id: string;
  title: string;
  description?: string;
  milestones: RoadmapTemplateMilestone[];
  phases: RoadmapTemplatePhase[];
};

export const DEFAULT_ROADMAP_ID = "fullstack-v1";

/** Public template IDs (what the API expects). */
export const ROADMAP_IDS = ["fullstack-v1", "sde-master-roadmap"] as const;

export const ROADMAP_TEMPLATES: Record<string, string> = {
  fullstack_v1: path.resolve(process.cwd(), "roadmaps/fullstack-v1.json"),
  sde_master_roadmap: path.resolve(process.cwd(), "sde-master-roadmap.json"),
};

/** Template ids usable by the public API / workflow. */
export function roadmapSwitchId(roadmapId: string) {
  switch (roadmapId) {
    case "fullstack-v1":
      return "fullstack_v1";
    case "sde-master-roadmap":
      return "sde_master_roadmap";
    default:
      return null;
  }
}

/**
 * Load a roadmap template config by template id. Defaults to the Full Stack
 * template on signup. The legacy sde-master file keeps its `roadmap` metadata
 * wrapper; both shapes normalize to `RoadmapTemplate`.
 */
export function readRoadmap(
  roadmapId: string = DEFAULT_ROADMAP_ID,
): RoadmapTemplate {
  const key = roadmapSwitchId(roadmapId) ?? roadmapSwitchId(DEFAULT_ROADMAP_ID)!;
  const file = ROADMAP_TEMPLATES[key];
  if (!file || !fs.existsSync(file)) {
    throw new Error(`Unknown roadmap template: ${roadmapId}`);
  }
  const raw = JSON.parse(fs.readFileSync(file, "utf-8")) as {
    id?: string;
    title?: string;
    description?: string;
    roadmap?: { id?: string; title?: string; description?: string };
    milestones?: RoadmapTemplateMilestone[];
    phases?: RoadmapTemplatePhase[];
  };
  return {
    id: raw.roadmap?.id ?? raw.id ?? roadmapId,
    title: raw.roadmap?.title ?? raw.title ?? roadmapId,
    description: raw.roadmap?.description ?? raw.description,
    milestones: raw.milestones ?? [],
    phases: raw.phases ?? [],
  };
}

export function validateRoadmapTemplate(
  template: RoadmapTemplate,
): string[] {
  const errors: string[] = [];
  const milestoneIds = new Set(template.milestones.map((milestone) => milestone.id));
  const phaseIds = new Set(template.phases.map((phase) => phase.id));

  for (const milestone of template.milestones) {
    for (const prereq of milestone.prerequisites) {
      if (!milestoneIds.has(prereq)) {
        errors.push(
          `milestone ${milestone.id} references unknown prerequisite ${prereq}`,
        );
      }
    }
    for (const phaseId of milestone.phases) {
      if (!phaseIds.has(phaseId)) {
        errors.push(
          `milestone ${milestone.id} references unknown phase ${phaseId}`,
        );
      }
    }
  }

  // A milestone must never flow back into itself through prerequisites.
  const seen = new Set<string>();
  for (const milestone of template.milestones) {
    const visiting = new Set<string>([milestone.id]);
    const stack = [...milestone.prerequisites];
    while (stack.length) {
      const next = stack.pop()!;
      if (visiting.has(next)) {
        errors.push(`milestone prerequisite cycle involving ${next}`);
        break;
      }
      if (seen.has(next)) continue;
      seen.add(next);
      visiting.add(next);
      const prereq = template.milestones.find((item) => item.id === next);
      stack.push(...(prereq?.prerequisites ?? []));
    }
  }

  return errors;
}

/** The milestone that owns a phase id, if any. */
export function milestoneForPhase(
  template: RoadmapTemplate,
  phaseId: string,
): RoadmapTemplateMilestone | undefined {
  return template.milestones.find((milestone) =>
    milestone.phases.includes(phaseId),
  );
}