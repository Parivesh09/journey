export * from "@/lib/ai/types";
export * from "@/lib/ai/providers/openai";
export * from "@/lib/ai/providers/freellmapi";
export * from "@/lib/ai/service";

import type {
  AIProvider,
  AIProviderConfig,
  StructuredGenerationRequest,
  StructuredGenerationResult,
  AIError,
} from "@/lib/ai/types";

export type {
  AIProvider,
  AIProviderConfig,
  StructuredGenerationRequest,
  StructuredGenerationResult,
  AIError,
};

export { OpenAIProvider, createOpenAIProvider } from "@/lib/ai/providers/openai";
export { FreeLLMAPIProvider, createFreeLLMAPIProvider } from "@/lib/ai/providers/freellmapi";
export { AIService, createAIServiceFromEnv, getAIService, setAIService, resetAIService } from "@/lib/ai/service";