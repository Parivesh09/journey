"use client";

import { useState, useEffect } from "react";
import { aiProviderService } from "@/lib/ai/ai-provider-service";

export interface AIProviderUI {
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
  health?: {
    available: boolean;
    latencyMs?: number;
    error?: string;
  };
}

export function useAIProviders() {
  const [providers, setProviders] = useState<AIProviderUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const allProviders = await aiProviderService.getAllProviders();
      
      const providerUIs: AIProviderUI[] = await Promise.all(
        allProviders.map(async (provider) => {
          const hasApiKey = await aiProviderService.getProviderSecret(provider.id);
          let health = undefined;
          
          if (provider.enabled) {
            health = await aiProviderService.testConnection(provider.id);
          }
          
          return {
            id: provider.id,
            name: provider.name,
            slug: provider.slug,
            protocol: provider.protocol,
            endpoint: provider.endpoint,
            model: provider.model,
            enabled: provider.enabled,
            isDefault: provider.isDefault,
            isSystem: provider.isSystem,
            hasApiKey: !!hasApiKey,
            health,
          };
        })
      );
      
      setProviders(providerUIs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  };

  const createProvider = async (config: any) => {
    try {
      const newProvider = await aiProviderService.createProvider(config);
      await loadProviders();
      return newProvider;
    } catch (err) {
      throw err;
    }
  };

  const updateProvider = async (id: string, updates: any) => {
    try {
      await aiProviderService.updateProvider(id, updates);
      await loadProviders();
    } catch (err) {
      throw err;
    }
  };

  const deleteProvider = async (id: string) => {
    try {
      await aiProviderService.deleteProvider(id);
      await loadProviders();
    } catch (err) {
      throw err;
    }
  };

  const updateProviderSecret = async (providerId: string, apiKey: string) => {
    try {
      await aiProviderService.updateProviderSecret(providerId, apiKey);
      await loadProviders();
    } catch (err) {
      throw err;
    }
  };

  const setDefaultProvider = async (providerId: string) => {
    try {
      await aiProviderService.setDefaultProvider(providerId);
      await loadProviders();
    } catch (err) {
      throw err;
    }
  };

  const testProviderConnection = async (providerId: string) => {
    try {
      const health = await aiProviderService.testConnection(providerId);
      setProviders((prev) =>
        prev.map((p) =>
          p.id === providerId ? { ...p, health } : p
        )
      );
      return health;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  return {
    providers,
    loading,
    error,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    updateProviderSecret,
    setDefaultProvider,
    testProviderConnection,
  };
}
