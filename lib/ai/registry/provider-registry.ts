import { AIProtocol } from "../types/ai-provider-types";

export interface AIProviderDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: "SYSTEM" | "CUSTOM";
  protocol: AIProtocol;
  capabilities: any;
  endpoint?: string;
  apiKeyRequired: boolean;
  supportsModelDiscovery: boolean;
  documentationUrl?: string;
  metadata?: Record<string, unknown>;
}

export class AIProviderRegistry {
  private static definitions: Map<string, AIProviderDefinition> = new Map();

  static initialize() {
    this.registerSystemProviders();
  }

  private static registerSystemProviders() {
    // OpenAI provider definition
    const openaiDefinition: AIProviderDefinition = {
      id: "openai-def",
      slug: "openai",
      name: "OpenAI",
      description: "Official OpenAI API provider supporting GPT models",
      type: "SYSTEM",
      protocol: "openai_compatible",
      capabilities: {
        structuredOutput: true,
        jsonMode: true,
        toolCalling: true,
        streaming: true,
        vision: true,
        maxContextTokens: 128000,
        supportedModels: [
          "gpt-4o",
          "gpt-4o-mini",
          "gpt-4-turbo",
          "gpt-4",
          "gpt-3.5-turbo",
          "o1-preview",
          "o1-mini",
        ],
      },
      endpoint: "https://api.openai.com/v1",
      apiKeyRequired: true,
      supportsModelDiscovery: true,
      documentationUrl: "https://platform.openai.com/docs/api-reference",
    };
    this.definitions.set(openaiDefinition.slug, openaiDefinition);

    // FreeLLMAPI provider definition
    const freellmapiDefinition: AIProviderDefinition = {
      id: "freellmapi-def",
      slug: "freellmapi",
      name: "FreeLLMAPI",
      description: "FreeLLMAPI unified API for accessing multiple AI models",
      type: "SYSTEM",
      protocol: "openai_compatible",
      capabilities: {
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
      },
      endpoint: "http://localhost:3001/v1",
      apiKeyRequired: true,
      supportsModelDiscovery: true,
    };
    this.definitions.set(freellmapiDefinition.slug, freellmapiDefinition);

    // Custom provider definition (for user-created providers)
    const customDefinition: AIProviderDefinition = {
      id: "custom-def",
      slug: "custom",
      name: "Custom Provider",
      description: "User-defined AI provider with custom endpoint",
      type: "CUSTOM",
      protocol: "openai_compatible",
      capabilities: {
        structuredOutput: false,
        jsonMode: false,
        toolCalling: false,
        streaming: false,
        vision: false,
        maxContextTokens: 4096,
        supportedModels: [],
      },
      endpoint: "",
      apiKeyRequired: false,
      supportsModelDiscovery: false,
    };
    this.definitions.set(customDefinition.slug, customDefinition);
  }

  static getDefinition(slug: string): AIProviderDefinition | undefined {
    return this.definitions.get(slug);
  }

  static getAllDefinitions(): AIProviderDefinition[] {
    return Array.from(this.definitions.values());
  }

  static getSystemDefinitions(): AIProviderDefinition[] {
    return Array.from(this.definitions.values()).filter(
      (def) => def.type === "SYSTEM"
    );
  }

  static getCustomDefinition(): AIProviderDefinition {
    return this.definitions.get("custom")!;
  }

  static getDefinitionByProtocol(
    protocol: string
  ): AIProviderDefinition | undefined {
    return Array.from(this.definitions.values()).find(
      (def) => def.protocol === protocol
    );
  }

  static isSystemProvider(slug: string): boolean {
    const definition = this.definitions.get(slug);
    return definition?.type === "SYSTEM" || false;
  }

  static validateDefinition(definition: Partial<AIProviderDefinition>): string[] {
    const errors: string[] = [];

    if (!definition.slug) {
      errors.push("Slug is required");
    } else if (this.definitions.has(definition.slug)) {
      errors.push(`Slug '${definition.slug}' is already in use`);
    }

    if (!definition.name) {
      errors.push("Name is required");
    }

    if (!definition.type) {
      errors.push("Type is required");
    }

    if (!definition.protocol) {
      errors.push("Protocol is required");
    }

    if (!definition.endpoint) {
      errors.push("Endpoint is required");
    }

    return errors;
  }
}
