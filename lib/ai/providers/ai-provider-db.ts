import { prisma } from "@/lib/prisma";

export interface AIProviderConfig {
  id: string;
  name: string;
  slug: string;
  type: "SYSTEM" | "CUSTOM";
  protocol: string;
  status: "ENABLED" | "DISABLED";
  endpoint: string;
  model?: string;
  capabilities?: any;
  configuration?: any;
  metadata?: any;
  isDefault: boolean;
  isSystem: boolean;
  isManagedByEnv: boolean;
  createdAt: Date;
  updatedAt: Date;
  definitionId?: string;
}

export interface AIProviderSecret {
  id: string;
  providerId: string;
  encryptedApiKey: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export class AIProviderDB {
  static async createProvider(config: AIProviderConfig): Promise<AIProviderConfig> {
    const provider = await prisma.aIProvider.create({
      data: config,
      include: { secrets: true },
    });
    return provider as unknown as AIProviderConfig;
  }

  static async getProvider(id: string): Promise<AIProviderConfig | null> {
    const provider = await prisma.aIProvider.findUnique({
      where: { id },
      include: { secrets: true, definition: true },
    });
    return provider as unknown as AIProviderConfig | null;
  }

  static async getProviderBySlug(slug: string): Promise<AIProviderConfig | null> {
    const provider = await prisma.aIProvider.findUnique({
      where: { slug },
      include: { secrets: true, definition: true },
    });
    return provider as unknown as AIProviderConfig | null;
  }

  static async getAllProviders(): Promise<AIProviderConfig[]> {
    const providers = await prisma.aIProvider.findMany({
      include: { secrets: true, definition: true },
      orderBy: { createdAt: "desc" },
    });
    return providers as unknown as AIProviderConfig[];
  }

  static async updateProvider(id: string, updates: Partial<AIProviderConfig>): Promise<AIProviderConfig> {
    const provider = await prisma.aIProvider.update({
      where: { id },
      data: updates,
      include: { secrets: true, definition: true },
    });
    return provider as unknown as AIProviderConfig;
  }

  static async deleteProvider(id: string): Promise<void> {
    await prisma.aIProvider.delete({ where: { id } });
  }

  static async createSecret(providerId: string, encryptedApiKey: string, version: number): Promise<AIProviderSecret> {
    const secret = await prisma.aIProviderSecret.create({
      data: {
        providerId,
        encryptedApiKey,
        version,
      },
    });
    return secret as unknown as AIProviderSecret;
  }

  static async getLatestSecret(providerId: string): Promise<AIProviderSecret | null> {
    const secret = await prisma.aIProviderSecret.findFirst({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
    return secret as unknown as AIProviderSecret | null;
  }

  static async getSecrets(providerId: string): Promise<AIProviderSecret[]> {
    const secrets = await prisma.aIProviderSecret.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
    return secrets as unknown as AIProviderSecret[];
  }

  static async updateSecret(id: string, updates: Partial<Pick<AIProviderSecret, "encryptedApiKey" | "version">>): Promise<AIProviderSecret> {
    const secret = await prisma.aIProviderSecret.update({
      where: { id },
      data: updates,
    });
    return secret as unknown as AIProviderSecret;
  }

  static async deleteSecret(id: string): Promise<void> {
    await prisma.aIProviderSecret.delete({ where: { id } });
  }

  static async getSystemProviders(): Promise<AIProviderConfig[]> {
    const providers = await prisma.aIProvider.findMany({
      where: { isSystem: true },
      include: { secrets: true, definition: true },
    });
    return providers as unknown as AIProviderConfig[];
  }

  static async getDefaultProvider(): Promise<AIProviderConfig | null> {
    const provider = await prisma.aIProvider.findFirst({
      where: { isDefault: true },
      include: { secrets: true, definition: true },
    });
    return provider as unknown as AIProviderConfig | null;
  }

  static async setDefaultProvider(id: string): Promise<void> {
    // First, reset all other providers to not default
    await prisma.aIProvider.updateMany({
      data: { isDefault: false },
      where: { id: { not: id } },
    });

    // Then set the selected provider as default
    await prisma.aIProvider.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  static async hasSecret(providerId: string): Promise<boolean> {
    const secret = await this.getLatestSecret(providerId);
    return secret !== null;
  }

  static async getProviderWithSecrets(id: string): Promise<any> {
    const provider = await prisma.aIProvider.findUnique({
      where: { id },
      include: { secrets: true, definition: true },
    });
    return provider;
  }

  static async getAllProvidersWithSecrets(): Promise<any[]> {
    const providers = await prisma.aIProvider.findMany({
      include: { secrets: true, definition: true },
      orderBy: { createdAt: "desc" },
    });
    return providers;
  }

  static async getDiagramsByProvider(providerId: string): Promise<any[]> {
    const diagrams = await prisma.archifyDiagram.findMany({
      where: { providerId },
      orderBy: { createdAt: "desc" },
    });
    return diagrams;
  }
}
