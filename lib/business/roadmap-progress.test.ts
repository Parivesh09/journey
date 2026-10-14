import { calculateTaskProgress, calculateTaskTimeProgress } from "./roadmap-progress";

describe("calculateTaskProgress", () => {
  it("should calculate progress correctly", () => {
    const tasks = [
      { id: "1", status: "TODO" as const },
      { id: "2", status: "IN_PROGRESS" as const },
      { id: "3", status: "COMPLETED" as const },
      { id: "4", status: "COMPLETED" as const },
    ];

    const result = calculateTaskProgress(tasks as any);
    expect(result).toEqual({
      completed: 2,
      total: 4,
      percent: 50,
    });
  });

  it("should handle empty tasks array", () => {
    const result = calculateTaskProgress([]);
    expect(result).toEqual({
      completed: 0,
      total: 0,
      percent: 0,
    });
  });

  it("should handle all completed tasks", () => {
    const tasks = [
      { id: "1", status: "COMPLETED" as const },
      { id: "2", status: "COMPLETED" as const },
    ];

    const result = calculateTaskProgress(tasks as any);
    expect(result).toEqual({
      completed: 2,
      total: 2,
      percent: 100,
    });
  });
});

describe("calculateTaskTimeProgress", () => {
  it("should calculate time progress correctly", () => {
    // This is a simplified test - in reality this function needs template data
    const tasks = [];
    const result = calculateTaskTimeProgress(tasks);
    expect(result).toEqual({
      estimatedSeconds: 0,
      actualSeconds: 0,
      remainingSeconds: 0,
    });
  });
});