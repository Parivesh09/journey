"use client";

import { useState, useEffect } from "react";
import {
  SectionHead,
  PrimaryButton,
  Card,
  CardHeader,
  CardContent,
  Input,
  Label,
  Caption,
  GearIcon,
  MoonIcon,
  Dialog,
  SecondaryButton,
} from "@/app/components/ui";

interface Provider {
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

export function AIProviderSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<{
    providerId: string | null;
    available: boolean;
    message: string;
    loading: boolean;
  } | null>(null);

  // Derive default provider from providers state
  const defaultProvider = providers.find((p) => p.isDefault) || null;

  const [formData, setFormData] = useState<{
    name: string;
    slug: string;
    protocol: string;
    endpoint: string;
    model?: string;
    isDefault: boolean;
    description?: string;
  }>({
    name: "",
    slug: "",
    protocol: "openai_compatible",
    endpoint: "",
    model: "",
    isDefault: false,
    description: "",
  });

  // Fetch all providers
  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/ai-providers", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch providers: ${response.status}`);
      }

      const data = await response.json();
      setProviders(data.providers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load providers");
      console.error("Error fetching AI providers:", err);
    } finally {
      setLoading(false);
    }
  }

  // Create a new provider
  async function handleCreateProvider(e: React.FormEvent) {
    e.preventDefault();

    try {
      const response = await fetch("/api/ai-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          protocol: formData.protocol,
          endpoint: formData.endpoint,
          model: formData.model || undefined,
          capabilities: getCapabilitiesForProtocol(formData.protocol),
          configuration: {},
          metadata: { description: formData.description },
          isDefault: formData.isDefault,
          isSystem: false,
          isManagedByEnv: false,
          apiKey: newApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create provider");
      }

      // Reset form
      setIsDialogOpen(false);
      setEditingProvider(null);
      setFormData({
        name: "",
        slug: "",
        protocol: "openai_compatible",
        endpoint: "",
        model: "",
        isDefault: false,
        description: "",
      });
      setNewApiKey("");
      setShowApiKey({});

      // Refresh providers
      await fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create provider",
      );
      console.error("Error creating AI provider:", err);
    }
  }

  // Update an existing provider
  async function handleUpdateProvider(e: React.FormEvent) {
    e.preventDefault();

    if (!editingProvider) return;

    try {
      const response = await fetch(`/api/ai-providers/${editingProvider.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          protocol: formData.protocol,
          endpoint: formData.endpoint,
          model: formData.model || undefined,
          capabilities: editingProvider.capabilities, // Keep existing capabilities
          configuration: editingProvider.configuration || {},
          metadata: { description: formData.description || "" },
          isDefault: formData.isDefault,
          // isSystem and isManagedByEnv should not be changed via UI for system providers
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update provider");
      }

      // Update API key if provided
      if (newApiKey.trim() !== "") {
        const keyResponse = await fetch(
          `/api/ai-providers/${editingProvider.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify({
              apiKey: newApiKey,
            }),
          },
        );

        if (!keyResponse.ok) {
          const errorData = await keyResponse.json();
          throw new Error(errorData.error || "Failed to update API key");
        }
      }

      // Reset form
      setIsDialogOpen(false);
      setEditingProvider(null);
      setFormData({
        name: "",
        slug: "",
        protocol: "openai_compatible",
        endpoint: "",
        model: "",
        isDefault: false,
        description: "",
      });
      setNewApiKey("");
      setShowApiKey({});

      // Refresh providers
      await fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update provider",
      );
      console.error("Error updating AI provider:", err);
    }
  }

  // Delete a provider
  async function handleDeleteProvider(providerId: string) {
    if (
      !window.confirm(
        "Are you sure you want to delete this provider? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/ai-providers/${providerId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete provider");
      }

      // Refresh providers
      await fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete provider",
      );
      console.error("Error deleting AI provider:", err);
    }
  }

  // Test provider connection
  async function handleTestProvider(providerId: string) {
    // Set test result to loading state
    setTestResult({
      providerId,
      available: false,
      message: "Testing connection...",
      loading: true,
    });
    
    try {
      const response = await fetch(`/api/ai-providers/${providerId}/test`, {
        method: "POST",
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to test provider");
      }
      
      const health = await response.json();
      
      // Update the provider's health status
      setProviders((prev) =>
        prev.map((p) => (p.id === providerId ? { ...p, health } : p)),
      );
      
      // Set test result to success
      setTestResult({
        providerId,
        available: health.available,
        message: `Connection test completed. Status: ${health.available ? "Success" : "Failed"}${health.error ? ` - Error: ${health.error}` : ""}`,
        loading: false,
      });
    } catch (err) {
      setTestResult({
        providerId,
        available: false,
        message: err instanceof Error ? err.message : "Failed to test provider",
        loading: false,
      });
      console.error("Error testing AI provider:", err);
    }
  }

  // Set as default provider
  async function handleSetDefault(providerId: string) {
    try {
      const response = await fetch(`/api/ai-providers/default`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          providerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set default provider");
      }

      // Refresh providers to update isDefault flags
      await fetchProviders();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to set default provider",
      );
      console.error("Error setting default provider:", err);
    }
  }

  // Get capabilities based on protocol
  function getCapabilitiesForProtocol(protocol: string) {
    switch (protocol) {
      case "openai_compatible":
        return {
          structuredOutput: true,
          jsonMode: true,
          toolCalling: true,
          streaming: true,
          vision: true,
          maxContextTokens: 128000,
          supportedModels: ["gpt-4o", "gpt-4o-mini"],
        };
      case "anthropic_messages":
        return {
          structuredOutput: true,
          jsonMode: true,
          toolCalling: false,
          streaming: true,
          vision: false,
          maxContextTokens: 200000,
          supportedModels: ["claude-3-5-sonnet", "claude-3-haiku"],
        };
      default:
        return {
          structuredOutput: false,
          jsonMode: false,
          toolCalling: false,
          streaming: false,
          vision: false,
          maxContextTokens: 4096,
          supportedModels: [],
        };
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 border-2 border-primary rounded-full animate-pulse" />
            <span className="text-primary">Loading AI providers...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <SectionHead
        index="01"
        title="AI Provider Settings"
        instruction="Manage your AI providers for Archify and other AI-powered features."
      />

      {/* Default Provider Setting */}
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
                        handleSetDefault(e.target.value);
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
                  <div
                    key={provider.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
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
                             onClick={() => {
                               setEditingProvider(provider);
                               setFormData({
                                 name: provider.name,
                                 slug: provider.slug,
                                 protocol: provider.protocol,
                                 endpoint: provider.endpoint,
                                 model: provider.model || "",
                                 isDefault: provider.isDefault,
                                 description: ""
                               });
                               setNewApiKey("");
                               setShowApiKey({});
                               setTestResult(null);
                               setIsDialogOpen(true);
                             }}
                             className="ml-2 text-sm text-primary hover:text-primary/80"
                           >
                             Edit
                           </button>
                         </>
                       )}
{!provider.hasApiKey && (
<button
                            onClick={() => {
                              setEditingProvider(provider);
                              setFormData({
                                name: provider.name,
                                slug: provider.slug,
                                protocol: provider.protocol,
                                endpoint: provider.endpoint,
                                model: provider.model || "",
                                isDefault: provider.isDefault,
                                description: ""
                              });
                              setNewApiKey("");
                              setShowApiKey({});
                              setTestResult(null);
                              setIsDialogOpen(true);
                            }}
                            className="text-sm text-primary hover:text-primary/80"
                          >
                           Set API Key
                         </button>
                       )}
                      {provider.health &&
                        provider.health.available !== undefined && (
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
                        onClick={() => handleTestProvider(provider.id)}
                        className="text-xs text-primary hover:text-primary/80"
                      >
                        Test
                      </button>
                      {!provider.isSystem && (
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-xs text-destructive hover:text-destructive/80"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
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

      {/* Add Provider Button */}
      <div className="mt-6 flex justify-end">
        <PrimaryButton
          onClick={() => {
            setEditingProvider(null);
            setFormData({
              name: "",
              slug: "",
              protocol: "openai_compatible",
              endpoint: "",
              model: "",
              isDefault: false,
              description: "",
            });
            setNewApiKey("");
            setShowApiKey({});
            setIsDialogOpen(true);
          }}
        >
          + Add Provider
        </PrimaryButton>
      </div>

      {/* Add/Edit Provider Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingProvider(null);
        }}
        title={editingProvider ? "Edit Provider" : "Create New Provider"}
        description={
          editingProvider
            ? "Update provider configuration"
            : "Add a new AI provider"
        }
      >
        <form
          onSubmit={
            editingProvider ? handleUpdateProvider : handleCreateProvider
          }
          className="space-y-6"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="provider-name">Provider Name</Label>
              <Input
                id="provider-name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="provider-slug">
                Provider Slug (unique identifier)
              </Label>
              <Input
                id="provider-slug"
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
                disabled={!!editingProvider}
              />
              <Caption>
                Unique identifier (letters, numbers, hyphens only)
              </Caption>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="provider-protocol">Protocol</Label>
              <select
                id="provider-protocol"
                value={formData.protocol}
                onChange={(e) =>
                  setFormData({ ...formData, protocol: e.target.value })
                }
                required
                className="input w-full"
              >
                <option value="openai_compatible">OpenAI Compatible</option>
                <option value="anthropic_messages">Anthropic Messages</option>
              </select>
            </div>

            <div>
              <Label htmlFor="provider-endpoint">Endpoint URL</Label>
              <Input
                id="provider-endpoint"
                type="url"
                value={formData.endpoint}
                onChange={(e) =>
                  setFormData({ ...formData, endpoint: e.target.value })
                }
                required
                placeholder="https://api.example.com/v1"
                className="input w-full"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="provider-model">Model (optional)</Label>
              <Input
                id="provider-model"
                type="text"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="gpt-4o or auto"
                className="input w-full"
              />
            </div>

            <div>
              <Label htmlFor="provider-isDefault">
                Set as default provider
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  id="provider-isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="h-4 w-4 accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="provider-api-key">API Key</Label>
              <div className="relative">
                <Input
                  id="provider-api-key"
                  type={
                    showApiKey[editingProvider?.id || "new"]
                      ? "text"
                      : "password"
                  }
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  placeholder={
                    editingProvider
                      ? "Enter new API key to replace"
                      : "Enter API key"
                  }
                  className="input w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowApiKey((prev) => ({
                      ...prev,
                      [editingProvider?.id || "new"]:
                        !showApiKey[editingProvider?.id || "new"],
                    }))
                  }
                  className="absolute right-2 top-2 text-sm text-muted-foreground hover:text-primary"
                >
                  {showApiKey[editingProvider?.id || "new"] ? "Hide" : "Show"}
                </button>
              </div>
              {editingProvider && editingProvider.hasApiKey && (
                <Caption className="mt-2">
                  Enter a new value to replace the existing API key.
                </Caption>
              )}
</div>
           </div>

           {/* Test Result */}
           {testResult && testResult.providerId === editingProvider?.id && (
             <div className="mb-4 p-3 rounded-lg">
               {testResult.loading ? (
                 <div className="flex items-center gap-2 text-sm">
                   <div className="h-3 w-3 border-2 border-primary rounded-full animate-pulse" />
                   <span>{testResult.message}</span>
                 </div>
               ) : (
                 <div className={`flex items-center gap-2 text-sm ${
                   testResult.available ? "text-success" : "text-destructive"
                 }`}>
                   {testResult.available ? (
                     <span className="h-3 w-3 bg-success rounded-full" />
                   ) : (
                     <span className="h-3 w-3 bg-destructive rounded-full" />
                   )}
                   <span>{testResult.message}</span>
                 </div>
               )}
             </div>
           )}

<div className="flex justify-end gap-4">
             <SecondaryButton
               onClick={() => {
                 setIsDialogOpen(false);
                 setEditingProvider(null);
                 setTestResult(null);
               }}
             >
               Cancel
             </SecondaryButton>
             <PrimaryButton type="submit" disabled={loading}>
               {editingProvider ? "Update Provider" : "Create Provider"}
             </PrimaryButton>
           </div>
        </form>
      </Dialog>
    </div>
  );
}
