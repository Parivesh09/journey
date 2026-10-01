"use client";

import { GearIcon, MoonIcon } from "@/app/components/ui";
import { Provider } from "./types";

interface ProviderRowProps {
  provider: Provider;
  onEdit: (provider: Provider) => void;
  onTest: (providerId: string) => void;
  onDelete: (providerId: string) => void;
}

export function ProviderRow({
  provider,
  onEdit,
  onTest,
  onDelete,
}: ProviderRowProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {provider.protocol === "openai_compatible" && (
            <GearIcon className="h-5 w-5 text-primary" />
          )}
          {provider.protocol === "anthropic_messages" && (
            <MoonIcon className="h-5 w-5 text-accent" />
          )}
        </div>
        <div>
          <span className="font-medium">{provider.name}</span>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="capitalize">
              {provider.protocol}
            </span>
            {provider.isDefault && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                Default
              </span>
            )}
          </div>
          {provider.model && (
            <div className="text-sm text-muted-foreground mt-1">
              Model: {provider.model}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span
          className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${provider.enabled ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}
        `}
        >
          {provider.enabled ? "Enabled" : "Disabled"}
        </span>
        {provider.hasApiKey && (
          <>
            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
              ✓ Configured
            </span>
            <button
              onClick={() => onEdit(provider)}
              className="ml-2 text-sm text-primary hover:text-primary/80"
            >
              Edit
            </button>
          </>
        )}
        {!provider.hasApiKey && (
          <button
            onClick={() => onEdit(provider)}
            className="text-sm text-primary hover:text-primary/80"
          >
            Set API Key
          </button>
        )}
        {provider.health && provider.health.available !== undefined && (
          <>
            {provider.health.available ? (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/20 text-success">
                Connected
              </span>
            ) : (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive">
                Disconnected
              </span>
            )}
            {!provider.health.available &&
              provider.health.error && (
                <span
                  className="ml-2 text-xs text-destructive"
                  title={provider.health.error}
                >
                  ⚠️
                </span>
              )}
          </>
        )}
        <button
          onClick={() => onTest(provider.id)}
          className="text-xs text-primary hover:text-primary/80"
        >
          Test
        </button>
        {!provider.isSystem && (
          <button
            onClick={() => onDelete(provider.id)}
            className="text-xs text-destructive hover:text-destructive/80"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
