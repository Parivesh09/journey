export interface Provider {
  id: string;
  name: string;
  slug: string;
  protocol: string;
  endpoint: string;
  model?: string;
  enabled: boolean;
  isDefault: boolean;
  isSystem: boolean;
  hasApiKey: boolean;
  capabilities?: Record<string, unknown>;
  configuration?: Record<string, unknown>;
  health?: {
    available: boolean;
    latencyMs?: number;
    error?: string;
  };
}

export interface ProviderFormData {
  name: string;
  slug: string;
  protocol: string;
  endpoint: string;
  model?: string;
  isDefault: boolean;
  description?: string;
}

export interface TestResult {
  providerId: string | null;
  available: boolean;
  message: string;
  loading: boolean;
}
