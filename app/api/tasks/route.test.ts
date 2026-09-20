import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    taskCategory: { findMany: vi.fn() },
  },
}));

import { GET, POST } from "./route";
import { PATCH, DELETE } from "./[id]/route";
import { prisma as prismaClient } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Mock = ReturnType<typeof vi.fn>;

type TaskWhere = { id?: string; userId?: string };
const prisma = prismaClient as unknown as {
  task: {
    findMany: Mock;
    count: Mock;
    create: Mock;
    findFirst: Mock;
    update: Mock;
    delete: Mock;
  };
  taskCategory: { findMany: Mock };
};

const userA = { id: "userA", name: "A", email: "a@example.com" };
const ownTask = { id: "task-1", userId: "userA", title: "Own task" };

function jsonRequest(url: string, body?: unknown) {
  return new Request(url, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.mocked(requireUser).mockReset();
  prisma.task.findMany.mockReset();
  prisma.task.count.mockReset();
  prisma.task.create.mockReset();
  prisma.task.findFirst.mockReset();
  prisma.task.update.mockReset();
  prisma.task.delete.mockReset();
  prisma.taskCategory.findMany.mockReset();

  prisma.task.count.mockResolvedValue(1);
  prisma.taskCategory.findMany.mockResolvedValue([{ name: "DSA" }]);
  prisma.task.findMany.mockResolvedValue([ownTask]);
  prisma.task.create.mockImplementation(
    ({ data }: { data: { userId: string } }) =>
      Promise.resolve({ id: "new-1", ...data, category: null }),
  );
  prisma.task.findFirst.mockImplementation(
    ({ where }: { where?: TaskWhere }) =>
      Promise.resolve(
        where?.userId === userA.id || !where?.userId
          ? (ownTask as never)
          : null,
      ),
  );
  prisma.task.update.mockImplementation(
    ({ data }: { data?: Record<string, unknown> }) =>
      Promise.resolve({ ...ownTask, ...data, category: null }),
  );
  prisma.task.delete.mockResolvedValue({});
});

describe("GET /api/tasks", () => {
  it("filters tasks by the authenticated user id", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    const response = await GET(
      jsonRequest("http://localhost/api/tasks?page=1&pageSize=20"),
    );
    expect(response.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "userA" }),
      }),
    );
    const body = (await response.json()) as { tasks: unknown[] };
    expect(body.tasks).toHaveLength(1);
  });

  it("rejects unauthenticated requests", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    const response = await GET(jsonRequest("http://localhost/api/tasks"));
    expect(response.status).toBe(401);
  });
});

describe("POST /api/tasks", () => {
  it("scopes the created task to the authenticated user", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", {
        title: "New task",
        priority: "HIGH",
      }),
    );
    expect(response.status).toBe(201);
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "userA", title: "New task" }),
      }),
    );
  });

  it("rejects empty titles", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    const response = await POST(
      jsonRequest("http://localhost/api/tasks", { title: "   " }),
    );
    expect(response.status).toBe(400);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/tasks/[id]", () => {
  const ctx = { params: Promise.resolve({ id: "task-1" }) };

  it("updates only tasks owned by the authenticated user", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    const response = await PATCH(
      jsonRequest("http://localhost/api/tasks/task-1", { completed: true }),
      ctx,
    );
    expect(response.status).toBe(200);
    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task-1", userId: "userA" },
      }),
    );
    expect(prisma.task.update).toHaveBeenCalled();
  });

  it("returns 404 for another user's task (no cross-user update)", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    prisma.task.findFirst.mockImplementation(
      ({ where }: { where?: TaskWhere }) =>
        Promise.resolve(where?.userId === "userB" ? (ownTask as never) : null),
    );
    const response = await PATCH(
      jsonRequest("http://localhost/api/tasks/userB-task", { completed: true }),
      { params: Promise.resolve({ id: "userB-task" }) },
    );
    expect(response.status).toBe(404);
    expect(prisma.task.update).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    const response = await PATCH(
      jsonRequest("http://localhost/api/tasks/task-1", { completed: true }),
      ctx,
    );
    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/tasks/[id]", () => {
  it("deletes only tasks owned by the authenticated user", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    const response = await DELETE(
      jsonRequest("http://localhost/api/tasks/task-1"),
      { params: Promise.resolve({ id: "task-1" }) },
    );
    expect(response.status).toBe(200);
    expect(prisma.task.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "task-1", userId: "userA" },
      }),
    );
    expect(prisma.task.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "task-1" } }),
    );
  });

  it("returns 404 for another user's task (no cross-user delete)", async () => {
    vi.mocked(requireUser).mockResolvedValue(userA as never);
    prisma.task.findFirst.mockResolvedValue(null);
    const response = await DELETE(
      jsonRequest("http://localhost/api/tasks/userB-task"),
      { params: Promise.resolve({ id: "userB-task" }) },
    );
    expect(response.status).toBe(404);
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });
});