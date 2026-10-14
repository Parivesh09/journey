"use client";

import { useState, useEffect, useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGetRoadmapExecutionQuery, useGetDailyPinsQuery, useGetRoadmapsQuery, useUpdateTaskMutation, useRoadmapItemActionMutation } from "@/lib/api";
import type { RoadmapSummary, RoadmapExecution, Filters } from "@/lib/types";
import type { MilestoneExecution, TopicExecution, TaskExecution } from "@/lib/types/roadmap-execution";
import { SectionHead, Stamp, Card, CardContent, Num } from "@/app/components/ui";
import { extractErrorMessage } from "@/lib/utils";

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
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const { data: executionData, isLoading, isError } = useGetRoadmapExecutionQuery(roadmap.id);
  const { data: pinsData } = useGetDailyPinsQuery(undefined);
  const [updateTask] = useUpdateTaskMutation();
  const [roadmapItemAction] = useRoadmapItemActionMutation();

  const [execution, setExecution] = useState<RoadmapExecution | null>(null);

  const pinnedById = useMemo(() => {
    if (!executionData?.data?.milestones || !pinsData?.pins) return {};
    // Flatten all task IDs from milestones to check against pins
    const allTaskIds = executionData.data.milestones.flatMap(milestone => 
      milestone.topics.flatMap(topic => topic.tasks.map(task => task.id))
    );
    return Object.fromEntries(
      pinsData.pins
        .filter((pin: { taskId: string }) => allTaskIds.includes(pin.taskId))
        .map((pin: { taskId: string; id: string }) => [pin.taskId, pin.id]),
    );
  }, [executionData, pinsData]);

  useEffect(() => {
    if (executionData.data) {
      setExecution(executionData.data);
    }
  }, [executionData]);

  async function handleToggleTask(taskId: string) {
    try {
      await updateTask({
        id: taskId,
        status: "TODO", // Toggle logic would need current status - simplified
      }).unwrap();
    } catch (reason: unknown) {
      console.error(extractErrorMessage(reason));
    }
  }

  const handleNavigate = () => {
    router.push(`/tasks/roadmaps/${roadmap.id}`);
  };

  const progress = executionData?.data?.progress ?? { completed: 0, total: 0, percent: 0 };

  const totalPhases = roadmap.phases?.length ?? 0;
  const phasesArr: RoadmapPhase[] = roadmap.phases ?? [];
  const totalTopics = phasesArr.reduce(
    (sum: number, p: RoadmapPhase) => sum + (p.topics ?? []).length,
    0,
  ) ?? 0;
  const totalTasks = phasesArr.reduce(
    (sum: number, p: RoadmapPhase) =>
      sum +
      (p.topics ?? []).reduce(
        (tSum: number, t: RoadmapTopic) => tSum + (t.tasks ?? []).length,
        0,
      ),
    0,
  ) ?? 0;

  return (
    <div
      onClick={handleNavigate}
      className="group block h-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`h-full transition-all duration-normal ${isHovered ? 'transform -translate-y-0.5' : ''}`}>

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
                    className="h-full bg-primary transition_all duration-300"
                    style={{ width: `${Math.round(progress.percent)}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-primary">
                  {progress.percent}%
                </span>
              </div>
              <span className="inline-flex items-center gap-1 font-mono text-xs text-primary group-hover:text-primary/80">
                <ArrowRight className="h-3 w-3" />
                View details
              </span>
            </div>
          </CardContent>
      </Card>
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