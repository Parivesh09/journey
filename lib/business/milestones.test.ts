import { describe, expect, it } from "vitest";

import { computeMilestoneStates } from "./milestones";
import type { RoadmapTemplate } from "./roadmap-templates";

const template: RoadmapTemplate = {
  id: "fixture",
  title: "Fixture",
  milestones: [
    { id: "m1", title: "Foundations", phases: ["p1"], prerequisites: [] },
    { id: "m2", title: "React", phases: ["p2"], prerequisites: ["m1"] },
    { id: "m3", title: "Databases", phases: ["p3"], prerequisites: ["m2"] },
  ],
  phases: [
    { id: "p1", title: "P1" },
    { id: "p2", title: "P2" },
    { id: "p3", title: "P3" },
  ],
};

const baseTask = {
  completedAt: null,
  dueDate: null,
  priority: "MEDIUM",
  taskType: "practice",
  difficulty: "medium",
  phaseId: "",
  phaseTitle: "",
  topicId: "",
  topicTitle: "",
  roadmapId: template.id,
};

function task(id: string, milestoneId: string, status: string, seq: number) {
  return {
    id,
    title: id,
    status,
    milestoneId,
    sequenceOrder: seq,
    ...baseTask,
  } as never;
}

type Manual = { milestoneId: string; manuallyCompletedAt?: Date };

function statesFor(tasks: ReturnType<typeof task>[], manuals: Manual[] = []) {
  return computeMilestoneStates({
    template,
    tasks,
    manuals: manuals as unknown as never[],
  });
}

describe("computeMilestoneStates", () => {
  it("locks a milestone until every prerequisite is done", () => {
    const states = statesFor([
      task("t1", "m1", "TODO", 1),
      task("t3", "m2", "TODO", 1),
    ]);
    const m1 = states.get("m1")!;
    const m2 = states.get("m2")!;
    expect(m1.status).toBe("IN_PROGRESS");
    expect(m1.locked).toBe(false);
    expect(m2.status).toBe("LOCKED");
    expect(m2.locked).toBe(true);
    expect(m2.prerequisites[0]).toMatchObject({ id: "m1", met: false });
  });

  it("unlocks once the prerequisite milestone is completed", () => {
    const states = statesFor([
      task("t1", "m1", "COMPLETED", 1),
      task("t2", "m1", "COMPLETED", 2),
      task("t3", "m2", "TODO", 1),
    ]);
    const m1 = states.get("m1")!;
    const m2 = states.get("m2")!;
    expect(m1.status).toBe("DONE");
    expect(m2.status).toBe("IN_PROGRESS");
    expect(m2.locked).toBe(false);
    expect(m2.prerequisites[0]).toMatchObject({ id: "m1", met: true });
    expect(m2.needsManualCompletion).toBe(true);
  });

  it("propagates a manual completion down the chain", () => {
    const states = statesFor([task("t3", "m2", "TODO", 1)], [
      { milestoneId: "m1", manuallyCompletedAt: new Date() },
    ]);
    const m1 = states.get("m1")!;
    const m2 = states.get("m2")!;
    expect(m1.status).toBe("DONE");
    expect(m1.manuallyCompleted).toBe(true);
    expect(m2.locked).toBe(false);
  });

  it("reports progress toward completion", () => {
    const states = statesFor([
      task("t1", "m1", "COMPLETED", 1),
      task("t2", "m1", "TODO", 2),
    ]);
    expect(states.get("m1")!.progress).toEqual({
      completed: 1,
      total: 2,
      percent: 50,
    });
  });

  it("does not offer manual completion on locked milestones", () => {
    const states = statesFor([
      task("t1", "m1", "TODO", 1),
      task("t3", "m2", "TODO", 1),
    ]);
    const m2 = states.get("m2")!;
    expect(m2.locked).toBe(true);
    expect(m2.needsManualCompletion).toBe(false);
  });
});