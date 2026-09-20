import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: { findFirst: vi.fn() },
    studySession: { create: vi.fn() },
  },
}));

import { POST } from "./route";
import { prisma as prismaClient } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

type Mock = ReturnType<typeof vi.fn>;

const prisma = prismaClient as unknown as {
  task: { findFirst: Mock };
  studySession: { create: Mock };
};

const user = { id: "userA", email: "a@example.com" };

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/study-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.mocked(requireUser).mockReset();
  prisma.task.findFirst.mockReset();
  prisma.studySession.create.mockReset();

  vi.mocked(requireUser).mockResolvedValue(user as never);
  prisma.task.findFirst.mockImplementation(
    ({ where }: { where?: { id?: string; userId?: string } }) =>
      Promise.resolve(where?.id === "task-1" && where?.userId === user.id
        ? { id: "task-1" }
        : null),
  );
  prisma.studySession.create.mockImplementation(
    ({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: "session-1", ...data }),
  );
});

describe("POST /api/study-sessions", () => {
  it("requires authentication", async () => {
    vi.mocked(requireUser).mockResolvedValue(null as never);
    const response = await POST(jsonRequest({ minutes: 30 }));
    expect(response.status).toBe(401);
  });

  it("rejects non-integer minutes", async () => {
    const response = await POST(jsonRequest({ minutes: 30.5 }));
    expect(response.status).toBe(400);
  });

  it("rejects out-of-range minutes", async () => {
    expect((await POST(jsonRequest({ minutes: 0 }))).status).toBe(400);
    expect((await POST(jsonRequest({ minutes: 1441 }))).status).toBe(400);
  });

  it("rejects a taskId that does not belong to the user", async () => {
    const response = await POST(jsonRequest({ minutes: 30, taskId: "task-9" }));
    expect(response.status).toBe(404);
  });

  it("creates a session scoped to the authenticated user", async () => {
    const response = await POST(
      jsonRequest({ minutes: 45, taskId: "task-1" }),
    );
    expect(response.status).toBe(201);
    const { session } = await response.json();
    expect(session.userId).toBe("userA");
    expect(session.taskId).toBe("task-1");
    expect(session.durationMinutes).toBe(45);
  });
});