"use client";

import { type SettingsTab } from "@/app/settings/settings-defaults";

export function SettingsTabNav({
  activeTab,
  onSelectTab,
}: {
  activeTab: SettingsTab;
  onSelectTab: (tab: SettingsTab) => void;
}) {
  return (
    <>
      {/* Tab Navigation */}
      <div className="border-b border-border mb-8 relative">
        <div className="flex items-center gap-8">
          {[
            {
              id: "account",
              label: "Account",
              description: "Your identity, email, and password",
            },
            {
              id: "appearance",
              label: "Appearance",
              description: "Theme and display preferences",
            },
            {
              id: "notifications",
              label: "Notifications",
              description: "Reminders and alert channels",
            },
            {
              id: "configuration",
              label: "Configuration",
              description: "AI providers and configuration",
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id as SettingsTab)}
              className={`pb-3 border-b-2 font-medium relative transition-all duration-fast ${
                activeTab === item.id
                  ? "text-foreground border-primary"
                  : "border-transparent text-graphite-muted hover:text-foreground"
              }`}
            >
              {item.label}
              {activeTab === item.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-slide-in-left" />
              )}
            </button>
          ))}
          <div className="ml-auto text-sm text-graphite-faint hidden sm:block transition-opacity duration-normal">
            {
              [
                {
                  id: "account",
                  description: "Your identity, email, and password",
                },
                {
                  id: "appearance",
                  description: "Theme and display preferences",
                },
                {
                  id: "notifications",
                  description: "Reminders and alert channels",
                },
                {
                  id: "configuration",
                  description: "AI providers and configuration",
                },
              ].find((item) => item.id === activeTab)?.description
            }
          </div>
        </div>
      </div>
    </>
  );
}