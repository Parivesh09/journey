// AI Provider System - Main Index
// Provides backward compatibility with existing code while introducing new database-driven features

export { AIProviderDB } from "./ai-provider-db";
export { APIKeyEncryption } from "./encryption/api-key-encryption";
export { AISecretService } from "./secrets/ai-secret-service";
export { AIProviderRegistry } from "./registry/provider-registry";
export { DatabaseAIProvider } from "./database-ai-provider";

// Protocol adapters
export { OpenAICompatibleProtocolAdapter } from "./protocols/openai-compatible-protocol";
export { AnthropicMessagesProtocolAdapter } from "./protocols/anthropic-messages-protocol";

// Main service classes
export { AIProviderService, aiProviderService } from "./ai-provider-service";

// Re-export existing types for backward compatibility
export type { AIProviderConfig, AIProvider, AIRequest, AIResponse, AIError } from "./ai-provider-service";

// Legacy provider interfaces (for backward compatibility)
export interface LegacyAIProvider {
  id: string;
  name: string;
  capabilities: any;
  config: any;
  generateStructuredOutput<T>(request: any): Promise<any>;
  generateText(request: any): Promise<any>;
  streamText(request: any): AsyncIterable<any>;
  checkHealth(): Promise<any>;
  getModels(): Promise<any>;
  supportsModel(modelId: string): boolean;
  supportsCapability(capability: string): boolean;
}

export interface LegacyAIServiceConfig {
  providers: any[];
  defaultProviderId: string;
  featureConfigs: any;
  fallbackProviderIds: string[];
  requestTimeoutMs: number;
  maxRetries: number;
}
