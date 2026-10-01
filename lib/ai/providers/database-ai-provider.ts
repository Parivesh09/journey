import { prisma } from "@/lib/prisma";
import { AIProviderDB } from "@/lib/ai/providers/ai-provider-db";
import { AIProviderRegistry } from "@/lib/ai/registry/provider-registry";
import { OpenAICompatibleProtocolAdapter } from "@/lib/ai/protocols/openai-compatible-protocol";
import { AnthropicMessagesProtocolAdapter } from "@/lib/ai/protocols/anthropic-messages-protocol";
import { AISecretService } from "@/lib/ai/secrets/ai-secret-service";
import { AIProviderError } from "@/lib/ai/types";

export interface AIProtocolAdapter {
  generateStructuredOutput<T>(options: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    options?: any;
  }): Promise<{ data: T; metadata: any }>;

  generateText(options: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    options?: any;
  }): Promise<{ data: string; metadata: any }>;

  streamText(options: {
    systemPrompt: string;
    userPrompt: string;
    model?: string;
    options?: any;
  }): AsyncIterable<{ data: string; done: boolean }>;
}

export interface AIProvider {
  id: string;
  name: string;
  slug: string;
  protocol: string;
  endpoint: string;
  model?: string;
  enabled: boolean;
  capabilities?: any;
  configuration?: any;
  secrets?: any;
  isSystem: boolean;
  isDefault: boolean;
}

export interface AIRequest<T = unknown> {
  systemPrompt: string;
  userPrompt: string;
  schema?: unknown;
  context?: T;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  model?: string;
  stream?: boolean;
}

export interface AIResponse<T = unknown> {
  data: T;
  metadata?: {
    model: string;
    provider: string;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
    };
    durationMs?: number;
    routedVia?: string;
    finishReason?: string;
    attempt?: number;
  };
}

export interface AIStreamChunk<T = unknown> {
  data: T;
  done: boolean;
  metadata?: AIResponse["metadata"];
}

export interface AIProviderCapabilities {
  structuredOutput: boolean;
  jsonMode: boolean;
  toolCalling: boolean;
  streaming: boolean;
  vision: boolean;
  maxContextTokens: number;
  supportedModels: string[];
}

export class DatabaseAIProvider implements AIProvider {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly protocol: string;
  readonly endpoint: string;
  readonly model?: string;
  readonly enabled: boolean;
  readonly capabilities?: AIProviderCapabilities;
  readonly configuration?: any;
  readonly secrets?: any;
  readonly isSystem: boolean;
  readonly isDefault: boolean;

  constructor(private dbProvider: any) {
    this.id = dbProvider.id;
    this.name = dbProvider.name;
    this.slug = dbProvider.slug;
    this.protocol = dbProvider.protocol;
    this.endpoint = dbProvider.endpoint;
    this.model = dbProvider.model;
    this.enabled = dbProvider.status === "ENABLED";
    this.capabilities = dbProvider.capabilities;
    this.configuration = dbProvider.configuration;
    this.secrets = dbProvider.secrets;
    this.isSystem = dbProvider.isSystem;
    this.isDefault = dbProvider.isDefault;
  }

  static async createFromSlug(slug: string): Promise<DatabaseAIProvider | null> {
    const dbProvider = await AIProviderDB.getProviderBySlug(slug);
    if (!dbProvider) {
      return null;
    }
    return new DatabaseAIProvider(dbProvider);
  }

  static async createFromId(id: string): Promise<DatabaseAIProvider | null> {
    const dbProvider = await AIProviderDB.getProvider(id);
    if (!dbProvider) {
      return null;
    }
    return new DatabaseAIProvider(dbProvider);
  }

  // Not memoized: the adapter embeds a decrypted per-user credential, so caching it
  // on this instance would hand one user's key to another. Construction is trivial.
  async getAdapter(userId: string): Promise<AIProtocolAdapter> {
    return await this.createAdapter(userId);
  }

  private async createAdapter(userId: string): Promise<AIProtocolAdapter> {
    const secret = await AISecretService.getProviderSecret(this.id, userId);

    if (!secret) {
      throw new AIProviderError("No API key found for provider", {
        code: "API_KEY_MISSING",
      });
    }

    const decryptedKey = await AISecretService.getDecryptedApiKey(this.id, userId);

    // Normalize protocol to lowercase for comparison
    const normalizedProtocol = this.protocol.toLowerCase();

    switch (normalizedProtocol) {
      case "openai_compatible":
        return await OpenAICompatibleProtocolAdapter.create({
          baseUrl: this.endpoint,
          apiKey: decryptedKey,
        });
      case "anthropic_messages":
        return await AnthropicMessagesProtocolAdapter.create({
          baseUrl: this.endpoint,
          apiKey: decryptedKey,
        });
      default:
        throw new AIProviderError(`Unsupported protocol: ${this.protocol}`, {
          code: "UNSUPPORTED_PROTOCOL",
        });
    }
  }

