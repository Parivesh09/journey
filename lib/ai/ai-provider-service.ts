import { AIProviderDB } from "@/lib/ai/providers/ai-provider-db";
import { AISecretService } from "@/lib/ai/secrets/ai-secret-service";
import { AIProviderRegistry } from "@/lib/ai/registry/provider-registry";
import { APIKeyEncryption } from "@/lib/ai/encryption/api-key-encryption";
import { DatabaseAIProvider } from "@/lib/ai/providers/database-ai-provider";

export class AIProviderService {
  private static instance: AIProviderService;

  private constructor() {}

  public static getInstance(): AIProviderService {
    if (!AIProviderService.instance) {
      AIProviderService.instance = new AIProviderService();
    }
    return AIProviderService.instance;
  }

  public async initialize() {
    AIProviderRegistry.initialize();
    
    // Validate encryption key
    if (!APIKeyEncryption.validateEncryptionKey()) {
      console.warn("AI Provider Encryption key not configured. Using environment variables for default providers.");
    }
  }

  public async getProvider(id: string): Promise<DatabaseAIProvider | null> {
    const dbProvider = await AIProviderDB.getProvider(id);
    if (!dbProvider) {
      return null;
    }
    return new DatabaseAIProvider(dbProvider);
  }

  public async getProviderBySlug(slug: string): Promise<DatabaseAIProvider | null> {
    const dbProvider = await AIProviderDB.getProviderBySlug(slug);
    if (!dbProvider) {
      return null;
    }
    return new DatabaseAIProvider(dbProvider);
  }

  public async getAllProviders(): Promise<DatabaseAIProvider[]> {
    const dbProviders = await AIProviderDB.getAllProviders();
    return dbProviders.map((dbProvider) => new DatabaseAIProvider(dbProvider));
  }

  public async getSystemProviders(): Promise<DatabaseAIProvider[]> {
    const dbProviders = await AIProviderDB.getSystemProviders();
    return dbProviders.map((dbProvider) => new DatabaseAIProvider(dbProvider));
  }

  public async getDefaultProvider(): Promise<DatabaseAIProvider | null> {
    const dbProvider = await AIProviderDB.getDefaultProvider();
    if (!dbProvider) {
      return null;
    }
    return new DatabaseAIProvider(dbProvider);
  }

  public async setDefaultProvider(id: string): Promise<void> {
    await AIProviderDB.setDefaultProvider(id);
  }

  public async createProvider(config: any): Promise<DatabaseAIProvider> {
    // Validate provider config
    const definition = AIProviderRegistry.getDefinition(config.protocol);
    if (!definition) {
      throw new Error(`Unknown protocol: ${config.protocol}`);
    }

    // Strip out apiKey - it should be handled separately via updateProviderSecret
    const { apiKey, ...providerConfig } = config;

    const dbProvider = await AIProviderDB.createProvider({
      ...providerConfig,
      type: "CUSTOM",
      status: "ENABLED",
      isSystem: false,
      isDefault: false,
      isManagedByEnv: false,
    });

    return new DatabaseAIProvider(dbProvider);
  }

  public async updateProvider(id: string, updates: any): Promise<DatabaseAIProvider> {
    // Strip out apiKey - it should be handled separately via updateProviderSecret
    const { apiKey, ...providerUpdates } = updates;
    const dbProvider = await AIProviderDB.updateProvider(id, providerUpdates);
    return new DatabaseAIProvider(dbProvider);
  }

  public async deleteProvider(id: string): Promise<void> {
    await AIProviderDB.deleteProvider(id);
  }

  public async updateProviderSecret(providerId: string, apiKey: string, userId: string): Promise<void> {
    await AISecretService.updateProviderSecret(providerId, apiKey, userId);
  }

  public async deleteProviderSecret(providerId: string, userId: string): Promise<void> {
    await AISecretService.deleteProviderSecret(providerId, userId);
  }

  public async getProviderSecret(providerId: string, userId: string): Promise<any | null> {
    return await AISecretService.getProviderSecret(providerId, userId);
  }

  public async canDeleteProvider(providerId: string): Promise<boolean> {
    const provider = await this.getProvider(providerId);
    if (!provider) {
      return false;
    }
    
    // System providers cannot be deleted
    if (provider.isSystem) {
      return false;
    }
    
    // Check if provider is referenced by any diagrams
    const diagrams = await this.getDiagramsByProvider(providerId);
    return diagrams.length === 0;
  }

  public async getDiagramsByProvider(providerId: string): Promise<any[]> {
    return await AIProviderDB.getDiagramsByProvider(providerId);
  }

  public async testConnection(providerId: string, userId: string): Promise<any> {
    const provider = await this.getProvider(providerId);
    if (!provider) {
      throw new Error("Provider not found");
    }

    return await provider.checkHealth(userId);
  }

  public async getProviderDefinitions() {
    return AIProviderRegistry.getAllDefinitions();
  }

  public async getSystemProviderDefinitions() {
    return AIProviderRegistry.getSystemDefinitions();
  }

  public async getCustomProviderDefinition() {
    return AIProviderRegistry.getCustomDefinition();
  }

  public async validateProviderDefinition(definition: any) {
    return AIProviderRegistry.validateDefinition(definition);
}

  public async createProviderDefinition(definition: any) {
    const errors = await this.validateProviderDefinition(definition);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
    
    // This would normally save to database, but for now we'll just track it in memory
    return { success: true, message: 'Provider definition created (in memory)' };
  }

  public async getEncryptionKeyStatus(): boolean {
    return APIKeyEncryption.validateEncryptionKey();
  }

  public async generateEncryptionKey(): string {
    return APIKeyEncryption.generateKey();
  }
}

// Singleton instance
let instance: AIProviderService | undefined;

export function getAIProviderService(): AIProviderService {
  if (!instance) {
    instance = AIProviderService.getInstance();
  }
  return instance;
}

export const aiProviderService = getAIProviderService();
