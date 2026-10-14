import { prisma } from "@/lib/prisma";
import type {
  Task,
  TaskStatus,
  UserMilestone,
} from "@prisma/client";
import {
  readRoadmap,
  type RoadmapTemplate,
  type RoadmapTemplateMilestone,
  type RoadmapTemplatePhase,
  type RoadmapTemplateTopic,
} from "@/lib/business/roadmap-templates";
import type {
  MilestoneExecution,
  TopicExecution,
  TaskExecution,
  RoadmapExecution,
  ExecutionTimer,
  NextRoadmapAction,
} from "@/lib/types/roadmap-execution";

/**
 * Calculate progress for a set of tasks
 */
function calculateTaskProgress(tasks: Task[]): {
  completed: number;
  total: number;
  percent: number;
} {
  const completed = tasks.filter(
    (task) => task.status === "COMPLETED"
  ).length;
  const total = tasks.length;
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  };
}

/**
 * Calculate time progress for a set of tasks
 */
function calculateTaskTimeProgress(tasks: Task[]): {
  estimatedSeconds: number;
  actualSeconds: number;
  remainingSeconds: number;
} {
  // Sum of estimated time from template (estimatedMinutes * 60)
  // Sum of actual time from study sessions
  let estimatedSeconds = 0;
  let actualSeconds = 0;

  // For now, we'll get estimated time from the template data
  // This will be enhanced when we call the function with template data
  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  // Get study sessions for these tasks
  // This is a simplified version - in practice we'd want to batch this
  return {
    estimatedSeconds: 0, // Will be filled by caller
    actualSeconds: 0,    // Will be filled by caller
    remainingSeconds: 0, // Will be filled by caller
  };
}

/**
 * Get milestone execution state for a user and roadmap
 */
