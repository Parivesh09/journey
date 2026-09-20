import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { accountSettingsSchema } from "@/lib/validation/schemas";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [preferences, telegramIntegration] = await Promise.all([
    prisma.notificationPreference.findUnique({ where: { userId: user.id } }),
    prisma.userIntegration.findFirst({
      where: { userId: user.id, provider: "telegram" },
      select: { telegramChatId: true },
    }),
  ]);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      dailyStudyTargetMinutes: user.dailyStudyTargetMinutes,
      theme: user.theme,
      onboardingDismissedAt: user.onboardingDismissedAt,
    },
    notifications: preferences,
    telegramLinked: Boolean(telegramIntegration?.telegramChatId),
  });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = accountSettingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid settings" },
      { status: 400 },
    );
  }
  const values = parsed.data;

  if (values.email && values.email !== user.email) {
    const taken = await prisma.user.findUnique({
      where: { email: values.email },
      select: { id: true },
    });
    if (taken && taken.id !== user.id) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }
  }

  let passwordHash = undefined as string | undefined;
  if (values.newPassword) {
    const account = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (
      !account?.passwordHash ||
      !(await bcrypt.compare(values.currentPassword!, account.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }
    passwordHash = await bcrypt.hash(values.newPassword, 12);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(values.name ? { name: values.name } : {}),
      ...(values.email ? { email: values.email } : {}),
      ...(values.timezone ? { timezone: values.timezone } : {}),
      ...(values.dailyStudyTargetMinutes !== undefined
        ? { dailyStudyTargetMinutes: values.dailyStudyTargetMinutes }
        : {}),
      ...(values.theme ? { theme: values.theme } : {}),
      ...(passwordHash ? { passwordHash } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      timezone: true,
      dailyStudyTargetMinutes: true,
      theme: true,
    },
  });

  return NextResponse.json({ user: updated });
}