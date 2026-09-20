import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

vi.mock("@/lib/auth", () => ({
  createSessionValue: vi.fn(() => "session.value.sig"),
  sessionCookie: "sde_session",
  sessionCookieOptions: { httpOnly: true, path: "/" },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

import { POST } from "./route";
import { prisma as prismaClient } from "@/lib/prisma";

type Mock = ReturnType<typeof vi.fn>;
const prisma = prismaClient as unknown as {
  user: { findUnique: Mock };
};

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

let passwordHash = "";

beforeEach(async () => {
  prisma.user.findUnique.mockReset();
  passwordHash = await bcrypt.hash("correct-horse", 4);
  prisma.user.findUnique.mockResolvedValue({
    id: "user-1",
    email: "a@example.com",
    passwordHash,
    isActive: true,
  } as never);
});

describe("POST /api/auth/login", () => {
  it("rejects missing credentials", async () => {
    expect((await post({})).status).toBe(401);
    expect((await post({ email: "a@example.com" })).status).toBe(401);
  });

  it("rejects a wrong password", async () => {
    const response = await post({
      email: "a@example.com",
      password: "wrong-password",
    });
    expect(response.status).toBe(401);
  });

  it("rejects inactive accounts", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@example.com",
      passwordHash,
      isActive: false,
    } as never);
    const response = await post({
      email: "a@example.com",
      password: "correct-horse",
    });
    expect(response.status).toBe(401);
  });

  it("accepts valid credentials and sets the session cookie", async () => {
    const response = await post({
      email: "A@example.com",
      password: "correct-horse",
    });
    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("sde_session=session.value.sig");
    expect(setCookie).toContain("Path=/");
  });
});