"use client";

import { AIProviderSettings } from "./ai-provider-settings";

export default function AIProviderSettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <nav className="text-sm text-gray-600">
          <ol className="list-reset flex">
            <li>
              <a href="/" className="text-blue-600 hover:text-blue-800">
                Dashboard
              </a>
            </li>
            <li className="mx-2">/</li>
            <li className="text-gray-500">AI Provider Settings</li>
          </ol>
        </nav>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Provider Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage AI providers for Archify and other AI-powered features.
          Configure endpoints, API keys, and connection settings.
        </p>
      </div>

      <AIProviderSettings />
    </div>
  );
}
