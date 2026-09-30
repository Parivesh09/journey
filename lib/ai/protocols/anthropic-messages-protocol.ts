import { AIProtocolAdapter } from "./openai-compatible-protocol";

export class AnthropicMessagesProtocolAdapter extends AIProtocolAdapter {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { baseUrl: string; apiKey: string }) {
    super();
    this.baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl : config.baseUrl + "/";
    this.apiKey = config.apiKey;
  }

  static async create(config: {
    baseUrl: string;
    apiKey: string;
  }): Promise<AnthropicMessagesProtocolAdapter> {
    return new AnthropicMessagesProtocolAdapter(config);
  }

  async generateStructuredOutput<T>(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: any
  ): Promise<{ data: T; metadata: any }> {
    const response = await fetch(`${this.baseUrl}v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: options?.temperature ?? 0.2,
      }),
      signal: options?.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No content in response");
    }

    let parsed: T;
    try {
      parsed = JSON.parse(content) as T;
    } catch {
      // If it's not valid JSON, return as text
      parsed = content as unknown as T;
    }

    return {
      data: parsed,
      metadata: {
        model: data.model,
        usage: data.usage,
        stopReason: data.stop_reason,
      },
    };
  }

  async generateText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: any
  ): Promise<{ data: string; metadata: any }> {
    const response = await fetch(`${this.baseUrl}v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: options?.temperature ?? 0.7,
      }),
      signal: options?.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text ?? "";

    return {
      data: content,
      metadata: {
        model: data.model,
        usage: data.usage,
        stopReason: data.stop_reason,
      },
    };
  }

  async *streamText(
    systemPrompt: string,
    userPrompt: string,
    model?: string,
    options?: any
  ): AsyncIterable<{ data: string; done: boolean }> {
    const response = await fetch(`${this.baseUrl}v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-stream": "true",
      },
      body: JSON.stringify({
        model: model || "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature: options?.temperature ?? 0.7,
      }),
      signal: options?.timeoutMs ? AbortSignal.timeout(options.timeoutMs) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Anthropic's streaming implementation is more complex
    // This is a simplified version
    const data = await response.json();
    const content = data.content?.[0]?.text ?? "";

    yield { data: content, done: true };
  }
}
