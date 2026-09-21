"use client";

import { useState } from "react";
import { Sheet } from "@/app/components/ui";
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
      description: "Today's routines and connected roadmap tasks",
    },
    {
      id: "roadmap" as const,
      label: "Roadmap",
      description: "Milestones, prerequisites, and the full study plan",
    },
  ];

  return (
    <main className="container mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <Sheet className="overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
        <header className="border-b border-rule pb-5">
          <h1 className="text-[1.6rem] font-bold leading-none tracking-tight text-graphite sm:text-[1.9rem]">
            Tasks
          </h1>
          <p className="mt-3 max-w-[62ch] text-[0.8125rem] leading-5 text-graphite-2">
            Your personal daily routines live next to the roadmap that feeds them.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Task views"
          className="mt-3 flex items-center gap-1"
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className="tab"
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto hidden self-center text-[0.72rem] text-graphite-2 sm:block">
            {tabs.find((item) => item.id === tab)?.description}
          </span>
        </div>

        <div className="mt-8">
          {tab === "daily" ? (
            <DailyTab />
          ) : (
            <RoadmapTab
              title="All roadmap tasks"
              initialFilters={initialFilters}
            />
          )}
        </div>
      </Sheet>
    </main>
  );
}