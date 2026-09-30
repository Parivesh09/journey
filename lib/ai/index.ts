// AI Provider Service Layer
// This module provides a unified interface for managing AI providers, protocols, and encryption

import { AISecretService } from "@/lib/ai/secrets/ai-secret-service";
import { AIProviderDB } from "@/lib/ai/providers/database-ai-provider";
import { AIProviderRegistry } from "@/lib/ai/registry/provider-registry";
import { AIProvider } from "@/lib/ai/types/ai-provider-types";
import { DatabaseAIProvider } from "@/lib/ai/providers/database-ai-provider";

export { AISecretService };
export { AIProviderDB };
export { AIProviderRegistry };
export { DatabaseAIProvider };
export { AIProvider };

// Export encryption utilities
export { APIKeyEncryption } from "@/lib/ai/encryption/api-key-encryption";

// Export protocol adapters
export { OpenAICompatibleProtocolAdapter } from "@/lib/ai/protocols/openai-compatible-protocol";
export { AnthropicMessagesProtocolAdapter } from "@/lib/ai/protocols/anthropic-messages-protocol";

// Export types
export { AIProviderCapabilities } from "@/lib/ai/types/ai-provider-types";
export { AIProtocol } from "@/lib/ai/types/ai-provider-types";

// Re-export existing provider types for compatibility
export type { AIRequest, AIResponse, AIStreamChunk, AIError } from "@/lib/ai/types";
