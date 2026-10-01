"use client";

import { useState, useEffect } from "react";
import { SectionHead, PrimaryButton } from "@/app/components/ui";
import { DefaultProviderCard } from "./DefaultProviderCard";
import { ProviderDialog } from "./ProviderDialog";
import { Provider, ProviderFormData, TestResult } from "./types";

export function AIProviderSettings() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // Derive default provider from providers state
  const defaultProvider = providers.find((p) => p.isDefault) || null;

  const [formData, setFormData] = useState<ProviderFormData>({
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
      resetForm();

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
      resetForm();

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

  // Reset form
  function resetForm() {
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
    setShowApiKey(false);
  }

  // Open the create dialog
  function handleCreate() {
    resetForm();
    setIsDialogOpen(true);
  }

  // Open the edit dialog for a provider
  function handleEdit(provider: Provider) {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      slug: provider.slug,
      protocol: provider.protocol,
      endpoint: provider.endpoint,
      model: provider.model || "",
      isDefault: provider.isDefault,
      description: "",
    });
    setNewApiKey("");
    setShowApiKey(false);
    setTestResult(null);
    setIsDialogOpen(true);
  }

  function handleCloseDialog() {
    setIsDialogOpen(false);
    setEditingProvider(null);
  }

  function handleCancelDialog() {
    setIsDialogOpen(false);
    setEditingProvider(null);
    setTestResult(null);
  }

  function handleFormDataChange(patch: Partial<ProviderFormData>) {
    setFormData((prev) => ({ ...prev, ...patch }));
  }

  function handleToggleApiKeyVisible() {
    setShowApiKey((prev) => !prev);
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
      <DefaultProviderCard
        providers={providers}
        defaultProvider={defaultProvider}
        onSetDefault={handleSetDefault}
        onEdit={handleEdit}
        onTest={handleTestProvider}
        onDelete={handleDeleteProvider}
      />

      {/* Add Provider Button */}
      <div className="mt-6 flex justify-end">
        <PrimaryButton onClick={handleCreate}>+ Add Provider</PrimaryButton>
      </div>

      {/* Add/Edit Provider Dialog */}
      <ProviderDialog
        open={isDialogOpen}
        editingProvider={editingProvider}
        loading={loading}
        formData={formData}
        onFormDataChange={handleFormDataChange}
        newApiKey={newApiKey}
        onNewApiKeyChange={setNewApiKey}
        apiKeyVisible={showApiKey}
        onToggleApiKeyVisible={handleToggleApiKeyVisible}
        testResult={testResult}
        onSubmit={
          editingProvider ? handleUpdateProvider : handleCreateProvider
        }
        onClose={handleCloseDialog}
        onCancel={handleCancelDialog}
      />
    </div>
  );
}
