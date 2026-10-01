"use client";

import { Card, CardHeader, CardContent } from "@/app/components/ui";
import { ProviderRow } from "./ProviderRow";
import { Provider } from "./types";

interface DefaultProviderCardProps {
  providers: Provider[];
  defaultProvider: Provider | null;
  onSetDefault: (providerId: string) => void;
  onEdit: (provider: Provider) => void;
  onTest: (providerId: string) => void;
  onDelete: (providerId: string) => void;
}

export function DefaultProviderCard({
  providers,
  defaultProvider,
  onSetDefault,
  onEdit,
  onTest,
  onDelete,
}: DefaultProviderCardProps) {
  return (
    <Card className="mt-6">
      <CardHeader>
        <h3 className="text-lg font-semibold">Default AI Provider</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {providers.length > 0 ? (
          <>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                {defaultProvider ? (
                  <>
                    <span className="font-medium">
                      {defaultProvider.name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({defaultProvider.slug})
                    </span>
                    {defaultProvider.isDefault && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Default Provider
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    No default provider configured
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={defaultProvider?.id || ""}
                  onChange={(e) => {
                    if (e.target.value) {
                      onSetDefault(e.target.value);
                    }
                  }}
                  className="input w-full max-w-xs"
                >
                  <option value="">Select default provider...</option>
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.slug})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider Status Grid */}
            <div className="grid gap-4">
              {providers.map((provider) => (
                <ProviderRow
                  key={provider.id}
                  provider={provider}
                  onEdit={onEdit}
                  onTest={onTest}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No providers configured yet. Add your first provider below.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
