import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

prisma.userMilestone
  .deleteMany({})
  .then(() => prisma.userRoadmap.deleteMany({}))
  .then(() =>
    prisma.task.deleteMany({
      where: { sourceId: { not: null }, isPersonalDaily: false },
    }),
  )
  .then((deletedTasks) => {
    console.log(`Removed roadmap tasks: ${deletedTasks.count}`);
    return prisma.$disconnect();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });