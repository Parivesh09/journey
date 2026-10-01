"use client";

import { useAIProviders } from "@/lib/ai/hooks/use-ai-providers";
import { useMemo } from "react";

export interface AIProviderSettings {
  providers: ReturnType<typeof useAIProviders>;
  systemProviders: any[];
  customProviders: any[];
  defaultProvider: any;
  canDeleteProvider: (providerId: string) => Promise<boolean>;
  refreshProviders: () => Promise<void>;
}

export function useAIProviderSettings(): AIProviderSettings {
  const providersHook = useAIProviders();

  const systemProviders = useMemo(() => 
    providersHook.providers.filter((p) => p.isSystem),
    [providersHook.providers]
  );

  const customProviders = useMemo(() => 
    providersHook.providers.filter((p) => !p.isSystem),
    [providersHook.providers]
  );

  const defaultProvider = useMemo(() => 
    providersHook.providers.find((p) => p.isDefault),
    [providersHook.providers]
  );

  const canDeleteProvider = async (providerId: string): Promise<boolean> => {
    if (providersHook.providers.find((p) => p.id === providerId)?.isSystem) {
      return false;
    }
    
    // Check if provider is referenced by any diagrams
    // This would require additional API calls
    return true;
  };

  const refreshProviders = async () => {
    await providersHook.loadProviders();
  };

  return {
    providers: providersHook,
    systemProviders,
    customProviders,
    defaultProvider,
    canDeleteProvider,
    refreshProviders,
  };
}