export async function getMilestoneExecution(
  userId: string,
  roadmapId: string
): Promise<MilestoneExecution[]> {
  const template = readRoadmap(roadmapId);
  
  // Get all tasks for this user+roadmap
  const tasks = await prisma.task.findMany({
    where: { userId, roadmapId: template.id },
    include: {
      category: true,
    },
  });

  // Get manual milestone completions
  const manualMilestones = await prisma.userMilestone.findMany({
    where: { userId, roadmapId: template.id },
  });

  // Compute milestone states using existing logic
  const milestoneStates = await computeMilestoneStatesFromTasks({
    template,
    tasks,
    manuals: manualMilestones,
  });

  // Get study sessions for time tracking
  const studySessions = await prisma.studySession.findMany({
    where: { userId, task: { roadmapId: template.id } },
    select: {
      taskId: true,
      durationMinutes: true,
    },
  });

  // Build time tracking map
  const timeSpentByTaskId = new Map<string, number>();
  for (const session of studySessions) {
    const current = timeSpentByTaskId.get(session.taskId) ?? 0;
    timeSpentByTaskId.set(session.taskId, current + session.durationMinutes * 60);
  }

  // Convert milestone states to execution format
  const milestoneExecutions: MilestoneExecution[] = [];

  for (const [milestoneId, state] of milestoneStates) {
    // Get tasks for this milestone
    const milestoneTasks = tasks.filter(
      (task) => task.milestoneId === milestoneId
    );

    // Get topics for this milestone from template
    const milestoneTemplate = template.milestones.find(
      (m) => m.id === milestoneId
    );
    if (!milestoneTemplate) continue;

    // Get phases for this milestone
    const milestonePhases = milestoneTemplate.phases.map(
      (phaseId) => template.phases.find((p) => p.id === phaseId)
    ).filter((p): p is RoadmapTemplatePhase => Boolean(p));

    // Get topics from phases
    const milestoneTopics: RoadmapTemplateTopic[] = [];
    for (const phase of milestonePhases) {
      if (phase.topics) {
        milestoneTopics.push(...phase.topics);
      }
    }

    // Build topic executions
    const topicExecutions: TopicExecution[] = [];
    for (const topicTemplate of milestoneTopics) {
      // Get tasks for this topic
      const topicTasks = milestoneTasks.filter(
        (task) => task.topicId === topicTemplate.id
      );

      // Calculate topic progress
      const topicProgress = calculateTaskProgress(topicTasks);

      // Calculate topic time progress
      const topicEstimatedSeconds = topicTemplate.estimated_days ? 
        topicTemplate.estimated_days * 24 * 60 * 60 : 0;
      const topicActualSeconds = topicTasks.reduce((sum, task) => {
        const spent = timeSpentByTaskId.get(task.id) ?? 0;
        return sum + spent;
      }, 0);
      const topicRemainingSeconds = Math.max(
        0,
        topicEstimatedSeconds - topicActualSeconds
      );

      // Build task executions
      const taskExecutions: TaskExecution[] = topicTasks.map((task) => {
        const taskEstimatedSeconds = task.estimatedMinutes * 60;
        const taskActualSeconds = timeSpentByTaskId.get(task.id) ?? 0;
        const taskRemainingSeconds = Math.max(
          0,
          taskEstimatedSeconds - taskActualSeconds
        );

        return {
          id: task.id,
          title: task.title,
          description: task.description ?? null,
          status: task.status as TaskStatus,
          priority: task.priority,
          taskType: task.taskType ?? null,
          difficulty: task.difficulty ?? null,
          phaseTitle: task.phaseTitle ?? null,
          topicTitle: task.topicTitle ?? null,
          milestoneTitle: task.milestoneTitle ?? null,
          sequenceOrder: task.sequenceOrder,
          estimatedSeconds: taskEstimatedSeconds,
          actualSeconds: taskActualSeconds,
          remainingSeconds: taskRemainingSeconds,
          completedAt: task.completedAt ?? null,
          activeTimer: null, // Will be filled by timer state
        };
      });

      topicExecutions.push({
        id: topicTemplate.id,
        title: topicTemplate.title,
        description: null, // Template doesn't have topic descriptions
        progress: topicProgress,
        timeProgress: {
          estimatedSeconds: topicEstimatedSeconds,
          actualSeconds: topicActualSeconds,
          remainingSeconds: topicRemainingSeconds,
        },
        tasks: taskExecutions,
        activeTimer: null, // Will be filled by timer state
      });
    }

    // Calculate milestone progress from topics (or tasks if no topics)
    const milestoneProgress = calculateTaskProgress(milestoneTasks);
    const milestoneEstimatedSeconds = milestoneTopics.reduce((sum, topic) => {
      return sum + (topic.estimated_days ? topic.estimated_days * 24 * 60 * 60 : 0);
    }, 0);
    const milestoneActualSeconds = milestoneTasks.reduce((sum, task) => {
      const spent = timeSpentByTaskId.get(task.id) ?? 0;
      return sum + spent;
    }, 0);
    const milestoneRemainingSeconds = Math.max(
      0,
      milestoneEstimatedSeconds - milestoneActualSeconds
    );

      milestoneExecutions.push({
        id: milestoneId,
        title: milestoneTemplate.title,
        description: milestoneTemplate.description ?? null,
        status: state.status,
        locked: state.locked,
        manuallyCompleted: state.manuallyCompleted,
        prerequisites: state.prerequisites.map((prereq) => ({
          id: prereq.id,
          title: prereq.title,
          met: prereq.met,
        })),
        progress: milestoneProgress,
        timeProgress: {
          estimatedSeconds: milestoneEstimatedSeconds,
          actualSeconds: milestoneActualSeconds,
          remainingSeconds: milestoneRemainingSeconds,
        },
        topics: topicExecutions,
        phases: milestoneTemplate.phases, // Array of phase IDs for TemplateAccordion
        activeTimer: null, // Will be filled by timer state
      });
  }

  return milestoneExecutions;
}

/**
 * Helper function to compute milestone states from tasks (extracted from milestones.ts)
 */
