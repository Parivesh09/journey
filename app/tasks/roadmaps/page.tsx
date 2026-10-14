"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useGetRoadmapsQuery } from "@/lib/api";
import AppShell from "@/app/components/shell";
import {
  PageHeader,
  Sheet,
  SectionHead,
  Stamp,
  Card,
  CardContent,
  Num,
  ProgressBar,
} from "@/app/components/ui";
import { extractErrorMessage } from "@/lib/utils";

export default function RoadmapsExecutionPage() {
  const { data: roadmapsData, isLoading, isError } = useGetRoadmapsQuery();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  if (isLoading) {
    return (
      <AppShell active="today" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <div className="flex items-center justify-center space-x-3">
                <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
                <div className="h-8 w-8 animate-pulse rounded bg-muted"></div>
              </div>
              <p className="mt-4 text-sm text-graphite-muted">Loading roadmaps...</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  if (isError) {
    return (
      <AppShell active="today" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="p-6">
              <p className="text-sm text-destructive">Failed to load roadmaps. Please try again.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  const roadmaps = roadmapsData?.roadmaps ?? [];

  if (roadmaps.length === 0) {
    return (
      <AppShell active="today" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">No active roadmaps. Please activate a roadmap from the Roadmap Library.</p>
              <Link
                href="/roadmaps"
                className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:text-primary/80"
              >
                Browse roadmap library
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell active="today" user={user}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Roadmap Execution"
            subtitle="Select a roadmap to track your progress"
          />

          <SectionHead
            index="01"
            title="Your Roadmaps"
            instruction="Enrolled roadmaps with progress tracking"
            aside={`${roadmaps.length} active`}
          />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((roadmap) => (
              <RoadmapExecutionCard
                key={roadmap.id}
                roadmap={roadmap}
              />
            ))}
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}

interface RoadmapExecutionCardProps {
  roadmap: {
    id: string;
    title: string;
    description: string | null;
    activated: boolean;
  };
}

function RoadmapExecutionCard({ roadmap }: RoadmapExecutionCardProps) {
  // Calculate totals from roadmap template
  const totalPhases = roadmap.phases?.length ?? 0;
  const totalTopics = roadmap.phases?.reduce(
    (sum, p) => sum + (p.topics ?? []).length,
    0,
  ) ?? 0;
  const totalTasks = roadmap.phases?.reduce(
    (sum, p) =>
      sum +
      (p.topics ?? []).reduce(
        (tSum, t) => tSum + (t.tasks ?? []).length,
        0,
      ),
    0,
  ) ?? 0;

  return (
    <Link
      href={`/tasks/roadmaps/${roadmap.id}`}
      className="group block h-full cursor-pointer"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary font-display">
              {roadmap.title}
            </h3>
            {roadmap.description && (
              <p className="mt-2 text-sm leading-relaxed text-graphite-muted line-clamp-2">
                {roadmap.description}
              </p>
            )}
          </div>
          <Stamp tone="valid" className="shrink-0">
            Enrolled
          </Stamp>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center py-3 rounded-lg bg-muted">
            <div className="font-mono text-xl font-semibold text-foreground">
              <Num>{totalPhases}</Num>
            </div>
            <div className="label">Phases</div>
          </div>
          <div className="text-center py-3 rounded-lg bg-muted">
            <div className="font-mono text-xl font-semibold text-foreground">
              <Num>{totalTopics}</Num>
            </div>
            <div className="label">Topics</div>
          </div>
          <div className="text-center py-3 rounded-lg bg-muted">
            <div className="font-mono text-xl font-semibold text-foreground">
              <Num>{totalTasks}</Num>
            </div>
            <div className="label">Tasks</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: "0%" }}
              />
            </div>
            <span className="font-mono text-xs text-primary">0%</span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-primary group-hover:text-primary/80">
            <ArrowRight className="h-3 w-3" />
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}