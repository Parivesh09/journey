"use client";

import { useState } from "react";
import { Sheet, PageHeader, SectionHead } from "@/app/components/ui";
import DailyTab from "./daily-tab";
import RoadmapTab from "./roadmap-tab";

export default function TasksWorkspace({
  initialTab,
  initialFilters,
}: {
  initialTab: "daily" | "roadmap";
  initialFilters?: { category?: string; taskType?: string };
}) {
  const [tab, setTab] = useState(initialTab);

  const tabs = [
    {
      id: "daily" as const,
      label: "Daily",
      description: "Today's routines and connected tasks",
    },
    {
      id: "roadmap" as const,
      label: "Roadmap",
      description: "Milestones, phases, and study plan",
    },
  ];

  return (
    <main className="px-6 py-8 sm:px-8 lg:px-12">
      <Sheet>
        <PageHeader
          title="Tasks"
          subtitle="Your daily routines and roadmap progress in one view"
        />

        <div className="border-b border-border mb-8">
          <div className="flex items-center gap-8">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`pb-3 border-b-2 transition-colors font-medium ${
                  tab === item.id
                    ? "border-primary text-foreground"
                    : "border-transparent text-graphite-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto text-sm text-graphite-faint hidden sm:block">
              {tabs.find((item) => item.id === tab)?.description}
            </div>
          </div>
        </div>

        <div>
          {tab === "daily" ? (
            <DailyTab />
          ) : (
            <>
              <SectionHead
                index="01"
                title="Roadmap Overview"
                instruction="Your activated roadmaps and progress"
              />
              <RoadmapTab
                title="All roadmap tasks"
                initialFilters={initialFilters}
              />
            </>
          )}
        </div>
      </Sheet>
    </main>
  );
}
