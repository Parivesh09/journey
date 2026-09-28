export interface RoadmapPhase {
  id: string;
  title: string;
  category: string | null;
  topics?: RoadmapTopic[];
}

export interface RoadmapTopic {
  id: string;
  title: string;
  tasks?: RoadmapTask[];
}

export interface RoadmapTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  taskType: string | null;
  difficulty: string | null;
  phaseTitle: string | null;
  topicTitle: string | null;
  sequenceOrder: number;
}

export interface RoadmapSummary {
  id: string;
  title: string;
  description: string | null;
  activated: boolean;
  dailyTaskCount?: number;
  phases?: RoadmapPhase[];
}

export interface RoadmapTemplateTask {
  id: string;
  title: string;
  type?: string;
  difficulty?: string;
  estimatedMinutes?: number;
  plannedHours?: number;
  plannedMinutes?: number;
  plannedSeconds?: number;
}

export interface RoadmapTemplateTopic {
  id: string;
  title: string;
  category?: string;
  estimated_days?: number;
  tasks?: RoadmapTemplateTask[];
}

export interface RoadmapTemplatePhase {
  id: string;
  title: string;
  category?: string;
  topics?: RoadmapTemplateTopic[];
}

export interface RoadmapTemplateMilestone {
  id: string;
  title: string;
  description?: string;
  phases: string[];
  prerequisites: string[];
}

export interface RoadmapTemplate {
  id: string;
  title: string;
  description?: string;
  milestones: RoadmapTemplateMilestone[];
  phases: RoadmapTemplatePhase[];
}

export type RoadmapId = (typeof ROADMAP_IDS)[number];

export const ROADMAP_IDS = ["fullstack-v1", "sde-master-roadmap"] as const;

export const DEFAULT_ROADMAP_ID: RoadmapId = "fullstack-v1";

export interface UserRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  activatedAt: Date;
}

export interface UserDailyRoadmap {
  id: string;
  userId: string;
  roadmapId: string;
  createdAt: Date;
}

export interface ActiveRoadmap {
  id: string;
  title: string;
  description: string | null;
  dailyTaskCount: number;
}

export interface LinkedRoadmap {
  id: string;
  roadmapId: string;
  roadmap: RoadmapSummary;
}

export interface DailyRoadmapsResponse {
  linkedRoadmaps: LinkedRoadmap[];
}

export interface LinkRoadmapResponse {
  message: string;
  linked: boolean;
  userDailyRoadmap: {
    id: string;
    userId: string;
    roadmapId: string;
    createdAt: Date;
  };
}

export interface UnlinkRoadmapResponse {
  message: string;
  linked: boolean;
}

export interface RoadmapsResponse {
  roadmaps: RoadmapSummary[];
}