async function computeMilestoneStatesFromTasks(params: {
  template: RoadmapTemplate;
  tasks: Task[];
  manuals: UserMilestone[];
}): Promise<Map<string, {
  id: string;
  title: string;
  description?: string;
  status: "LOCKED" | "IN_PROGRESS" | "DONE";
  locked: boolean;
  manuallyCompleted: boolean;
  prereqMet: boolean;
  needsManualCompletion: boolean;
  prerequisites: { id: string; title: string; met: boolean }[];
  progress: { completed: number; total: number; percent: number };
}>> {
  const { template, tasks, manuals } = params;
  const byMilestoneId = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.milestoneId) {
      const bucket = byMilestoneId.get(task.milestoneId);
      if (bucket) {
        bucket.push(task);
      } else {
        byMilestoneId.set(task.milestoneId, [task]);
      }
    }
  }

  const states = new Map<string, {
    id: string;
    title: string;
    description?: string;
    status: "LOCKED" | "IN_PROGRESS" | "DONE";
    locked: boolean;
    manuallyCompleted: boolean;
    prereqMet: boolean;
    needsManualCompletion: boolean;
    prerequisites: { id: string; title: string; met: boolean }[];
    progress: { completed: number; total: number; percent: number };
  }>();

  const markDoneIfNatural = (milestone: RoadmapTemplateMilestone) => {
    if (states.has(milestone.id)) {
      return states.get(milestone.id)!;
    }
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
    const state = {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: "IN_PROGRESS" as const,
      locked: false,
      manuallyCompleted: Boolean(manual?.manuallyCompletedAt),
      prereqMet: false,
      needsManualCompletion: Boolean(manual),
      prerequisites: [],
      progress: {
        completed,
        total,
        percent: total === 0 ? 0 : Math.round((completed / total) * 100),
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

function prereqStateDone(state: {
  progress: { completed: number; total: number; percent: number };
  manuallyCompleted: boolean;
}) {
  return (
    state.manuallyCompleted || state.progress.completed === state.progress.total
  );
}

/**
 * Get roadmap execution state
 */
export async function getRoadmapExecution(
  userId: string,
  roadmapId: string
): Promise<RoadmapExecution> {
  const template = readRoadmap(roadmapId);
  
  // Get milestone executions
  const milestones = await getMilestoneExecution(userId, roadmapId);
  
  // Calculate overall roadmap progress
  const totalTasks = milestones.reduce((sum, milestone) => {
    return sum + milestone.topics.reduce((topicSum, topic) => {
      return topicSum + topic.tasks.length;
    }, 0);
  }, 0);
  
  const completedTasks = milestones.reduce((sum, milestone) => {
    return sum + milestone.topics.reduce((topicSum, topic) => {
      return topicSum + topic.tasks.filter(task => task.status === "COMPLETED").length;
    }, 0);
  }, 0);
  
  const roadmapProgress = {
    completed: completedTasks,
    total: totalTasks,
    percent: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
  };
  
  // Calculate overall time progress
  const totalEstimatedSeconds = milestones.reduce((sum, milestone) => {
    return sum + milestone.topics.reduce((topicSum, topic) => {
      return topicSum + topic.timeProgress.estimatedSeconds;
    }, 0);
  }, 0);
  
  const totalActualSeconds = milestones.reduce((sum, milestone) => {
    return sum + milestone.topics.reduce((topicSum, topic) => {
      return topicSum + topic.timeProgress.actualSeconds;
    }, 0);
  }, 0);
  
  const totalRemainingSeconds = Math.max(0, totalEstimatedSeconds - totalActualSeconds);
  
  const roadmapTimeProgress = {
    estimatedSeconds: totalEstimatedSeconds,
    actualSeconds: totalActualSeconds,
    remainingSeconds: totalRemainingSeconds,
  };
  
  // Find next action
  const nextAction = getNextRoadmapAction(milestones);
  
  return {
    id: template.id,
    title: template.title,
    description: template.description ?? null,
    progress: roadmapProgress,
    timeProgress: roadmapTimeProgress,
    milestones,
    activeTimer: null, // Will be filled by timer state
  };
}

/**
 * Get the next actionable item in the roadmap
 */
export function getNextRoadmapAction(
  milestones: MilestoneExecution[]
): NextRoadmapAction | null {
  // Find first unlocked milestone
  const firstUnlocked = milestones.find((m) => !m.locked);
  if (!firstUnlocked) return null;

  // Find first incomplete topic in that milestone
  for (const milestone of milestones) {
    if (milestone.locked) continue;
    
    const firstIncompleteTopic = milestone.topics.find(
      (topic) => topic.progress.percent < 100
    );
    if (firstIncompleteTopic) {
      // Find first incomplete task in that topic
      const firstIncompleteTask = firstIncompleteTopic.tasks.find(
        (task) => task.status !== "COMPLETED"
      );
      if (firstIncompleteTask) {
        return {
          type: "task",
          id: firstIncompleteTask.id,
          title: firstIncompleteTask.title,
          description: firstIncompleteTask.description,
          estimatedSeconds: firstIncompleteTask.estimatedSeconds,
          phaseTitle: firstIncompleteTask.phaseTitle,
          topicTitle: firstIncompleteTask.topicTitle,
          milestoneTitle: firstIncompleteTask.milestoneTitle,
        };
      }
      
      // If all tasks in topic are complete, return topic completion
      return {
        type: "topic",
        id: firstIncompleteTopic.id,
        title: firstIncompleteTopic.title,
        description: null,
        estimatedSeconds: firstIncompleteTopic.timeProgress.estimatedSeconds,
        phaseTitle: null,
        topicTitle: firstIncompleteTopic.title,
        milestoneTitle: milestone.title,
      };
    }
  }
  
  // If all topics in first unlocked milestone are complete, return milestone completion
  return {
    type: "milestone",
    id: firstUnlocked.id,
    title: firstUnlocked.title,
    description: firstUnlocked.description,
    estimatedSeconds: firstUnlocked.timeProgress.estimatedSeconds,
    phaseTitle: null,
    topicTitle: null,
    milestoneTitle: firstUnlocked.title,
  };
}