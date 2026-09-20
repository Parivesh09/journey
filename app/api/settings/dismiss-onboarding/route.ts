import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function POST() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!user.onboardingDismissedAt) {
    await prisma.user.update({
      where: { id: user.id },
      data: { onboardingDismissedAt: new Date() },
    });
  }
  return NextResponse.json({ dismissed: true });
}