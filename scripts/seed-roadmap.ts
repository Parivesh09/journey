import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { ensureDailyTasks } from "../lib/business/daily-plan";
import { provisionRoadmapForUser } from "../lib/business/roadmap-provision";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * DEVELOPMENT-ONLY seed. Provisions the default SDE roadmap (task templates)
 * plus today's default daily plan into a single dev user so the app is
 * explorable immediately after a clean Docker database.
 *
 * This user is deliberately isolated from production signups: new accounts
 * are provisioned on the fly during signup (see app/api/auth/signup). Do NOT
 * rely on this seed for multi-user data.
 */
async function main() {
  const email = (process.env.SEED_USER_EMAIL ?? "user@sdecommand.center")
    .trim()
    .toLowerCase();
  const name = process.env.SEED_USER_NAME ?? "SDE User";

  const user =
    (await prisma.user.findUnique({ where: { email } })) ??
    (await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: process.env.SEED_USER_PASSWORD
          ? await import("bcryptjs").then(({ hash }) =>
              hash(process.env.SEED_USER_PASSWORD!, 12),
            )
          : null,
      },
    }));

  await prisma.notificationPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  const result = await provisionRoadmapForUser(user.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await ensureDailyTasks(user.id, today);

  console.log(
    `Seed complete for dev user ${email}: categories=${result.categories}, tasks created=${result.tasksCreated}, existing skipped=${result.tasksSkipped}. Notifications remain OFF (opt-in).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });