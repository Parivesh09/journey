"use client";

import type { MilestonesData } from "@/lib/types";

interface RoadmapStatsProps {
  data: MilestonesData;
}

export function RoadmapStats({ data }: RoadmapStatsProps) {
  const totalPhases = data.phases.length;
  const totalTopics = data.phases.reduce(
    (sum: number, p) => sum + (p.topics ?? []).length,
    0,
  );
  const totalTasks = data.phases.reduce(
    (sum: number, p) =>
      sum +
      (p.topics ?? []).reduce(
        (tSum: number, t) => tSum + (t.tasks ?? []).length,
        0,
      ),
    0,
  );

  return (
    <div className="mt-8 mb-6 grid grid-cols-3 gap-4">
      <div className="text-center py-3 border border-hairline rounded bg-paper-shade/50">
        <div className="font-mono text-[1.25rem] font-semibold text-graphite">
          {totalPhases}
        </div>
        <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
          Phases
        </div>
      </div>
      <div className="text-center py-3 border border-hairline rounded bg-paper-shade/50">
        <div className="font-mono text-[1.25rem] font-semibold text-graphite">
          {totalTopics}
        </div>
        <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
          Topics
        </div>
      </div>
      <div className="text-center py-3 border border-hairline rounded bg-paper-shade/50">
        <div className="font-mono text-[1.25rem] font-semibold text-graphite">
          {totalTasks}
        </div>
        <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
          Tasks
        </div>
      </div>
    </div>
  );
}