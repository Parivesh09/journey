import type {
  AIProvider,
  AIProviderConfig,
  AIProviderCapabilities,
  AIModelInfo,
  AIProviderStatus,
  AIRequest,
  AIResponse,
  AIStreamChunk,
  AIError,
} from "@/lib/ai/types";

export interface FreeLLMAPIProviderConfig extends AIProviderConfig {
  provider: "freellmapi";
  baseUrl: string;
}

const DEFAULT_FREELLMAPI_CAPABILITIES: AIProviderCapabilities = {
  structuredOutput: true,
  jsonMode: true,
  toolCalling: true,
  streaming: true,
  vision: true,
  maxContextTokens: 128000,
  supportedModels: [
    "auto",
    "auto:fast",
    "auto:smart",
    "fusion",
    "gpt-4o",
    "gpt-4o-mini",
    "claude-3.5-sonnet",
    "claude-3.5-haiku",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "llama-3.1-70b",
    "llama-3.1-8b",
    "mixtral-8x7b",
    "qwen-2.5-72b",
    "deepseek-coder",
  ],
};

export class FreeLLMAPIProvider implements AIProvider {
  readonly id = "freellmapi";
  readonly name = "FreeLLMAPI";
  readonly capabilities: AIProviderCapabilities;
  readonly config: FreeLLMAPIProviderConfig;

  private apiKey: string;

  constructor(config: FreeLLMAPIProviderConfig) {
    this.config = config;
    this.capabilities = {
      ...DEFAULT_FREELLMAPI_CAPABILITIES,
      ...config.capabilities,
    };

    const key = process.env[config.apiKeyRef];
    if (!key) {
      throw new Error(`Missing FreeLLMAPI credential: ${config.apiKeyRef}`);
    }
    this.apiKey = key;
  }

  private async request<T>(
    endpoint: string,
    body: unknown,
    options: {
      method?: string;
      stream?: boolean;
      timeoutMs?: number;
    } = {}
  ): Promise<Response> {
    const timeout = options.timeoutMs ?? this.config.timeoutMs ?? 60000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: options.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw this.createError("Request timed out", { recoverable: true });
      }
      throw this.createError(`Network error: ${error}`, { recoverable: true });
    } finally {
      clearTimeout(timer);
    }
  }

  private createError(message: string, options: Partial<AIError> = {}): AIError {
    const err = new Error(message) as AIError;
    err.provider = this.id;
    err.model = this.config.model;
    Object.assign(err, options);
    return err;
  }

  async generateStructuredOutput<T>(
    request: AIRequest<T>
  ): Promise<AIResponse<T>> {
    const model = request.model ?? this.config.model;
    if (!model) {
      throw this.createError("No model specified", { code: "NO_MODEL" });
    }

    const response = await this.request("/v1/chat/completions", {
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      temperature: request.temperature ?? this.config.temperature ?? 0.2,
      max_tokens: request.maxOutputTokens ?? this.config.maxOutputTokens ?? 4096,
      response_format: { type: "json_object" },
      stream: false,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw this.createError("No content in response");
    }

    let parsed: T;
    try {
      parsed = JSON.parse(content) as T;
    } catch {
      throw this.createError("Invalid JSON in response", { recoverable: true });
    }

    return {
      data: parsed,
      metadata: {
        model,
        provider: this.id,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
        finishReason: data.choices?.[0]?.finish_reason,
        routedVia: response.headers.get("x-routed-via") ?? undefined,
      },
    };
  }

  async generateText(request: AIRequest<string>): Promise<AIResponse<string>> {
    const model = request.model ?? this.config.model;
    if (!model) {
      throw this.createError("No model specified", { code: "NO_MODEL" });
    }

    const response = await this.request("/v1/chat/completions", {
      model,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      max_tokens: request.maxOutputTokens ?? this.config.maxOutputTokens ?? 4096,
      stream: false,
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return {
      data: content,
      metadata: {
        model,
        provider: this.id,
        usage: {
          inputTokens: data.usage?.prompt_tokens,
          outputTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
        finishReason: data.choices?.[0]?.finish_reason,
        routedVia: response.headers.get("x-routed-via") ?? undefined,
      },
    };
  }

  async *streamText(
    request: AIRequest<string>
  ): AsyncIterable<AIStreamChunk<string>> {
    const model = request.model ?? this.config.model;
    if (!model) {
      throw this.createError("No model specified", { code: "NO_MODEL" });
    }

    const response = await this.request(
      "/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        max_tokens: request.maxOutputTokens ?? this.config.maxOutputTokens ?? 4096,
        stream: true,
      },
      { stream: true }
    );

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw this.createError("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            yield { data: "", done: true };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield {
                data: content,
                done: false,
              };
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async checkHealth(): Promise<AIProviderStatus> {
    const start = Date.now();
    try {
      const response = await this.request("/v1/models", {}, { timeoutMs: 10000 });
      const latency = Date.now() - start;
      return {
        available: response.ok,
        latencyMs: latency,
        lastChecked: new Date(),
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        available: false,
        latencyMs: Date.now() - start,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async getModels(): Promise<AIModelInfo[]> {
    const response = await this.request("/v1/models", {});
    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    const data = await response.json();
    return (data.data ?? []).map((model: any) => ({
      id: model.id,
      name: model.id,
      provider: this.id,
      capabilities: this.capabilities,
      maxContextTokens: this.capabilities.maxContextTokens,
    }));
  }

  supportsModel(modelId: string): boolean {
    // FreeLLMAPI supports auto:* routing strategies and any model in catalog
    if (modelId.startsWith("auto") || modelId === "fusion") {
      return true;
    }
    return this.capabilities.supportedModels.some(
      (m) => m === modelId || m.includes("*")
    );
  }

  supportsCapability(capability: keyof AIProviderCapabilities): boolean {
    return this.capabilities[capability] === true;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: response.statusText } };
    }

    const message = errorData.error?.message ?? response.statusText;
    const err = this.createError(
      `FreeLLMAPI error: ${response.status} ${message}`,
      {
        statusCode: response.status,
        code: errorData.error?.code,
        recoverable: response.status >= 500 || response.status === 429,
      }
    );
    throw err;
  }
}

/**
 * Create FreeLLMAPI provider from config
 */
export function createFreeLLMAPIProvider(
  config: FreeLLMAPIProviderConfig
): FreeLLMAPIProvider {
  return new FreeLLMAPIProvider(config);
}