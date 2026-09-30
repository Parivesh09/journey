import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

function getRuntimeConnectionString(value: string) {
  if (!value.includes("supabase.co")) {
    return value;
  }
  const url = new URL(value);
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("uselibpqcompat", "true");
  return url.toString();
}

const adapter = new PrismaPg({
  connectionString: getRuntimeConnectionString(connectionString),
});

const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    console.log("Testing Prisma client...");
    const user = await prisma.user.findFirst();
    console.log("User found:", user ? "yes" : "no");
    
    // Test new models
    const providers = await (prisma as any).aIProvider.findMany();
    console.log("AI Providers:", providers.length);
    
    const definitions = await (prisma as any).aIProviderDefinition.findMany();
    console.log("AI Definitions:", definitions.length);
    
    console.log("All tests passed!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
