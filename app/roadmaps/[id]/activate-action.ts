"use server";

import { revalidatePath } from "next/cache";

export async function activateRoadmap(formData: FormData) {
  const roadmapId = formData.get("roadmapId");
  if (typeof roadmapId !== "string" || !roadmapId) {
    throw new Error("roadmapId is required");
  }

  const { requireUser } = await import("@/lib/auth");
  const user = await requireUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const { provisionRoadmapForUser } = await import("@/lib/business/roadmap-provision");
  await provisionRoadmapForUser(user.id, roadmapId);

  revalidatePath(`/roadmaps/${roadmapId}`);
}
