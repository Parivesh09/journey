import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { notificationPreferenceSchema } from "@/lib/validation/schemas";

export async function PUT(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = notificationPreferenceSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid notification settings" },
      { status: 400 },
    );
  }
  const values = parsed.data;
  const data = { ...values, phoneNumber: values.phoneNumber || null };

  const preferences = await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({ notifications: preferences });
}