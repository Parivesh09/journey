"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useGetMilestonesQuery, useGetDailyPinsQuery, useGetRoadmapsQuery, useUpdateTaskMutation } from "@/lib/api";
import type { RoadmapSummary, MilestonesData, Filters } from "@/lib/types";
import { MilestoneCard } from "./components/MilestoneCard";
import { SkeletonRows, SectionHead, Stamp, Card, CardContent, Num } from "@/app/components/ui";
import { extractErrorMessage } from "@/lib/utils";
import { taskMatches, visiblePhases } from "./components/roadmap-types";

export default function RoadmapTab({
  title,
  initialFilters,
}: {
  title: string;
  initialFilters?: { category?: string; taskType?: string };
}) {
  const { data: roadmapsData } = useGetRoadmapsQuery(undefined);
  const roadmaps: RoadmapSummary[] = roadmapsData?.roadmaps ?? [];

  return (
    <div>
      <SectionHead
        index="01"
        title="Your Roadmaps"
        instruction="Enrolled roadmaps with progress tracking"
        aside={`${roadmaps.length} active`}
      />

      {roadmaps.length === 0 ? (
        <div className="mt-6 text-center py-12">
          <p className="text-graphite-muted">No active roadmaps yet</p>
          <Link
            href="/roadmaps"
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-sm text-primary hover:text-primary/80"
          >
            Browse roadmap library
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((roadmap) => (
            <RoadmapCard key={roadmap.id} roadmap={roadmap} />
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapCard({ roadmap }: { roadmap: RoadmapSummary }) {
  const { data: milestonesData, isLoading, isFetching, isError } = useGetMilestonesQuery(roadmap.id);
  const { data: pinsData } = useGetDailyPinsQuery(undefined);
  const [updateTask] = useUpdateTaskMutation();

  const [data, setData] = useState<MilestonesData | null>(null);

  const pinnedById = useMemo(() => {
    if (!milestonesData?.pinnedTaskIds || !pinsData?.pins) return {};
    return Object.fromEntries(
      pinsData.pins
        .filter((pin: { taskId: string }) =>
          milestonesData.pinnedTaskIds.includes(pin.taskId),
        )
        .map((pin: { taskId: string; id: string }) => [pin.taskId, pin.id]),
    );
  }, [milestonesData, pinsData]);

  useEffect(() => {
    if (milestonesData) {
      setData(milestonesData as MilestonesData);
    }
  }, [milestonesData]);

  async function handleToggleTask(task: any) {
    try {
      await updateTask({
        id: task.id,
        status: task.status === "COMPLETED" ? "TODO" : "COMPLETED",
      }).unwrap();
    } catch (reason: unknown) {
      console.error(extractErrorMessage(reason));
    }
  }

  const progress = data
    ? data.milestones.reduce((acc: number, m) => acc + m.progress.completed, 0) /
      Math.max(1, data.milestones.reduce((acc: number, m) => acc + m.progress.total, 0))
    : 0;

  const totalPhases = roadmap.phases?.length ?? 0;
  const phasesArr = (roadmap.phases ?? []) as any[];
  const totalTopics = phasesArr.reduce(
    (sum: number, p: any) => sum + (p.topics ?? []).length,
    0,
  ) ?? 0;
  const totalTasks = phasesArr.reduce(
    (sum: number, p: any) =>
      sum +
      (p.topics ?? []).reduce(
        (tSum: number, t: any) => tSum + (t.tasks ?? []).length,
        0,
      ),
    0,
  ) ?? 0;

  return (
    <Link
      href={`/tasks/roadmap/${roadmap.id}`}
      className="group block h-full"
    >
      <Card className="h-full">
        <CardContent className="p-5">
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
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="font-mono text-xs text-primary">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <span className="inline-flex items-center gap-1 font-mono text-xs text-primary group-hover:text-primary/80">
              <ArrowRight className="h-3 w-3" />
              View details
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

const defaultFilters: Filters = {
  q: "",
  category: "",
  phaseId: "",
  topicId: "",
  taskType: "",
  status: "",
  difficulty: "",
};