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

// Don't cache in development to avoid stale client issues after migrations
export const prisma =
  process.env.NODE_ENV === "production"
    ? new PrismaClient({ adapter })
    : new PrismaClient({ adapter, log: ["query", "error", "warn"] });