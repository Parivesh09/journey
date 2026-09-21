import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/business/milestones", () => ({
  completeMilestoneManually: vi.fn(),
  ManualCompleteError: class ManualCompleteError extends Error {
    constructor(public reasons: string[]) {
      super(reasons.join(", "));
    }
  },
}));

import { POST } from "./route";
import { requireUser } from "@/lib/auth";
import {
  completeMilestoneManually,
  ManualCompleteError,
} from "@/lib/business/milestones";

const user = { id: "userA", name: "A", email: "a@example.com" };

function post(roadmapId: string | undefined) {
  return POST(
    new Request("http://localhost/api/milestones/m2/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roadmapId }),
    }),
    { params: Promise.resolve({ milestoneId: "m2" }) },
  );
}

beforeEach(() => {
  vi.mocked(requireUser).mockReset();
  vi.mocked(completeMilestoneManually).mockReset();
});

describe("POST /api/milestones/[milestoneId]/complete", () => {
  it("requires authentication", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await post("fixture")).status).toBe(401);
  });

  it("requires a roadmapId", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    expect((await post(undefined)).status).toBe(400);
    expect(completeMilestoneManually).not.toHaveBeenCalled();
  });

  it("returns 404 for an unknown milestone", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    vi.mocked(completeMilestoneManually).mockRejectedValue(
      new ManualCompleteError(["Milestone not found"]),
    );
    const response = await post("fixture");
    expect(response.status).toBe(404);
  });

  it("returns 409 with reasons for a locked milestone", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    vi.mocked(completeMilestoneManually).mockRejectedValue(
      new ManualCompleteError(['Complete "Foundations" first']),
    );
    const response = await post("fixture");
    expect(response.status).toBe(409);
    const body = (await response.json()) as { reasons: string[] };
    expect(body.reasons).toEqual(['Complete "Foundations" first']);
  });

  it("completes an unlocked milestone", async () => {
    vi.mocked(requireUser).mockResolvedValue(user as never);
    vi.mocked(completeMilestoneManually).mockResolvedValue({
      completed: true,
      milestoneId: "m2",
    });
    const response = await post("fixture");
    expect(response.status).toBe(200);
    expect(completeMilestoneManually).toHaveBeenCalledWith(
      "userA",
      "fixture",
      "m2",
    );
  });
});