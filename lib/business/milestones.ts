import type { Task, TaskStatus, UserMilestone } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  readRoadmap,
  type RoadmapTemplate,
  type RoadmapTemplateMilestone,
} from "@/lib/business/roadmap-templates";

export type MilestoneStatus = "LOCKED" | "IN_PROGRESS" | "DONE";

export type MilestoneState = {
  id: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  locked: boolean;
  manuallyCompleted: boolean;
  prereqMet: boolean;
  needsManualCompletion: boolean;
  prerequisites: Array<{ id: string; title: string; met: boolean }>;
  progress: { completed: number; total: number; percent: number };
};

type MilestoneTaskRow = Pick<
  Task,
  | "id"
  | "title"
  | "status"
  | "completedAt"
  | "dueDate"
  | "priority"
  | "taskType"
  | "difficulty"
  | "phaseId"
  | "phaseTitle"
  | "topicId"
  | "topicTitle"
  | "milestoneId"
  | "roadmapId"
  | "sequenceOrder"
>;

/** The template's phases attached to a milestone, preserving template order. */
export function milestonePhases(template: RoadmapTemplate, milestoneId: string) {
  const milestone = template.milestones.find((item) => item.id === milestoneId);
  return (milestone?.phases ?? [])
    .map((id) => template.phases.find((phase) => phase.id === id))
    .filter((phase): phase is NonNullable<typeof phase> => Boolean(phase));
}

/**
 * Load per-milestone progress + manual overrides for one user+roadmap in a
 * single pass over the tasks. Pure over the fetched rows, so it is trivially
 * testable.
 */
export function computeMilestoneStates(params: {
  template: RoadmapTemplate;
  tasks: MilestoneTaskRow[];
  manuals: UserMilestone[];
}): Map<string, MilestoneState> {
  const { template, tasks, manuals } = params;
  const byMilestoneId = new Map<string, MilestoneTaskRow[]>();
  for (const task of tasks) {
    const bucket = byMilestoneId.get(task.milestoneId ?? "");
    if (task.milestoneId) {
      if (bucket) bucket.push(task);
      else byMilestoneId.set(task.milestoneId, [task]);
    }
  }

  const states = new Map<string, MilestoneState>();
  const markDoneIfNatural = (milestone: RoadmapTemplateMilestone) => {
    if (states.has(milestone.id)) return states.get(milestone.id)!;
    const milestoneTasks = (byMilestoneId.get(milestone.id) ?? []).sort(
      (a, b) => a.sequenceOrder - b.sequenceOrder,
    );
    const completed = milestoneTasks.filter(
      (task) => task.status === "COMPLETED",
    ).length;
    const total = milestoneTasks.length;
    const manual = manuals.find(
      (item) => item.milestoneId === milestone.id,
    );
    const state: MilestoneState = {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: "IN_PROGRESS",
      locked: false,
      manuallyCompleted: Boolean(manual?.manuallyCompletedAt),
      prereqMet: false,
      needsManualCompletion: Boolean(manual),
      prerequisites: [],
      progress: {
        completed,
        total,
        percent:
          total === 0 ? 0 : Math.round((completed / total) * 100),
      },
    };
    states.set(milestone.id, state);
    return state;
  };

  for (const milestone of template.milestones) {
    const state = markDoneIfNatural(milestone);
    const prereqs = milestone.prerequisites.map((prereqId) => {
      const prereq = template.milestones.find((item) => item.id === prereqId);
      const prereqState = prereq ? markDoneIfNatural(prereq) : null;
      const met = Boolean(prereqState && prereqStateDone(prereqState));
      return { id: prereqId, title: prereq?.title ?? prereqId, met };
    });
    state.prerequisites = prereqs;
    state.prereqMet = prereqs.length > 0 ? prereqs.every((item) => item.met) : true;
    state.locked = !state.prereqMet;
    const done = state.manuallyCompleted || state.progress.completed === state.progress.total;
    state.needsManualCompletion = !done && state.prereqMet;
    state.status = state.locked
      ? "LOCKED"
      : done
        ? "DONE"
        : "IN_PROGRESS";
  }
  return states;
}

function prereqStateDone(state: MilestoneState) {
  return (
    state.manuallyCompleted || state.progress.completed === state.progress.total
  );
}

export async function isMilestoneLocked(
  userId: string,
  roadmapId: string,
  milestoneId: string,
) {
  const template = readRoadmap(roadmapId);
  const states = await loadStates(userId, template);
  return states.get(milestoneId)?.locked ?? false;
}

