"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useGetMilestonesQuery, useGetDailyPinsQuery, useGetRoadmapsQuery, useUpdateTaskMutation } from "@/lib/api";
import type { RoadmapSummary, MilestonesData, Filters } from "@/lib/types";
import { MilestoneCard } from "./components/MilestoneCard";
import { SkeletonRows, SectionHead, Stamp } from "@/app/components/ui";
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
            className="mt-4 inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-amber-ink hover:text-highlighter-amber"
          >
            Browse roadmap library
            <ArrowRight className="h-3.5 w-3.5" />
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
      className="group border border-hairline rounded hover:border-hairline-strong hover:ring-2 hover:ring-amber-ink/20 transition-colors bg-paper block"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-[1.05rem] font-semibold text-graphite group-hover:text-amber-ink">
              {roadmap.title}
            </h3>
            {roadmap.description && (
              <p className="mt-2 text-[0.85rem] leading-relaxed text-graphite-muted line-clamp-2">
                {roadmap.description}
              </p>
            )}
          </div>
          <Stamp tone="valid" className="shrink-0">
            Enrolled
          </Stamp>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center py-2 border border-hairline rounded">
            <div className="font-mono text-[1.1rem] font-semibold text-graphite">
              {totalPhases}
            </div>
            <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
              Phases
            </div>
          </div>
          <div className="text-center py-2 border border-hairline rounded">
            <div className="font-mono text-[1.1rem] font-semibold text-graphite">
              {totalTopics}
            </div>
            <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
              Topics
            </div>
          </div>
          <div className="text-center py-2 border border-hairline rounded">
            <div className="font-mono text-[1.1rem] font-semibold text-graphite">
              {totalTasks}
            </div>
            <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
              Tasks
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-rule rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-ink transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <span className="font-mono text-[0.7rem] text-amber-ink">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-amber-ink group-hover:text-highlighter-amber">
            <ArrowRight className="h-3 w-3" />
            View details
          </span>
        </div>
      </div>
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