"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { APIKeyEncryption } from "@/lib/ai/encryption/api-key-encryption";
import { AISecretService } from "@/lib/ai/secrets/ai-secret-service";
import { AIProviderDB } from "@/lib/ai/providers/ai-provider-db";
import { AIProviderService } from "@/lib/ai/ai-provider-service";
import { AIProviderRegistry } from "@/lib/ai/registry/provider-registry";

// Mock the encryption key for testing
vi.mock("process.env", () => ({
  AI_PROVIDER_ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef", // 32 hex chars
  DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/test",
  OPENAI_API_KEY: "test-openai-key",
  FREELLMAPI_API_KEY: "test-freellmapi-key",
  AI_DEFAULT_PROVIDER: "openai",
}));

const userId = "test-user-id";

describe("AI Provider System - Encryption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should validate encryption key", () => {
    expect(APIKeyEncryption.validateEncryptionKey()).toBe(true);
  });

  it("should encrypt and decrypt API keys", () => {
    const originalKey = "test-api-key-12345";
    const encrypted = APIKeyEncryption.encryptForStorage(originalKey);
    const decrypted = APIKeyEncryption.decryptFromStorage(encrypted);
    
    expect(decrypted).toBe(originalKey);
  });

  it("should generate encryption key", () => {
    const key = APIKeyEncryption.generateKey();
    expect(key).toHaveLength(64); // 32 bytes in hex
  });
});

describe("AI Provider Registry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AIProviderRegistry.initialize();
  });

  it("should initialize system providers", () => {
    const definitions = AIProviderRegistry.getAllDefinitions();
    expect(definitions.length).toBeGreaterThanOrEqual(2); // At least OpenAI and FreeLLMAPI
    
    const openaiDef = AIProviderRegistry.getDefinition("openai");
    expect(openaiDef).toBeDefined();
    expect(openaiDef?.name).toBe("OpenAI");
    expect(openaiDef?.protocol).toBe("openai_compatible");
    expect(openaiDef?.type).toBe("SYSTEM");
  });

  it("should get system definitions only", () => {
    const systemDefs = AIProviderRegistry.getSystemDefinitions();
    expect(systemDefs.every((def) => def.type === "SYSTEM")).toBe(true);
  });

  it("should validate provider definition", async () => {
    const validDef = {
      slug: "test-provider",
      name: "Test Provider",
      type: "CUSTOM",
      protocol: "openai_compatible",
      endpoint: "https://test.example.com/v1",
    };
    
    const errors = await AIProviderRegistry.validateDefinition(validDef);
    expect(errors).toEqual([]);
  });

  it("should reject invalid provider definition", async () => {
    const invalidDef = {
      slug: "openai", // Already exists
      name: "", // Required
    };
    
    const errors = await AIProviderRegistry.validateDefinition(invalidDef);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("AI Secret Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should store and retrieve provider secret", async () => {
    const providerId = "test-provider-id";
    const apiKey = "test-api-key-12345";

    const stored = await AISecretService.storeProviderSecret(providerId, apiKey, userId);
    expect(stored).toBeDefined();
    expect(stored.providerId).toBe(providerId);

    const retrieved = await AISecretService.getProviderSecret(providerId, userId);
    expect(retrieved).toBeDefined();
    expect(retrieved?.providerId).toBe(providerId);

    const decrypted = await AISecretService.getDecryptedApiKey(providerId, userId);
    expect(decrypted).toBe(apiKey);
  });

  it("should update provider secret", async () => {
    const providerId = "test-provider-id-2";
    const originalKey = "original-key-12345";
    const newKey = "new-key-67890";

    await AISecretService.storeProviderSecret(providerId, originalKey, userId);
    
    const stored1 = await AISecretService.getProviderSecret(providerId, userId);
    expect(stored1).toBeDefined();

    await AISecretService.updateProviderSecret(providerId, newKey, userId);
    
    const retrieved = await AISecretService.getDecryptedApiKey(providerId, userId);
    expect(retrieved).toBe(newKey);
  });

  it("should check if provider has secret", async () => {
    const providerId = "test-provider-id-3";

    const hasSecretBefore = await AISecretService.hasSecret(providerId, userId);
    expect(hasSecretBefore).toBe(false);

    await AISecretService.storeProviderSecret(providerId, "test-key", userId);

    const hasSecretAfter = await AISecretService.hasSecret(providerId, userId);
    expect(hasSecretAfter).toBe(true);
  });
});