async function loadStates(
  userId: string,
  template: RoadmapTemplate,
): Promise<Map<string, MilestoneState>> {
  const [tasks, manuals] = await Promise.all([
    prisma.task.findMany({
      where: { userId, roadmapId: template.id },
      select: {
        id: true,
        title: true,
        status: true,
        completedAt: true,
        dueDate: true,
        priority: true,
        taskType: true,
        difficulty: true,
        phaseId: true,
        phaseTitle: true,
        topicId: true,
        topicTitle: true,
        milestoneId: true,
        roadmapId: true,
        sequenceOrder: true,
      },
    }),
    prisma.userMilestone.findMany({ where: { userId, roadmapId: template.id } }),
  ]);
  return computeMilestoneStates({ template, tasks, manuals });
}

/**
 * Milestones for one user+roadmap, with phases/topics/tasks nested for the
 * Roadmap tab and a roadmap-level "next up" pointer (first incomplete task in
 * the first unlocked milestone by sequence order).
 */
export async function getUserMilestones(userId: string, roadmapId: string) {
  const template = readRoadmap(roadmapId);
  const tasks = await prisma.task.findMany({
    where: { userId, roadmapId: template.id },
    orderBy: { sequenceOrder: "asc" },
  });
  const states = computeMilestoneStates({
    template,
    tasks,
    manuals: await prisma.userMilestone.findMany({
      where: { userId, roadmapId: template.id },
    }),
  });

  const milestones = template.milestones.map((milestone) => {
    const state = states.get(milestone.id)!;
    const milestoneTaskIds = new Set(
      tasks
        .filter((task) => task.milestoneId === milestone.id)
        .map((task) => task.id),
    );
    const phaseBlocks = milestonePhases(template, milestone.id).map((phase) => ({
      id: phase.id,
      title: phase.title,
      category: phase.category ?? null,
      topics: (phase.topics ?? []).map((topic) => ({
        id: topic.id,
        title: topic.title,
        tasks: tasks.filter(
          (task) =>
            milestoneTaskIds.has(task.id) && task.topicId === topic.id,
        ),
      })),
    }));
    const incomplete = tasks
      .filter(
        (task) => task.milestoneId === milestone.id && task.status !== "COMPLETED",
      )
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    const nextUpTaskId = state.locked ? null : (incomplete[0]?.id ?? null);
    return {
      ...state,
      phases: phaseBlocks,
      nextUpTaskId,
    };
  });

  const firstUnlocked = milestones.find((milestone) => !milestone.locked);
  const firstIncompleteUnlocked = firstUnlocked
    ? tasks
        .filter(
          (task) =>
            task.milestoneId === firstUnlocked.id && task.status !== "COMPLETED",
        )
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)[0]
    : null;

  return {
    roadmap: {
      id: template.id,
      title: template.title,
      description: template.description ?? null,
    },
    nextUpTaskId: firstIncompleteUnlocked?.id ?? null,
    milestones,
  };
}

export class ManualCompleteError extends Error {
  constructor(public reasons: string[]) {
    super(reasons.join(", "));
  }
}

/** A milestone can only be manually completed once its prerequisites are done. */
export async function completeMilestoneManually(
  userId: string,
  roadmapId: string,
  milestoneId: string,
) {
  const template = readRoadmap(roadmapId);
  const states = await loadStates(userId, template);
  const state = states.get(milestoneId);
  if (!state) throw new ManualCompleteError(["Milestone not found"]);
  if (state.locked) {
    throw new ManualCompleteError(
      state.prerequisites
        .filter((prereq) => !prereq.met)
        .map((prereq) => `Complete "${prereq.title}" first`),
    );
  }

  const milestone = template.milestones.find((item) => item.id === milestoneId);
  if (!milestone) throw new ManualCompleteError(["Milestone not found"]);
  await prisma.$transaction([
    prisma.userMilestone.upsert({
      where: {
        userId_roadmapId_milestoneId: { userId, roadmapId: template.id, milestoneId },
      },
      create: {
        userId,
        roadmapId: template.id,
        milestoneId,
        manuallyCompletedAt: new Date(),
      },
      update: { manuallyCompletedAt: new Date() },
    }),
    prisma.task.updateMany({
      where: {
        userId,
        roadmapId: template.id,
        milestoneId,
        status: { not: "COMPLETED" },
      },
      data: { status: "COMPLETED" as TaskStatus, completedAt: new Date() },
    }),
  ]);
  return { completed: true, milestoneId };
}