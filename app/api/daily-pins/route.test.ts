import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findFirst: vi.fn() },
    dailyTaskPin: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/business/milestones", () => ({
  isMilestoneLocked: vi.fn(async () => false),
}));

import { GET, POST } from "./route";
import { prisma as prismaClient } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { isMilestoneLocked } from "@/lib/business/milestones";

type Mock = ReturnType<typeof vi.fn>;
const prisma = prismaClient as unknown as {
  task: { findFirst: Mock };
  dailyTaskPin: { findMany: Mock; findUnique: Mock; create: Mock };
};

const user = { id: "userA", name: "A", email: "a@example.com" };
const roadmapTask = {
  id: "task-1",
  userId: "userA",
  roadmapId: "fullstack-v1",
  milestoneId: "m-react",
  status: "TODO",
};

function post(taskId: string | undefined) {
  return POST(
    new Request("http://localhost/api/daily-pins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId }),
    }),
  );
}

beforeEach(() => {
  vi.mocked(requireUser).mockReset();
  prisma.task.findFirst.mockReset();
  prisma.dailyTaskPin.findMany.mockReset();
  prisma.dailyTaskPin.findUnique.mockReset();
  prisma.dailyTaskPin.create.mockReset();
  vi.mocked(isMilestoneLocked).mockReset();

  prisma.task.findFirst.mockImplementation(
    ({ where }: { where?: { userId?: string } }) =>
      Promise.resolve(
        where?.userId === user.id ? (roadmapTask as never) : null,
      ),
  );
  prisma.dailyTaskPin.findMany.mockResolvedValue([]);
  prisma.dailyTaskPin.findUnique.mockResolvedValue(null);
  prisma.dailyTaskPin.create.mockImplementation(({ data }: { data: object }) =>
    Promise.resolve({ id: "pin-1", ...data }),
  );
  vi.mocked(isMilestoneLocked).mockResolvedValue(false);
});

describe("GET /api/daily-pins", () => {
  it("returns the current user's pins", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    expect((await GET()).status).toBe(200);
  });

  it("rejects unauthenticated requests", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });
});

describe("POST /api/daily-pins", () => {
  it("rejects missing taskId", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    expect((await post(undefined)).status).toBe(400);
  });

  it("creates a pin for an unlocked roadmap task", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    const response = await post("task-1");
    expect(response.status).toBe(201);
    expect(prisma.dailyTaskPin.create).toHaveBeenCalledWith({
      data: { userId: "userA", taskId: "task-1" },
    });
  });

  it("returns the existing pin instead of duplicating", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.dailyTaskPin.findUnique.mockResolvedValue({
      id: "pin-1",
      userId: "userA",
      taskId: "task-1",
    } as never);
    const response = await post("task-1");
    expect(response.status).toBe(200);
    expect(prisma.dailyTaskPin.create).not.toHaveBeenCalled();
  });

  it("rejects completed tasks", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.task.findFirst.mockResolvedValue({
      ...roadmapTask,
      status: "COMPLETED",
    } as never);
    expect((await post("task-1")).status).toBe(409);
  });

  it("rejects non-roadmap tasks", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.task.findFirst.mockResolvedValue({
      ...roadmapTask,
      roadmapId: null,
      milestoneId: null,
    } as never);
    expect((await post("task-1")).status).toBe(400);
  });

  it("rejects pins into locked milestones", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    vi.mocked(isMilestoneLocked).mockResolvedValue(true);
    expect((await post("task-1")).status).toBe(403);
    expect(prisma.dailyTaskPin.create).not.toHaveBeenCalled();
  });

  it("rejects pins for another user's task", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    prisma.task.findFirst.mockResolvedValue(null);
    expect((await post("task-1")).status).toBe(404);
  });
});