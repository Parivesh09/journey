import type {
  AIProvider,
  AIProviderConfig,
  AIProviderStatus,
  AIModelInfo,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIError,
  AIServiceConfig,
  FeatureAIConfig,
  AIProviderCapabilities,
} from "@/lib/ai/types";

import { OpenAIProvider, createOpenAIProvider } from "./providers/openai";
import { FreeLLMAPIProvider, createFreeLLMAPIProvider } from "./providers/freellmapi";

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private config: AIServiceConfig;
  private initialized = false;

  constructor(config?: Partial<AIServiceConfig>) {
    this.config = {
      providers: [],
      defaultProviderId: "openai",
      featureConfigs: {},
      fallbackProviderIds: [],
      requestTimeoutMs: 60000,
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Initialize the AI service with providers from config
   */
  initialize(): void {
    if (this.initialized) return;

    for (const providerConfig of this.config.providers) {
      if (!providerConfig.enabled) continue;

      try {
        const provider = this.createProvider(providerConfig);
        this.providers.set(providerConfig.id, provider);
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.id}:`, error);
      }
    }

    this.initialized = true;
  }

  private createProvider(config: AIProviderConfig): AIProvider {
    switch (config.provider) {
      case "openai":
        return createOpenAIProvider(config as any);
      case "freellmapi":
        return createFreeLLMAPIProvider(config as any);
      case "custom":
        // For custom OpenAI-compatible endpoints, use OpenAI provider with custom baseUrl
        return createOpenAIProvider(config as any);
      default:
        throw new Error(`Unknown provider type: ${config.provider}`);
    }
  }

  /**
   * Get a provider by ID
   */
  getProvider(providerId?: string): AIProvider {
    this.ensureInitialized();

    const id = providerId ?? this.config.defaultProviderId;
    const provider = this.providers.get(id);

    if (!provider) {
      throw new Error(`AI provider not found: ${id}`);
    }

    return provider;
  }

  /**
   * Get provider for a specific feature
   */
  getProviderForFeature(featureId: string): AIProvider {
    this.ensureInitialized();

    const featureConfig = this.config.featureConfigs[featureId];
    if (featureConfig?.providerId) {
      const provider = this.providers.get(featureConfig.providerId);
      if (provider) return provider;
    }

    return this.getProvider();
  }

  /**
   * Generate structured output using the appropriate provider
   */
  async generateStructuredOutput<T>(
    featureId: string,
    request: AIRequest<T>
  ): Promise<AIResponse<T>> {
    const provider = this.getProviderForFeature(featureId);
    const featureConfig = this.config.featureConfigs[featureId];

    // Merge feature config with request
    const mergedRequest: AIRequest<T> = {
      ...request,
      model: request.model ?? featureConfig?.model ?? provider.config?.model,
      temperature: request.temperature ?? featureConfig?.temperature,
      maxOutputTokens: request.maxOutputTokens ?? featureConfig?.maxOutputTokens,
      timeoutMs: request.timeoutMs ?? featureConfig?.timeoutMs,
    };

    // Check capability requirements
    if (featureConfig?.requireStructuredOutput && !provider.supportsCapability("structuredOutput")) {
      throw new Error(`Provider ${provider.id} does not support structured output`);
    }

    let lastError: AIError | undefined;
    const maxAttempts = featureConfig?.maxRetries ?? this.config.maxRetries;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await provider.generateStructuredOutput<T>(mergedRequest);
        return {
          ...result,
          metadata: {
            model: result.metadata?.model ?? "",
            provider: result.metadata?.provider ?? "",
            usage: result.metadata?.usage,
            durationMs: result.metadata?.durationMs,
            routedVia: result.metadata?.routedVia,
            finishReason: result.metadata?.finishReason,
            attempt,
          },
        };
      } catch (error) {
        lastError = error as AIError;

        // Don't retry on non-recoverable errors
        if (!lastError.recoverable) {
          throw lastError;
        }

        // Try fallback provider on last attempt
if (attempt === maxAttempts && this.config.fallbackProviderIds.length > 0) {
           for (const fallbackId of this.config.fallbackProviderIds) {
             const fallback = this.providers.get(fallbackId);
             if (fallback && fallback !== provider) {
               try {
                 const result = await fallback.generateStructuredOutput<T>(mergedRequest);
                 return {
                   ...result,
                   metadata: {
                     model: result.metadata?.model ?? "",
                     provider: result.metadata?.provider ?? "",
                     usage: result.metadata?.usage,
                     durationMs: result.metadata?.durationMs,
                     routedVia: result.metadata?.routedVia,
                     finishReason: result.metadata?.finishReason,
                     attempt: attempt + 1,
                   },
                 };
               } catch {
                 // Continue to throw original error
               }
             }
           }
         }

        // Wait before retry with exponential backoff
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * 2 ** attempt, 10000)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Generate text using the appropriate provider
   */
  async generateText(
    featureId: string,
    request: AIRequest<string>
  ): Promise<AIResponse<string>> {
    const provider = this.getProviderForFeature(featureId);
    const featureConfig = this.config.featureConfigs[featureId];

    const mergedRequest: AIRequest<string> = {
      ...request,
      model: request.model ?? featureConfig?.model ?? provider.config?.model,
      temperature: request.temperature ?? featureConfig?.temperature,
      maxOutputTokens: request.maxOutputTokens ?? featureConfig?.maxOutputTokens,
      timeoutMs: request.timeoutMs ?? featureConfig?.timeoutMs,
    };

    return provider.generateText(mergedRequest);
  }

  /**
   * Stream text using the appropriate provider
   */
  async *streamText(
    featureId: string,
    request: AIRequest<string>
  ): AsyncIterable<AIStreamChunk<string>> {
    const provider = this.getProviderForFeature(featureId);
    const featureConfig = this.config.featureConfigs[featureId];

    if (!provider.supportsCapability("streaming")) {
      throw new Error(`Provider ${provider.id} does not support streaming`);
    }

    const mergedRequest: AIRequest<string> = {
      ...request,
      model: request.model ?? featureConfig?.model ?? provider.config?.model,
      temperature: request.temperature ?? featureConfig?.temperature,
      maxOutputTokens: request.maxOutputTokens ?? featureConfig?.maxOutputTokens,
      timeoutMs: request.timeoutMs ?? featureConfig?.timeoutMs,
      stream: true,
    };

    for await (const chunk of provider.streamText(mergedRequest)) {
      yield chunk;
    }
  }

  /**
   * Check health of all providers
   */
  async checkAllHealth(): Promise<Map<string, AIProviderStatus>> {
    this.ensureInitialized();

    const results = new Map<string, AIProviderStatus>();

    for (const [id, provider] of this.providers) {
      try {
        results.set(id, await provider.checkHealth());
      } catch (error) {
        results.set(id, {
          available: false,
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Get all available models across providers
   */
  async getAllModels(): Promise<Map<string, AIModelInfo[]>> {
    this.ensureInitialized();

    const results = new Map<string, AIModelInfo[]>();

    for (const [id, provider] of this.providers) {
      try {
        results.set(id, await provider.getModels());
      } catch (error) {
        console.error(`Failed to get models for ${id}:`, error);
        results.set(id, []);
      }
    }

    return results;
  }

  /**
   * Get list of available provider IDs
   */
  getAvailableProviders(): string[] {
    this.ensureInitialized();
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a feature has a valid provider configured
   */
  isFeatureConfigured(featureId: string): boolean {
    this.ensureInitialized();

    const featureConfig = this.config.featureConfigs[featureId];
    const providerId = featureConfig?.providerId ?? this.config.defaultProviderId;
    return this.providers.has(providerId);
  }

  /**
   * Get service configuration (without secrets)
   */
  getConfig(): Omit<AIServiceConfig, "providers"> & { providers: Omit<AIProviderConfig, "apiKeyRef">[] } {
    return {
      ...this.config,
      providers: this.config.providers.map(({ apiKeyRef, ...p }) => p),
    };
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      this.initialize();
    }
  }
}

/**
 * Create AI service from environment variables
 */
export function createAIServiceFromEnv(): AIService {
  const providers: AIProviderConfig[] = [];

  // OpenAI provider
  if (process.env.OPENAI_API_KEY || process.env.AI_API_KEY) {
    providers.push({
      id: "openai",
      name: "OpenAI",
      provider: "openai",
      enabled: true,
      apiKeyRef: process.env.AI_CREDENTIAL_REF ?? "OPENAI_API_KEY",
      baseUrl: process.env.AI_ENDPOINT ?? "https://api.openai.com/v1",
      model: process.env.AI_MODEL ?? "gpt-4o",
      organization: process.env.OPENAI_ORGANIZATION,
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 60000,
      maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 4096,
      temperature: Number(process.env.AI_TEMPERATURE) || 0.2,
    });
  }

  // FreeLLMAPI provider
  if (process.env.FREELLMAPI_API_KEY || process.env.FREELLMAPI_BASE_URL) {
    providers.push({
      id: "freellmapi",
      name: "FreeLLMAPI",
      provider: "freellmapi",
      enabled: true,
      apiKeyRef: "FREELLMAPI_API_KEY",
      baseUrl: process.env.FREELLMAPI_BASE_URL ?? "http://localhost:3001/v1",
      model: process.env.FREELLMAPI_MODEL ?? "auto",
      timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 60000,
      maxOutputTokens: Number(process.env.AI_MAX_OUTPUT_TOKENS) || 4096,
      temperature: Number(process.env.AI_TEMPERATURE) || 0.2,
    });
  }

  // Feature-specific configs
  const featureConfigs: Record<string, FeatureAIConfig> = {
    archify_generation: {
      featureId: "archify_generation",
      providerId: process.env.ARCHIFY_PROVIDER ?? "openai",
      model: process.env.ARCHIFY_MODEL,
      temperature: Number(process.env.ARCHIFY_TEMPERATURE) || 0.2,
      maxOutputTokens: Number(process.env.ARCHIFY_MAX_TOKENS) || 8192,
      timeoutMs: Number(process.env.ARCHIFY_TIMEOUT_MS) || 120000,
      requireStructuredOutput: true,
    },
    roadmap_generation: {
      featureId: "roadmap_generation",
      providerId: process.env.ROADMAP_PROVIDER ?? "openai",
      model: process.env.ROADMAP_MODEL,
      temperature: Number(process.env.ROADMAP_TEMPERATURE) || 0.5,
      maxOutputTokens: Number(process.env.ROADMAP_MAX_TOKENS) || 8192,
      requireStructuredOutput: true,
    },
    roadmap_summary: {
      featureId: "roadmap_summary",
      providerId: process.env.SUMMARY_PROVIDER ?? "openai",
      model: process.env.SUMMARY_MODEL,
      temperature: Number(process.env.SUMMARY_TEMPERATURE) || 0.3,
      maxOutputTokens: Number(process.env.SUMMARY_MAX_TOKENS) || 2048,
    },
    task_generation: {
      featureId: "task_generation",
      providerId: process.env.TASK_PROVIDER ?? "openai",
      model: process.env.TASK_MODEL,
      temperature: Number(process.env.TASK_TEMPERATURE) || 0.4,
      maxOutputTokens: Number(process.env.TASK_MAX_TOKENS) || 4096,
      requireStructuredOutput: true,
    },
  };

  return new AIService({
    providers,
    defaultProviderId: process.env.AI_DEFAULT_PROVIDER ?? (providers[0]?.id ?? "openai"),
    featureConfigs,
    fallbackProviderIds: process.env.AI_FALLBACK_PROVIDERS?.split(",").filter(Boolean) ?? [],
    requestTimeoutMs: Number(process.env.AI_TIMEOUT_MS) || 60000,
    maxRetries: Number(process.env.AI_MAX_RETRIES) || 3,
  });
}

// Singleton instance
let aiServiceInstance: AIService | null = null;

export function getAIService(): AIService {
  if (!aiServiceInstance) {
    aiServiceInstance = createAIServiceFromEnv();
  }
  return aiServiceInstance;
}

export function setAIService(service: AIService): void {
  aiServiceInstance = service;
}

export function resetAIService(): void {
  aiServiceInstance = null;
}