describe("AI Provider Database", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create and retrieve provider", async () => {
    const providerConfig = {
      id: "test-provider-1",
      name: "Test Provider 1",
      slug: "test-provider-1",
      type: "CUSTOM",
      protocol: "openai_compatible",
      status: "ENABLED",
      endpoint: "https://test1.example.com/v1",
      model: "gpt-4o",
      capabilities: { structuredOutput: true, jsonMode: true },
      configuration: {},
      metadata: {},
      isDefault: false,
      isSystem: false,
      isManagedByEnv: false,
    };

    const created = await AIProviderDB.createProvider(providerConfig);
    expect(created.id).toBe(providerConfig.id);
    expect(created.slug).toBe(providerConfig.slug);

    const retrieved = await AIProviderDB.getProvider(providerConfig.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(providerConfig.id);

    const bySlug = await AIProviderDB.getProviderBySlug(providerConfig.slug);
    expect(bySlug).toBeDefined();
    expect(bySlug?.slug).toBe(providerConfig.slug);
  });

  it("should update provider", async () => {
    const providerConfig = {
      id: "test-provider-2",
      name: "Test Provider 2",
      slug: "test-provider-2",
      type: "CUSTOM",
      protocol: "openai_compatible",
      status: "ENABLED",
      endpoint: "https://test2.example.com/v1",
      model: "gpt-4o",
      capabilities: { structuredOutput: true },
      configuration: {},
      metadata: {},
      isDefault: false,
      isSystem: false,
      isManagedByEnv: false,
    };

    await AIProviderDB.createProvider(providerConfig);

    const updates = { model: "gpt-4o-mini", status: "DISABLED" as const };
    const updated = await AIProviderDB.updateProvider(providerConfig.id, updates);
    expect(updated.model).toBe(updates.model);
    expect(updated.status).toBe(updates.status);
  });

  it("should delete provider", async () => {
    const providerConfig = {
      id: "test-provider-3",
      name: "Test Provider 3",
      slug: "test-provider-3",
      type: "CUSTOM",
      protocol: "openai_compatible",
      status: "ENABLED",
      endpoint: "https://test3.example.com/v1",
      model: "gpt-4o",
      capabilities: { structuredOutput: true },
      configuration: {},
      metadata: {},
      isDefault: false,
      isSystem: false,
      isManagedByEnv: false,
    };

    await AIProviderDB.createProvider(providerConfig);

    await AIProviderDB.deleteProvider(providerConfig.id);

    const retrieved = await AIProviderDB.getProvider(providerConfig.id);
    expect(retrieved).toBeNull();
  });

  it("should set and get default provider", async () => {
    const provider1 = {
      id: "test-provider-default-1",
      name: "Test Provider Default 1",
      slug: "test-provider-default-1",
      type: "CUSTOM",
      protocol: "openai_compatible",
      status: "ENABLED",
      endpoint: "https://test-default-1.example.com/v1",
      model: "gpt-4o",
      capabilities: { structuredOutput: true },
      configuration: {},
      metadata: {},
      isDefault: false,
      isSystem: false,
      isManagedByEnv: false,
    };

    const provider2 = {
      id: "test-provider-default-2",
      name: "Test Provider Default 2",
      slug: "test-provider-default-2",
      type: "CUSTOM",
      protocol: "openai_compatible",
      status: "ENABLED",
      endpoint: "https://test-default-2.example.com/v1",
      model: "gpt-4o",
      capabilities: { structuredOutput: true },
      configuration: {},
      metadata: {},
      isDefault: false,
      isSystem: false,
      isManagedByEnv: false,
    };

    await AIProviderDB.createProvider(provider1);
    await AIProviderDB.createProvider(provider2);

    await AIProviderDB.setDefaultProvider(provider1.id);

    const defaultProvider = await AIProviderDB.getDefaultProvider();
    expect(defaultProvider?.id).toBe(provider1.id);

    await AIProviderDB.setDefaultProvider(provider2.id);

    const newDefaultProvider = await AIProviderDB.getDefaultProvider();
    expect(newDefaultProvider?.id).toBe(provider2.id);
  });
});

describe("AI Provider Service Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize and get provider service instance", () => {
    const service = AIProviderService.getInstance();
    expect(service).toBeDefined();
  });

  it("should get provider definitions", async () => {
    const service = AIProviderService.getInstance();
    await service.initialize();
    
    const definitions = await service.getProviderDefinitions();
    expect(definitions.length).toBeGreaterThanOrEqual(2);
    
    const systemDefs = await service.getSystemProviderDefinitions();
    expect(systemDefs.every((def) => def.type === "SYSTEM")).toBe(true);
  });

  it("should validate encryption key status", async () => {
    const service = AIProviderService.getInstance();
    await service.initialize();
    
    const isValid = await service.getEncryptionKeyStatus();
    expect(typeof isValid).toBe("boolean");
  });
});

// Integration test for the full flow
vi.describe("Full Integration Test", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Setup test database would go here
  });

  it("should create provider, store secret, and retrieve encrypted key", async () => {
    const service = AIProviderService.getInstance();
    await service.initialize();
    
    // Create a custom provider
    const provider = await service.createProvider({
      name: "Integration Test Provider",
      slug: "integration-test",
      protocol: "openai_compatible",
      endpoint: "https://integration-test.example.com/v1",
      model: "gpt-4o",
      capabilities: { structuredOutput: true, jsonMode: true },
      configuration: {},
      metadata: { test: true },
      isDefault: false,
      isSystem: false,
      isManagedByEnv: false,
    });

    // Store API key
    await service.updateProviderSecret(provider.id, "integration-test-key-12345", userId);

    // Retrieve secret
    const secret = await service.getProviderSecret(provider.id, userId);
    expect(secret).toBeDefined();
    expect(secret?.providerId).toBe(provider.id);

    // Test connection
    const health = await service.testConnection(provider.id, userId);
    expect(health).toBeDefined();
  });
});
