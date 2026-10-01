"use client";

import {
  Dialog,
  Input,
  Label,
  Caption,
  PrimaryButton,
  SecondaryButton,
} from "@/app/components/ui";
import { Provider, ProviderFormData, TestResult } from "./types";

interface ProviderDialogProps {
  open: boolean;
  editingProvider: Provider | null;
  loading: boolean;
  formData: ProviderFormData;
  onFormDataChange: (patch: Partial<ProviderFormData>) => void;
  newApiKey: string;
  onNewApiKeyChange: (value: string) => void;
  apiKeyVisible: boolean;
  onToggleApiKeyVisible: () => void;
  testResult: TestResult | null;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onCancel: () => void;
}

export function ProviderDialog({
  open,
  editingProvider,
  loading,
  formData,
  onFormDataChange,
  newApiKey,
  onNewApiKeyChange,
  apiKeyVisible,
  onToggleApiKeyVisible,
  testResult,
  onSubmit,
  onClose,
  onCancel,
}: ProviderDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editingProvider ? "Edit Provider" : "Create New Provider"}
      description={
        editingProvider
          ? "Update provider configuration"
          : "Add a new AI provider"
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="provider-name">Provider Name</Label>
            <Input
              id="provider-name"
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange({ name: e.target.value })}
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
              onChange={(e) => onFormDataChange({ slug: e.target.value })}
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
                onFormDataChange({ protocol: e.target.value })
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
              onChange={(e) => onFormDataChange({ endpoint: e.target.value })}
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
              onChange={(e) => onFormDataChange({ model: e.target.value })}
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
                  onFormDataChange({ isDefault: e.target.checked })
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
                type={apiKeyVisible ? "text" : "password"}
                value={newApiKey}
                onChange={(e) => onNewApiKeyChange(e.target.value)}
                placeholder={
                  editingProvider
                    ? "Enter new API key to replace"
                    : "Enter API key"
                }
                className="input w-full pr-10"
              />
              <button
                type="button"
                onClick={onToggleApiKeyVisible}
                className="absolute right-2 top-2 text-sm text-muted-foreground hover:text-primary"
              >
                {apiKeyVisible ? "Hide" : "Show"}
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
              <div
                className={`flex items-center gap-2 text-sm ${
                  testResult.available
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
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
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" disabled={loading}>
            {editingProvider ? "Update Provider" : "Create Provider"}
          </PrimaryButton>
        </div>
      </form>
    </Dialog>
  );
}
