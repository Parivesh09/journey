import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  createSessionValue: vi.fn(() => "session.value.sig"),
  sessionCookie: "sde_session",
  sessionCookieOptions: { httpOnly: true, path: "/" },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    notificationPreference: { create: vi.fn() },
  },
}));
vi.mock("@/lib/business/roadmap-provision", () => ({
  provisionRoadmapForUser: vi.fn(async () => {}),
}));

import { POST } from "./route";
import { prisma as prismaClient } from "@/lib/prisma";
import { provisionRoadmapForUser } from "@/lib/business/roadmap-provision";
import bcrypt from "bcryptjs";

type Mock = ReturnType<typeof vi.fn>;
const prisma = prismaClient as unknown as {
  user: { findUnique: Mock; create: Mock };
  notificationPreference: { create: Mock };
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  prisma.user.findUnique.mockReset();
  prisma.user.create.mockReset();
  prisma.notificationPreference.create.mockReset();

  prisma.user.findUnique.mockResolvedValue(null);
  prisma.user.create.mockImplementation(({ data }: { data?: object }) =>
    Promise.resolve({ id: "new-user", name: "A", email: "a@example.com", ...data }),
  );
  prisma.notificationPreference.create.mockResolvedValue({ id: "np-1" });
});

describe("POST /api/auth/signup", () => {
  it("rejects invalid input", async () => {
    expect((await post({ name: "", email: "x", password: "short" })).status).toBe(400);
    expect((await post({ email: "a@example.com", password: "12345678" })).status).toBe(400);
    expect((await post({})).status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("rejects duplicate emails", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "existing" } as never);
    const response = await post({
      name: "A",
      email: "A@example.com",
      password: "password123",
    });
    expect(response.status).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("hashes the password and provisions the roadmap", async () => {
    const response = await post({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      timezone: "Asia/Kolkata",
    });
    expect(response.status).toBe(201);

    const args = prisma.user.create.mock.calls[0]?.[0] as {
      data: { email: string; passwordHash: string; timezone: string };
    };
    expect(args.data.email).toBe("alice@example.com");
    expect(args.data.passwordHash).not.toBe("password123");
    expect(args.data.passwordHash.startsWith("$2")).toBe(true);
    expect(args.data.timezone).toBe("Asia/Kolkata");

    expect(prisma.notificationPreference.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "new-user" } }),
    );
    expect(provisionRoadmapForUser).toHaveBeenCalledWith("new-user");
  });

  it("defaults an invalid timezone to UTC", async () => {
    await post({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      timezone: "Not/AZone",
    });
    const args = prisma.user.create.mock.calls[0]?.[0] as {
      data: { timezone: string };
    };
    expect(args.data.timezone).toBe("UTC");
  });

  it("validates the password against the stored hash", async () => {
    const hash = await bcrypt.hash("password123", 4);
    expect(await bcrypt.compare("password123", hash)).toBe(true);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });
});