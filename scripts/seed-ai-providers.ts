"use client";
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { AIProviderRegistry } from "@/lib/ai/registry/provider-registry";
import { APIKeyEncryption } from "@/lib/ai/encryption/api-key-encryption";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

AIProviderRegistry.initialize();

export async function seedAIProviders() {
  console.log("Seeding AI providers...");

  const openaiDefinition = AIProviderRegistry.getDefinition("openai");
  const freellmapiDefinition = AIProviderRegistry.getDefinition("freellmapi");

  if (!openaiDefinition || !freellmapiDefinition) {
    throw new Error("Provider definitions not found");
  }

  // Check if providers already exist
  const existingOpenAI = await prisma.aIProvider.findUnique({
    where: { slug: "openai" },
  });

  const existingFreeLLMAPI = await prisma.aIProvider.findUnique({
    where: { slug: "freellmapi" },
  });

  // Seed OpenAI provider if it doesn't exist
  if (!existingOpenAI) {
    console.log("Creating OpenAI provider...");
    
    await prisma.aIProvider.create({
      data: {
        name: openaiDefinition.name,
        slug: openaiDefinition.slug,
        type: "SYSTEM",
        protocol: "OPENAI_COMPATIBLE",
        status: "ENABLED",
        endpoint: openaiDefinition.endpoint || "https://api.openai.com/v1",
        model: "gpt-4o",
        capabilities: openaiDefinition.capabilities,
        configuration: {
          organization: process.env.OPENAI_ORGANIZATION,
          baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
        },
        metadata: {
          definitionId: openaiDefinition.id,
        },
        isDefault: process.env.AI_DEFAULT_PROVIDER === "openai",
        isSystem: true,
        isManagedByEnv: true,
      },
    });

    // Provider secrets are user-owned, so there is nothing to seed here.
    // Instance-wide env credentials stay in env and are read directly by
    // createAIServiceFromEnv(); each user adds their own key via /settings.
  }

  // Seed FreeLLMAPI provider if it doesn't exist
  if (!existingFreeLLMAPI) {
    console.log("Creating FreeLLMAPI provider...");
    
    await prisma.aIProvider.create({
      data: {
        name: freellmapiDefinition.name,
        slug: freellmapiDefinition.slug,
        type: "SYSTEM",
        protocol: "OPENAI_COMPATIBLE",
        status: "ENABLED",
        endpoint: process.env.FREELLMAPI_BASE_URL || "http://localhost:3001/v1",
        model: process.env.FREELLMAPI_MODEL || "auto",
        capabilities: freellmapiDefinition.capabilities,
        configuration: {
          apiKeyRef: "FREELLMAPI_API_KEY",
        },
        metadata: {
          definitionId: freellmapiDefinition.id,
        },
        isDefault: process.env.AI_DEFAULT_PROVIDER === "freellmapi",
        isSystem: true,
        isManagedByEnv: true,
      },
    });

    // See above: env credentials are not user-owned and stay in env.
  }

  // Set default provider if not already set
  const existingDefault = await prisma.aIProvider.findFirst({
    where: { isDefault: true },
  });

  if (!existingDefault && (process.env.AI_DEFAULT_PROVIDER === "openai" || !process.env.AI_DEFAULT_PROVIDER)) {
    const openaiProvider = await prisma.aIProvider.findUnique({
      where: { slug: "openai" },
    });
    
    if (openaiProvider) {
      await prisma.aIProvider.update({
        where: { id: openaiProvider.id },
        data: { isDefault: true },
      });
      console.log("Set OpenAI as default provider");
    }
  } else if (!existingDefault && process.env.AI_DEFAULT_PROVIDER === "freellmapi") {
    const freellmapiProvider = await prisma.aIProvider.findUnique({
      where: { slug: "freellmapi" },
    });
    
    if (freellmapiProvider) {
      await prisma.aIProvider.update({
        where: { id: freellmapiProvider.id },
        data: { isDefault: true },
      });
      console.log("Set FreeLLMAPI as default provider");
    }
  }

  console.log("AI provider seeding complete!");

  // Return the seeded providers for further use
  return {
    openai: existingOpenAI || (await prisma.aIProvider.findUnique({ where: { slug: "openai" } })),
    freellmapi: existingFreeLLMAPI || (await prisma.aIProvider.findUnique({ where: { slug: "freellmapi" } })),
  };
}

async function main() {
  try {
    await seedAIProviders();
  } catch (error) {
    console.error("Error seeding AI providers:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { main as seedAIProvidersMain };
