import { AIProtocol } from "../types/ai-provider-types";

export class AIProtocolAdapter {
  static async create(config: any): Promise<AIProtocolAdapter> {
    throw new Error("Protocol adapters must be implemented by specific providers");
  }

  async generateStructuredOutput<T>(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: any
  ): Promise<{ data: T; metadata: any }> {
    throw new Error("generateStructuredOutput not implemented");
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: any
  ): Promise<{ data: string; metadata: any }> {
    throw new Error("generateText not implemented");
  }

  async streamText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: any
  ): AsyncIterable<{ data: string; done: boolean }> {
    throw new Error("streamText not implemented");
  }

  static getSupportedProtocols(): string[] {
    return ["openai_compatible", "anthropic_messages", "gemini"];
  }

  static isProtocolSupported(protocol: string): boolean {
    return this.getSupportedProtocols().includes(protocol);
  }
}

export class OpenAICompatibleProtocolAdapter extends AIProtocolAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    super();
    this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl : config.baseUrl + "/";
    this.apiKey = config.apiKey;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getApiKey(): string {
    return this.apiKey;
  }

  static async create(config: {
    baseUrl: string;
    apiKey: string;
  }): Promise<OpenAICompatibleProtocolAdapter> {
    return new OpenAICompatibleProtocolAdapter(config);
  }

  async generateStructuredOutput<T>(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      timeoutMs?: number;
    }
  ): Promise<{ data: T; metadata: any }> {
    const response = await fetch(`${this.baseUrl}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.2,
        max_tokens: options?.maxOutputTokens ?? 4096,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: options?.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });

    if (!response.ok) {
      let errorDetail = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorDetail += ` - ${errorData.error.message}`;
        } else if (errorData.message) {
          errorDetail += ` - ${errorData.message}`;
        }
      } catch {
        // Ignore JSON parse error
      }
      throw new Error(errorDetail);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in response");
    }

    let parsed: T;
    try {
      parsed = JSON.parse(content) as T;
    } catch {
      throw new Error("Invalid JSON in response");
    }

    return {
      data: parsed,
      metadata: {
        model: data.model,
        usage: data.usage,
        finishReason: data.choices?.[0]?.finish_reason,
      },
    };
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      timeoutMs?: number;
    }
  ): Promise<{ data: string; metadata: any }> {
    const response = await fetch(`${this.baseUrl}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxOutputTokens ?? 4096,
        stream: false,
      }),
      signal: options?.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });

    if (!response.ok) {
      let errorDetail = `API request failed: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error?.message) {
          errorDetail += ` - ${errorData.error.message}`;
        } else if (errorData.message) {
          errorDetail += ` - ${errorData.message}`;
        }
      } catch {
        // Ignore JSON parse error
      }
      throw new Error(errorDetail);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return {
      data: content,
      metadata: {
        model: data.model,
        usage: data.usage,
        finishReason: data.choices?.[0]?.finish_reason,
      },
    };
  }

  async *streamText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: {
      temperature?: number;
      maxOutputTokens?: number;
      timeoutMs?: number;
    }
  ): AsyncIterable<{ data: string; done: boolean }> {
    const response = await fetch(`${this.baseUrl}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxOutputTokens ?? 4096,
        stream: true,
      }),
      signal: options?.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
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
              yield { data: content, done: false };
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
}
