import { AIProtocol } from "../types/ai-provider-types";

export interface AIProviderCapabilities {
  structuredOutput: boolean;
  jsonMode: boolean;
  toolCalling: boolean;
  streaming: boolean;
  vision: boolean;
  maxContextTokens: number;
  supportedModels: string[];
}

export interface AIProviderDefinition {
  id: string;
  slug: string;
  name: string;
  description?: string;
  type: "SYSTEM" | "CUSTOM";
  protocol: AIProtocol;
  capabilities: AIProviderCapabilities;
  endpoint?: string;
  apiKeyRequired: boolean;
  supportsModelDiscovery: boolean;
  documentationUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProvider {
  id: string;
  name: string;
  slug: string;
  type: "SYSTEM" | "CUSTOM";
  protocol: AIProtocol;
  status: "ENABLED" | "DISABLED";
  endpoint: string;
  model?: string;
  capabilities?: AIProviderCapabilities;
  configuration?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  isDefault: boolean;
  isSystem: boolean;
  isManagedByEnv: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIProviderSecret {
  id: string;
  providerId: string;
  encryptedApiKey: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchifyDiagram {
  id: string;
  roadmapId: string;
  diagramType: string;
  sourceJson: unknown;
  sourceHash: string;
  roadmapVersion: string;
  generationVersion: string;
  promptVersion: string;
  status: string;
  errorMetadata?: unknown;
  renderedHtml?: string;
  providerId?: string;
  modelUsed?: string;
  generatedAt: Date;
  updatedAt: Date;
}
