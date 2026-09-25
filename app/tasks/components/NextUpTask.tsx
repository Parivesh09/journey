"use client";

import { Stamp } from "@/app/components/ui";
import type { MilestonesData } from "@/lib/types";

interface NextUpTaskProps {
  nextUpTask: MilestonesData["milestones"][0]["phases"][0]["topics"][0]["tasks"][0] | null;
}

export function NextUpTask({ nextUpTask }: NextUpTaskProps) {
  if (!nextUpTask) return null;

  return (
    <div className="mt-8 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-amber/25 bg-amber/[0.07] px-4 py-3">
      <Stamp tone="amber">Next up</Stamp>
      <span className="min-w-0 flex-1 truncate text-[0.875rem] font-medium text-graphite">
        {nextUpTask.title}
      </span>
      <span className="shrink-0 font-mono text-[0.68rem] text-graphite-2">
        {nextUpTask.phaseTitle} / {nextUpTask.topicTitle}
      </span>
    </div>
  );
}