"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useGetMilestonesQuery, useGetDailyPinsQuery, useUpdateTaskMutation, useGetRoadmapsQuery } from "@/lib/api";
import type { RoadmapSummary, MilestonesData, Filters } from "@/lib/types";
import { MilestoneCard } from "../../components/MilestoneCard";
import { SkeletonRows, SectionHead, Stamp } from "@/app/components/ui";
import { extractErrorMessage } from "@/lib/utils";
import { taskMatches, visiblePhases } from "../../components/roadmap-types";

export default function RoadmapDetailPage() {
  const params = useParams();
  const roadmapId = params.id as string;

  const { data: roadmapsData } = useGetRoadmapsQuery(undefined);
  const roadmap = roadmapsData?.roadmaps?.find((r: RoadmapSummary) => r.id === roadmapId);

  const { data: milestonesData, isFetching, isError } = useGetMilestonesQuery(roadmapId);
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
    ? data.milestones.reduce((acc, m) => acc + m.progress.completed, 0) /
      Math.max(1, data.milestones.reduce((acc, m) => acc + m.progress.total, 0))
    : 0;

  const totalPhases = roadmap?.phases?.length ?? 0;
  const totalTopics = roadmap?.phases?.reduce(
    (sum, p) => sum + (p.topics ?? []).length,
    0,
  ) ?? 0;
  const totalTasks = roadmap?.phases?.reduce(
    (sum, p) =>
      sum +
      (p.topics ?? []).reduce(
        (tSum, t) => tSum + (t.tasks ?? []).length,
        0,
      ),
    0,
  ) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Link
          href="/tasks?tab=roadmap"
          className="inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-graphite-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to roadmaps
        </Link>

        {roadmap && (
          <div>
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-[1.85rem] font-bold text-foreground">
                    {roadmap.title}
                  </h1>
                  {roadmap.description && (
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-graphite-muted">
                      {roadmap.description}
                    </p>
                  )}
                </div>
                <Stamp tone="valid" className="shrink-0">
                  Enrolled
                </Stamp>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center py-3 border border-border rounded bg-muted/50">
                  <div className="font-mono text-[1.5rem] font-semibold text-foreground">
                    {totalPhases}
                  </div>
                  <div className="text-[0.7rem] uppercase tracking-wide text-graphite-faint mt-1">
                    Phases
                  </div>
                </div>
                <div className="text-center py-3 border border-border rounded bg-muted/50">
                  <div className="font-mono text-[1.5rem] font-semibold text-foreground">
                    {totalTopics}
                  </div>
                  <div className="text-[0.7rem] uppercase tracking-wide text-graphite-faint mt-1">
                    Topics
                  </div>
                </div>
                <div className="text-center py-3 border border-border rounded bg-muted/50">
                  <div className="font-mono text-[1.5rem] font-semibold text-foreground">
                    {totalTasks}
                  </div>
                  <div className="text-[0.7rem] uppercase tracking-wide text-graphite-faint mt-1">
                    Tasks
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="w-48 h-3 bg-muted rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[0.85rem] text-primary">
                    {Math.round(progress * 100)}% complete
                  </span>
                  <span className="font-mono text-[0.7rem] text-graphite-muted">
                    {data?.milestones.reduce((acc, m) => acc + m.progress.completed, 0) ?? 0} / {data?.milestones.reduce((acc, m) => acc + m.progress.total, 0) ?? 0} tasks
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isFetching && !data ? (
          <SkeletonRows rows={6} />
        ) : isError ? (
          <div className="rounded border border-destructive/50 bg-destructive/5 px-4 py-3 text-[0.85rem] text-destructive mb-4">
            Failed to load roadmap data.
          </div>
        ) : data && data.milestones.length > 0 ? (
          <div>
            <SectionHead
              index="01"
              title="Milestones"
              instruction="Track your progress through each milestone"
              aside={`${data.milestones.length} milestones`}
            />
            <div className="space-y-4 mt-4">
              {data.milestones.map((milestone, index) => (
                <MilestoneCard
                  key={milestone.id}
                  milestone={milestone}
                  pinnedById={pinnedById}
                  filters={defaultFilters}
                  mutating={null}
                  completing={false}
                  index={index}
                  onToggleTask={handleToggleTask}
                  onTogglePin={() => {}}
                  onComplete={() => {}}
                />
              ))}
            </div>
          </div>
        ) : !roadmap ? (
          <div className="text-center py-12">
            <p className="text-graphite-muted">Roadmap not found</p>
            <Link
              href="/tasks?tab=roadmap"
              className="mt-4 inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-primary hover:text-primary"
            >
              Back to roadmaps
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="text-center py-12 text-graphite-muted">
            No milestones found for this roadmap.
          </div>
        )}
      </main>
    </div>
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