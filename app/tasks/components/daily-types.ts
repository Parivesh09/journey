import type { RoadmapSummary } from "@/lib/types";

export type Routine = {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  plannedHours: number | null;
  plannedMinutes: number | null;
  plannedSeconds: number | null;
  estimatedMinutes: number | null;
  dailySlot: string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  doneToday: boolean;
  isPersonalDaily: boolean;
};

export type Connected = {
  pinId: string;
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    phaseTitle: string | null;
    topicTitle: string | null;
    milestoneTitle: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    plannedHours: number | null;
    plannedMinutes: number | null;
    plannedSeconds: number | null;
  };
};

export type ActiveRoadmap = RoadmapSummary;

export type LinkedRoadmap = {
  id: string;
  roadmapId: string;
  roadmap: {
    id: string;
    title: string;
    description: string | null;
  };
};
