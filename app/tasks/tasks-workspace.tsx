"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Map } from "lucide-react";
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
      icon: CalendarDays,
      description: "Today's routines and connected roadmap tasks",
    },
    {
      id: "roadmap" as const,
      label: "Roadmap",
      icon: Map,
      description: "Milestones, prerequisites, and the full study plan",
    },
  ];

  return (
    <main className="min-h-screen bg-[#0b1020] px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">
            Study planner
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Tasks</h1>
          <p className="mt-2 text-slate-400">
            Your personal daily routines live next to the roadmap that feeds
            them.
          </p>
        </div>

        <div className="mb-8 flex gap-1.5 rounded-xl border border-slate-800 bg-slate-950/60 p-1.5 sm:max-w-md">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                tab === item.id
                  ? "bg-cyan-400 text-slate-950"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {tab === "daily" ? (
          <DailyTab />
        ) : (
          <RoadmapTab title="All roadmap tasks" initialFilters={initialFilters} />
        )}
      </div>
    </main>
  );
}