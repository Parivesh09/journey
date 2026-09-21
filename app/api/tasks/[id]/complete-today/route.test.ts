import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findFirst: vi.fn() },
    taskCompletion: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
  },
}));

import { POST } from "./route";
import { prisma as prismaClient } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Mock = ReturnType<typeof vi.fn>;
const prisma = prismaClient as unknown as {
  task: { findFirst: Mock };
  taskCompletion: { findFirst: Mock; create: Mock; delete: Mock };
};

const user = { id: "userA", name: "A", email: "a@example.com" };
const routine = { id: "routine-1", userId: "userA", isPersonalDaily: true };
const somedayTask = { id: "task-1", userId: "userA", isPersonalDaily: false };

function post(id: string) {
  return POST(new Request("http://localhost/api/tasks/1/complete-today", {
    method: "POST",
  }), {
    params: Promise.resolve({ id }),
  });
}

beforeEach(() => {
  vi.mocked(requireUser).mockReset();
  prisma.task.findFirst.mockReset();
  prisma.taskCompletion.findFirst.mockReset();
  prisma.taskCompletion.create.mockReset();
  prisma.taskCompletion.delete.mockReset();

  prisma.task.findFirst.mockResolvedValue({ ...routine, category: null } as never);
  prisma.taskCompletion.findFirst.mockResolvedValue(null);
  prisma.taskCompletion.create.mockResolvedValue({ id: "tc-1" });
  prisma.taskCompletion.delete.mockResolvedValue({ id: "tc-1" });
});

describe("POST /api/tasks/[id]/complete-today", () => {
  it("requires authentication", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await post("routine-1")).status).toBe(401);
  });

  it("marks a routine done on first toggle", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    const response = await post("routine-1");
    expect(response.status).toBe(200);
    const body = (await response.json()) as { doneToday: boolean };
    expect(body.doneToday).toBe(true);
    expect(prisma.taskCompletion.create).toHaveBeenCalled();
  });

  it("unmarks a routine when it is already done today", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.taskCompletion.findFirst.mockResolvedValue({ id: "tc-1" } as never);
    const response = await post("routine-1");
    const body = (await response.json()) as { doneToday: boolean };
    expect(body.doneToday).toBe(false);
    expect(prisma.taskCompletion.delete).toHaveBeenCalledWith({
      where: { id: "tc-1" },
    });
    expect(prisma.taskCompletion.create).not.toHaveBeenCalled();
  });

  it("rejects non-daily tasks", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.task.findFirst.mockResolvedValue({ ...somedayTask, category: null } as never);
    expect((await post("task-1")).status).toBe(400);
    expect(prisma.taskCompletion.create).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's task", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.task.findFirst.mockResolvedValue(null);
    expect((await post("task-9")).status).toBe(404);
  });
});