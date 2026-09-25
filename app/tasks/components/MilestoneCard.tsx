"use client";

import { Lock, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Bubble,
  SectionHead,
  Stamp,
} from "@/app/components/ui";
import type { Milestone, Filters, MilestoneTask } from "./roadmap-types";
import { taskMatches, visiblePhases, statusPill, RAMP } from "./roadmap-types";

interface MilestoneCardProps {
  milestone: Milestone;
  pinnedById: Record<string, string>;
  filters: Filters;
  mutating: string | null;
  completing: boolean;
  index: number;
  onToggleTask: (task: MilestoneTask) => void;
  onTogglePin: (task: MilestoneTask) => void;
  onComplete: (milestone: Milestone) => void;
}

export function MilestoneCard({
  milestone,
  pinnedById,
  filters,
  mutating,
  completing,
  index,
  onToggleTask,
  onTogglePin,
  onComplete,
}: MilestoneCardProps) {
  const pill = statusPill(milestone);
  const locked = milestone.locked;
  const blockedPrereqs = milestone.prerequisites.filter(
    (prereq) => !prereq.met,
  );
  const anyFilterActive = Boolean(
    filters.q ||
      filters.phaseId ||
      filters.topicId ||
      filters.category ||
      filters.taskType ||
      filters.status ||
      filters.difficulty,
  );

  return (
    <section className="border-t border-stone-400 pt-6">
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-md bg-amber/12 px-1.5 py-0.5 font-mono text-[0.68rem] font-semibold tabular-nums text-amber-ink">
            M{index + 1}
          </span>
          <h3 className="min-w-0 flex-1 text-[1.05rem] font-semibold tracking-tight text-graphite">
            {milestone.title}
          </h3>
          <Stamp tone={pill.tone}>
            {locked ? <Lock className="h-3 w-3" aria-hidden /> : null}
            {pill.label}
          </Stamp>
        </div>
        {milestone.description ? (
          <p className="mt-1.5 max-w-[68ch] text-[0.8125rem] leading-5 text-graphite-2">
            {milestone.description}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-4">
          <div
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-rule"
            role="progressbar"
            aria-valuenow={milestone.progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${milestone.title} progress`}
          >
            <div
              className="h-full"
              style={{
                width: `${milestone.progress.percent}%`,
                backgroundImage: RAMP,
              }}
            />
          </div>
          <span className="shrink-0 font-mono text-[0.7rem] tabular-nums text-graphite-2">
            {milestone.progress.completed}/{milestone.progress.total} ·{" "}
            {milestone.progress.percent}%
          </span>
        </div>

        {locked && blockedPrereqs.length > 0 ? (
          <p className="mt-3 flex items-start gap-2 text-[0.8125rem] leading-5 text-graphite-2">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              Complete{" "}
              {blockedPrereqs
                .map((prereq) => `"${prereq.title}"`)
                .join(" and ")}{" "}
              first to unlock this milestone.
            </span>
          </p>
        ) : null}

        {milestone.needsManualCompletion && !locked ? (
          <button
            type="button"
            disabled={completing}
            onClick={() => onComplete(milestone)}
            className="btn btn-line mt-4 border-valid/40 px-3 py-1.5 text-[0.75rem] text-valid"
          >
            {completing ? "Marking complete" : "Mark milestone complete"}
          </button>
        ) : null}
      </header>

      <div className={locked ? "opacity-45" : ""}>
        {milestone.phases.map((phase) => {
          const renderedTopics = phase.topics.filter(
            (topic) => topic.tasks.length > 0,
          );
          if (renderedTopics.length === 0) return null;
          return (
            <details
              key={phase.id}
              className="group border-b border-stone-400"
              open={anyFilterActive}
            >
              <summary className="flex items-center gap-3 py-3 text-[0.9rem] font-semibold text-graphite">
                <span
                  aria-hidden
                  className="grid h-5 w-5 place-items-center rounded-md bg-amber/12 text-[0.85rem] leading-none text-amber-ink transition-transform duration-150 ease-out group-open:rotate-45"
                >
                  +
                </span>
                <span className="min-w-0 flex-1 truncate">{phase.title}</span>
                <span className="shrink-0 font-mono text-[0.68rem] text-graphite-2">
                  {renderedTopics.length} topic{renderedTopics.length === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="pb-1">
                {renderedTopics.map((topic) => (
                  <div key={topic.id} className="pb-2">
                    <p className="pt-2 text-[0.72rem] font-semibold text-graphite-2">
                      {topic.title}
                    </p>
                    <div className="border-t border-stone-400">
                      {topic.tasks.map((task, taskIndex) => {
                        const isDone = task.status === "COMPLETED";
                        const pinned = Boolean(pinnedById[task.id]);
                        return (
                          <div
                            key={task.id}
                            className="relative border-b border-stone-400 last:border-b-0"
                          >
                            <span className="hl" data-on={isDone} aria-hidden />
                            <div className="relative z-10 flex items-center gap-3 py-2.5 pl-1">
                              <span className="w-5 shrink-0 font-mono text-[0.62rem] tabular-nums text-graphite-3">
                                {String(taskIndex + 1).padStart(2, "0")}
                              </span>
                              <Bubble
                                filled={isDone}
                                busy={mutating === task.id}
                                disabled={locked}
                                label={
                                  isDone
                                    ? "Mark task incomplete"
                                    : "Mark task complete"
                                }
                                onClick={() => onToggleTask(task)}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p
                                    className={
                                      isDone
                                        ? "truncate text-[0.875rem] leading-6 text-graphite-2 line-through decoration-graphite/50"
                                        : "truncate text-[0.875rem] leading-6 text-graphite"
                                    }
                                  >
                                    {task.title}
                                  </p>
                                  <span className="badge badge-roadmap">
                                    Roadmap
                                  </span>
                                </div>
                                <p className="mt-0.5 truncate font-mono text-[0.65rem] text-graphite-2">
                                  {[
                                    task.taskType,
                                    task.difficulty,
                                    task.priority,
                                  ]
                                    .filter(Boolean)
                                    .join(" · ")}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={locked || mutating === task.id}
                                onClick={() => onTogglePin(task)}
                                title={
                                  locked
                                    ? "Unlock the milestone first"
                                    : pinned
                                    ? "Remove from daily"
                                    : "Add to daily"
                                }
                                aria-pressed={pinned}
                                className={cn(
                                  "btn shrink-0 gap-1.5 px-2 py-1 text-[0.7rem] ",
                                  pinned
                                    ? "btn-line text-amber-ink shadow-[inset_0_0_0_1.5px_var(--color-amber-ink)]"
                                    : locked
                                    ? "cursor-not-allowed text-graphite-3"
                                    : "text-graphite-2 hover:text-graphite",
                                )}
                              >
                                <Link2 className="h-3.5 w-3.5" aria-hidden />
                                {locked
                                  ? "Locked"
                                  : pinned
                                  ? "In daily"
                                  : "Daily"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}