  async generateStructuredOutput<T>(
    userId: string,
    request: AIRequest<T>
  ): Promise<AIResponse<T>> {
    if (!this.enabled) {
      throw new AIProviderError("Provider is disabled", {
        code: "PROVIDER_DISABLED",
      });
    }

    const adapter = await this.getAdapter(userId);
    const startTime = Date.now();

    try {
      const result = await adapter.generateStructuredOutput<T>({
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        model: request.model ?? this.model,
        options: {
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          timeoutMs: request.timeoutMs,
        },
      });

      return {
        data: result.data,
        metadata: {
          model: result.metadata.model,
          provider: this.id,
          usage: result.metadata.usage,
          durationMs: Date.now() - startTime,
          attempt: 1,
        },
      };
    } catch (error) {
      throw this.createError("Structured output generation failed", error);
    }
  }

  async generateText(userId: string, request: AIRequest<string>): Promise<AIResponse<string>> {
    if (!this.enabled) {
      throw new AIProviderError("Provider is disabled", {
        code: "PROVIDER_DISABLED",
      });
    }

    const adapter = await this.getAdapter(userId);
    const startTime = Date.now();

    try {
      const result = await adapter.generateText({
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        model: request.model ?? this.model,
        options: {
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          timeoutMs: request.timeoutMs,
        },
      });

      return {
        data: result.data,
        metadata: {
          model: result.metadata.model,
          provider: this.id,
          usage: result.metadata.usage,
          durationMs: Date.now() - startTime,
          attempt: 1,
        },
      };
    } catch (error) {
      throw this.createError("Text generation failed", error);
    }
  }

  async *streamText(userId: string, request: AIRequest<string>): AsyncIterable<AIStreamChunk<string>> {
    if (!this.enabled) {
      throw new AIProviderError("Provider is disabled", {
        code: "PROVIDER_DISABLED",
      });
    }

    const adapter = await this.getAdapter(userId);

    try {
      for await (const chunk of adapter.streamText({
        systemPrompt: request.systemPrompt,
        userPrompt: request.userPrompt,
        model: request.model ?? this.model,
        options: {
          temperature: request.temperature,
          maxOutputTokens: request.maxOutputTokens,
          timeoutMs: request.timeoutMs,
        },
      })) {
        yield {
          data: chunk.data,
          done: chunk.done,
          metadata: {
            model: this.model,
            provider: this.id,
          },
        };
      }
    } catch (error) {
      throw this.createError("Streaming failed", error);
    }
  }

  private createError(message: string, error: unknown): AIProviderError {
    const err = new Error(message) as AIProviderError;
    err.provider = this.id;
    err.model = this.model;
    err.originalError = error instanceof Error ? error : undefined;

    if (error instanceof AIProviderError) {
      err.code = error.code;
      err.statusCode = error.statusCode;
      err.attempt = error.attempt;
      err.recoverable = error.recoverable;
      err.validationErrors = error.validationErrors;
    }

    return err;
  }

  async checkHealth(userId: string): Promise<{ available: boolean; latencyMs?: number; lastChecked: Date; error?: string }> {
    const startTime = Date.now();
    try {
      const adapter = await this.getAdapter(userId);
      
      // Try models endpoint first (lightweight check)
      const modelsResponse = await fetch(`${adapter.getBaseUrl()}models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${adapter.getApiKey()}`,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (modelsResponse.ok) {
        return {
          available: true,
          latencyMs: Date.now() - startTime,
          lastChecked: new Date(),
        };
      }

      // Fallback: try a simple completion with the configured model
      if (this.model) {
        await adapter.generateText({
          systemPrompt: "Test",
          userPrompt: "Test",
          model: this.model,
        });

        return {
          available: true,
          latencyMs: Date.now() - startTime,
          lastChecked: new Date(),
        };
      }

      // If no model configured, try without model
      await adapter.generateText({
        systemPrompt: "Test",
        userPrompt: "Test",
      });

      return {
        available: true,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        available: false,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getModels(): Promise<any[]> {
    // For now, return empty array as model discovery depends on protocol
    // TODO: Implement protocol-specific model discovery
    return [];
  }

  supportsModel(modelId: string): boolean {
    if (!this.capabilities?.supportedModels) {
      return true; // If no models are defined, assume all are supported
    }
    return this.capabilities.supportedModels.some(
      (m: string) => m === modelId || m.includes("*")
    );
  }

  supportsCapability(capability: keyof AIProviderCapabilities): boolean {
    if (!this.capabilities) {
      return false;
    }
    return this.capabilities[capability] === true;
  }
}
