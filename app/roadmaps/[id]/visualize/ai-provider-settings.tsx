"use client";

import React, { useState, useEffect } from "react";
import { useAIProviderSettings } from "@/lib/ai/hooks/use-ai-provider-settings";
import { cn } from "@/lib/utils";

interface AIProviderFormData {
  name: string;
  slug: string;
  protocol: string;
  endpoint: string;
  model?: string;
  isDefault: boolean;
  description?: string;
}

export function AIProviderSettings() {
  const {
    providers,
    systemProviders,
    customProviders,
    defaultProvider,
    canDeleteProvider,
    refreshProviders,
  } = useAIProviderSettings();

  const [isCreating, setIsCreating] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [formData, setFormData] = useState<AIProviderFormData>({} as AIProviderFormData);

  const handleCreateProvider = async () => {
    try {
      await providers.createProvider({
        name: formData.name,
        slug: formData.slug,
        protocol: formData.protocol,
        endpoint: formData.endpoint,
        model: formData.model,
        capabilities: getCapabilitiesForProtocol(formData.protocol),
        configuration: {},
        metadata: { description: formData.description },
        isDefault: formData.isDefault,
        isSystem: false,
        isManagedByEnv: false,
      });
      await providers.updateProviderSecret(editingProvider?.id || "", newApiKey);
      setIsCreating(false);
      setEditingProvider(null);
      setFormData({} as AIProviderFormData);
      setNewApiKey("");
      await refreshProviders();
    } catch (error) {
      console.error("Failed to create provider:", error);
      alert("Failed to create provider: " + (error as Error).message);
    }
  };

  const handleUpdateProvider = async (providerId: string) => {
    try {
      await providers.updateProvider(providerId, {
        name: editingProvider.name,
        slug: editingProvider.slug,
        protocol: editingProvider.protocol,
        endpoint: editingProvider.endpoint,
        model: editingProvider.model,
        capabilities: editingProvider.capabilities,
        configuration: editingProvider.configuration,
        metadata: editingProvider.metadata,
        isDefault: editingProvider.isDefault,
      });
      if (newApiKey) {
        await providers.updateProviderSecret(providerId, newApiKey);
      }
      setEditingProvider(null);
      setNewApiKey("");
      await refreshProviders();
    } catch (error) {
      console.error("Failed to update provider:", error);
      alert("Failed to update provider: " + (error as Error).message);
    }
  };

  const handleDeleteProvider = async (providerId: string) => {
    if (!await canDeleteProvider(providerId)) {
      alert("This provider cannot be deleted (system provider or has dependencies)");
      return;
    }
    
    if (confirm("Are you sure you want to delete this provider? This action cannot be undone.")) {
      try {
        await providers.deleteProvider(providerId);
        await refreshProviders();
      } catch (error) {
        console.error("Failed to delete provider:", error);
        alert("Failed to delete provider: " + (error as Error).message);
      }
    }
  };

  const handleTestProvider = async (providerId: string) => {
    setTestingProvider(providerId);
    try {
      const health = await providers.testProviderConnection(providerId);
      console.log("Provider health:", health);
      alert(`Connection test completed. Status: ${health?.available ? "Success" : "Failed"}`);
    } catch (error) {
      console.error("Failed to test provider:", error);
      alert("Failed to test provider: " + (error as Error).message);
    } finally {
      setTestingProvider(null);
    }
  };

  const getCapabilitiesForProtocol = (protocol: string) => {
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
  };

  const ProtocolOption = ({ value, name, description }: { value: string; name: string; description: string }) => (
    <option value={value}>
      {name} - {description}
    </option>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">AI Provider Settings</h2>
        <button
          onClick={() => {
            setIsCreating(true);
            setFormData({ protocol: "openai_compatible", isDefault: false } as AIProviderFormData);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Provider
        </button>
      </div>

      {/* Default Provider Setting */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Default AI Provider</h3>
        <div className="space-y-2">
          {defaultProvider ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{defaultProvider.name}</span>
                <span className="text-sm text-gray-500 ml-2">({defaultProvider.slug})</span>
              </div>
              <span className="text-green-600 text-sm">Default Provider</span>
            </div>
          ) : (
            <p className="text-gray-500">No default provider configured</p>
          )}
          <select
            value={defaultProvider?.id || ""}
            onChange={(e) => {
              if (e.target.value) {
                providers.setDefaultProvider(e.target.value);
              }
            }}
            className="w-full p-2 border rounded"
          >
            <option value="">Select default provider...</option>
            {providers.providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.name} ({provider.slug})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* System Providers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">System Providers</h3>
        <div className="space-y-2">
          {systemProviders.map((provider) => (
            <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div>
                <span className="font-medium">{provider.name}</span>
                <span className="text-sm text-gray-500 ml-2">({provider.slug})</span>
                {provider.isDefault && (
                  <span className="ml-2 text-green-600 text-xs">Default</span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={cn(
                    "text-sm px-2 py-1 rounded",
                    provider.enabled ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  )}
                >
                  {provider.enabled ? "Enabled" : "Disabled"}
                </span>
                {testingProvider === provider.id ? (
                  <span className="text-sm text-blue-600">Testing...</span>
                ) : (
                  <button
                    onClick={() => handleTestProvider(provider.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Test Connection
                  </button>
                )}
                {provider.hasApiKey && (
                  <span className="text-sm text-green-600">✓ Configured</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Providers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">Custom Providers</h3>
        {customProviders.length === 0 ? (
          <p className="text-gray-500">No custom providers configured.</p>
        ) : (
          <div className="space-y-2">
            {customProviders.map((provider) => (
              <div key={provider.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium">{provider.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({provider.slug})</span>
                    {provider.isDefault && (
                      <span className="ml-2 text-green-600 text-xs">Default</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setEditingProvider(provider);
                        setFormData({
                          name: provider.name,
                          slug: provider.slug,
                          protocol: provider.protocol,
                          endpoint: provider.endpoint,
                          model: provider.model,
                          isDefault: provider.isDefault,
                          description: provider.metadata?.description || "",
                        } as AIProviderFormData);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProvider(provider.id)}
                      className="text-sm text-red-600 hover:text-red-800"
                      disabled={!canDeleteProvider(provider.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Protocol: {provider.protocol}</div>
                  <div>Endpoint: {provider.endpoint}</div>
                  {provider.model && <div>Model: {provider.model}</div>}
                  <div>Status: {provider.enabled ? "Enabled" : "Disabled"}</div>
                  <div>API Key: {provider.hasApiKey ? "✓ Configured" : "✗ Not configured"}</div>
                  {testingProvider === provider.id && <div className="text-blue-600">Testing...</div>}
                </div>
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => handleTestProvider(provider.id)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Test Connection
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Provider Form */}
      {(isCreating || editingProvider) && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingProvider ? "Edit Provider" : "Create New Provider"}
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingProvider) {
                handleUpdateProvider(editingProvider.id);
              } else {
                handleCreateProvider();
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Provider Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Provider Slug (unique identifier)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full p-2 border rounded"
                required
                disabled={!!editingProvider} // Slug cannot be changed when editing
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Protocol</label>
              <select
                value={formData.protocol}
                onChange={(e) => {
                  const capabilities = getCapabilitiesForProtocol(e.target.value);
                  setFormData({ ...formData, protocol: e.target.value, capabilities });
                }}
                className="w-full p-2 border rounded"
                required
              >
                <ProtocolOption value="openai_compatible" name="OpenAI Compatible" description="For OpenAI and compatible APIs" />
                <ProtocolOption value="anthropic_messages" name="Anthropic Messages" description="For Anthropic Claude models" />
                <ProtocolOption value="gemini" name="Google Gemini" description="For Google Gemini models" />
                <ProtocolOption value="ollama" name="Ollama" description="For local Ollama deployments" />
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Endpoint URL</label>
              <input
                type="url"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="https://api.example.com/v1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Model (optional)</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full p-2 border rounded"
                placeholder="gpt-4o or auto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description (optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isDefault" className="text-sm font-medium">
                Set as default provider
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey[editingProvider?.id || ""] ? "text" : "password"}
                  value={newApiKey}
                  onChange={(e) => setNewApiKey(e.target.value)}
                  className="w-full p-2 border rounded pr-10"
                  placeholder="Enter API key"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey({ ...showApiKey, [editingProvider?.id || ""]: !showApiKey[editingProvider?.id || ""] })}
                  className="absolute right-2 top-2 text-sm text-gray-600"
                >
                  {showApiKey[editingProvider?.id || ""] ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingProvider ? "Update Provider" : "Create Provider"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingProvider(null);
                  setFormData({} as AIProviderFormData);
                  setNewApiKey("");
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Status Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">Important Notes</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• System providers (OpenAI, FreeLLMAPI) cannot be deleted</li>
          <li>• API keys are encrypted and never exposed to client-side code</li>
          <li>• Custom providers can be created with any protocol</li>
          <li>• Provider connection testing validates endpoint and authentication</li>
          <li>• Default provider determines which AI service is used by features</li>
        </ul>
      </div>
    </div>
  );
}
