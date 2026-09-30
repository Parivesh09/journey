import type { ArchifyDiagram } from "@/lib/types/archify";
import type { RoadmapVisualizationContext } from "@/lib/types/visualization";
import type { RoadmapVisualizationConfig } from "@/lib/types/archify";

/**
 * Provider capability flags
 */
export interface AIProviderCapabilities {
  structuredOutput: boolean;
  jsonMode: boolean;
  toolCalling: boolean;
  streaming: boolean;
  vision: boolean;
  maxContextTokens: number;
  supportedModels: string[];
}

/**
 * Provider health/status
 */
export interface AIProviderStatus {
  available: boolean;
  latencyMs?: number;
  lastChecked: Date;
  error?: string;
}

/**
 * Model capability info
 */
export interface AIModelInfo {
  id: string;
  name: string;
  provider: string;
  capabilities: AIProviderCapabilities;
  maxContextTokens: number;
  pricing?: {
    inputPer1k?: number;
    outputPer1k?: number;
  };
}

/**
 * Generic AI request types
 */
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

// Backward compatibility aliases
export type StructuredGenerationRequest<T> = AIRequest<T>;
export type StructuredGenerationResult<T> = AIResponse<T>;

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

/**
 * Provider interface
 */
export interface AIProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: AIProviderCapabilities;
  readonly config: AIProviderConfig;

  /**
   * Generate structured JSON output
   */
  generateStructuredOutput<T>(
    request: AIRequest<T>
  ): Promise<AIResponse<T>>;

  /**
   * Generate text completion
   */
  generateText(request: AIRequest<string>): Promise<AIResponse<string>>;

  /**
   * Stream text completion
   */
  streamText(request: AIRequest<string>): AsyncIterable<AIStreamChunk<string>>;

  /**
   * Check provider health
   */
  checkHealth(): Promise<AIProviderStatus>;

  /**
   * Get available models
   */
  getModels(): Promise<AIModelInfo[]>;

  /**
   * Check if a model is supported
   */
  supportsModel(modelId: string): boolean;

  /**
   * Check if provider supports a capability
   */
  supportsCapability(capability: keyof AIProviderCapabilities): boolean;
}

/**
 * Provider configuration
 */
export interface AIProviderConfig {
  id: string;
  name: string;
  provider: "openai" | "freellmapi" | "custom";
  enabled: boolean;
  apiKeyRef: string; // Environment variable name for the API key
  baseUrl?: string;
  model?: string;
  organization?: string;
  project?: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  temperature?: number;
  maxRetries?: number;
  capabilities?: Partial<AIProviderCapabilities>;
  metadata?: Record<string, unknown>;
}

/**
 * Feature-specific AI configuration
 */
export interface FeatureAIConfig {
  featureId: string;
  providerId: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
  requireStructuredOutput?: boolean;
  requireStreaming?: boolean;
  requireToolCalling?: boolean;
  requireVision?: boolean;
  maxRetries?: number;
}

/**
 * Unified AI service config
 */
export interface AIServiceConfig {
  providers: AIProviderConfig[];
  defaultProviderId: string;
  featureConfigs: Record<string, FeatureAIConfig>;
  fallbackProviderIds: string[];
  requestTimeoutMs: number;
  maxRetries: number;
}

/**
 * Error types
 */
export interface AIError extends Error {
  code?: string;
  statusCode?: number;
  provider?: string;
  model?: string;
  attempt?: number;
  recoverable?: boolean;
  validationErrors?: unknown[];
  originalError?: Error;
}

export class AIProviderError extends Error implements AIError {
  code?: string;
  statusCode?: number;
  provider?: string;
  model?: string;
  attempt?: number;
  recoverable?: boolean;
  validationErrors?: unknown[];
  originalError?: Error;

  constructor(
    message: string,
    options: Partial<AIError> = {}
  ) {
    super(message);
    this.name = "AIProviderError";
    Object.assign(this, options);
    Error.captureStackTrace(this, AIProviderError);
  }
}

/**
 * Generation context for Archify
 */
export interface GenerationContext {
  roadmapId: string;
  diagramType: string;
  roadmapContext: RoadmapVisualizationContext;
  config: RoadmapVisualizationConfig;
  promptVersion: string;
  generationVersion: string;
}

/**
 * Generation options
 */
export interface GenerationOptions {
  maxAttempts?: number;
  repairAttempts?: number;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
}