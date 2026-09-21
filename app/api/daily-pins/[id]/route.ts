import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const pin = await prisma.dailyTaskPin.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!pin || pin.userId !== user.id)
    return NextResponse.json({ error: "Pin not found" }, { status: 404 });

  await prisma.dailyTaskPin.delete({ where: { id: pin.id } });
  return NextResponse.json({ deleted: true, id: pin.id });
}