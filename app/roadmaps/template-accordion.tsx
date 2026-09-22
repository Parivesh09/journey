"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, X } from "lucide-react";

type Phase = {
  id: string;
  title: string;
  category?: string;
  topics?: {
    id: string;
    title: string;
    category?: string;
    estimated_days?: number;
    tasks?: {
      id: string;
      title: string;
      type?: string;
      difficulty?: string;
    }[];
  }[];
};

type Milestone = {
  id: string;
  title: string;
  description?: string;
  phases: string[];
  prerequisites: string[];
};

interface TemplateAccordionProps {
  milestones: Milestone[];
  phases: Phase[];
}

export default function TemplateAccordion({
  milestones,
  phases,
}: TemplateAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handlePhaseSelect = (phase: Phase) => {
    setSelectedPhase(phase);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
  };

  // Prevent page scrolling while drawer is open.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

  // Close drawer with Escape.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDrawerClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDrawerOpen]);

  return (
    <>
      {/* Milestones */}
      <div className="mt-5 overflow-hidden rounded-lg border border-stone-400 bg-[#101927]">
        {milestones.map((milestone, index) => {
          const isOpen = openId === milestone.id;

          const milestonePhases = milestone.phases
            .map((phaseId) => phases.find((phase) => phase.id === phaseId))
            .filter((phase): phase is Phase => Boolean(phase));

          return (
            <div
              key={milestone.id}
              className="border-b border-stone-400 last:border-b-0"
            >
              {/* Milestone trigger */}
              <button
                type="button"
                onClick={() =>
                  setOpenId((current) =>
                    current === milestone.id ? null : milestone.id,
                  )
                }
                aria-expanded={isOpen}
                aria-controls={`milestone-content-${milestone.id}`}
                className="group flex w-full items-center justify-between gap-4 px-4 py-4 text-left transition-colors duration-150 hover:bg-[#162131] sm:px-5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                      "font-mono text-[0.7rem] font-bold",
                      "transition-colors duration-150",
                      isOpen
                        ? "bg-graphite text-[#101927]"
                        : "bg-[#182334] text-graphite-2",
                    ].join(" ")}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="min-w-0">
                    <h3 className="truncate text-[0.9rem] font-semibold text-graphite">
                      {milestone.title}
                    </h3>

                    <p className="mt-0.5 font-mono text-[0.65rem] text-graphite-3">
                      {milestonePhases.length}{" "}
                      {milestonePhases.length === 1 ? "phase" : "phases"}
                    </p>
                  </div>
                </div>

                <ChevronDown
                  className={[
                    "h-4 w-4 shrink-0",
                    "text-graphite-3",
                    "transition-transform duration-200 ease-out",
                    isOpen ? "rotate-180 text-graphite" : "",
                  ].join(" ")}
                  aria-hidden
                />
              </button>

              {/* Accordion content */}
              <div
                id={`milestone-content-${milestone.id}`}
                className={[
                  "overflow-hidden transition-[max-height,opacity]",
                  "duration-200 ease-out",
                  isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0",
                ].join(" ")}
              >
                <div className="px-4 pb-5 pt-1 sm:px-5">
                  {milestone.description && (
                    <p className="mb-4 max-w-[70ch] text-[0.78rem] leading-6 text-graphite-2">
                      {milestone.description}
                    </p>
                  )}

                  {/* Phase list */}
                  <div className="space-y-2">
                    {milestonePhases.map((phase, phaseIndex) => {
                      const topicCount = phase.topics?.length ?? 0;

                      const taskCount =
                        phase.topics?.reduce(
                          (sum, topic) => sum + (topic.tasks?.length ?? 0),
                          0,
                        ) ?? 0;

                      return (
                        <button
                          key={phase.id}
                          type="button"
                          onClick={() => handlePhaseSelect(phase)}
                          className="group flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-400 bg-[#141f2d] px-4 py-3 text-left transition-[background-color,border-color] duration-150 hover:border-stone-300 hover:bg-[#1a2738]"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#1b293b] font-mono text-[0.65rem] font-bold text-graphite-3">
                              {String(phaseIndex + 1).padStart(2, "0")}
                            </span>

                            <div className="min-w-0">
                              <h4 className="truncate text-[0.82rem] font-medium text-graphite">
                                {phase.title}
                              </h4>

                              <p className="mt-0.5 font-mono text-[0.62rem] text-graphite-3">
                                {topicCount}{" "}
                                {topicCount === 1 ? "topic" : "topics"}{" "}
                                <span className="mx-1">·</span>
                                {taskCount} {taskCount === 1 ? "task" : "tasks"}
                              </p>
                            </div>
                          </div>

                          <ArrowRight
                            className="h-3.5 w-3.5 shrink-0 text-graphite-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-graphite"
                            aria-hidden
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Phase drawer */}
      <div
        className={[
          "fixed inset-0 z-[100]",
          "transition-[visibility,opacity] duration-200",
          isDrawerOpen ? "visible opacity-100" : "invisible opacity-0",
        ].join(" ")}
        aria-hidden={!isDrawerOpen}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close phase details"
          onClick={handleDrawerClose}
          className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
        />

        {/* Drawer */}
        <aside
          className={[
            "absolute right-0 top-0 h-dvh w-full sm:w-[420px]",
            "border-l border-stone-400",
            "bg-[#101927]",
            "shadow-[-12px_0_40px_rgba(0,0,0,0.35)]",
            "transition-transform duration-200 ease-out",
            isDrawerOpen ? "translate-x-0" : "translate-x-full",
            "flex flex-col",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Phase details"
        >
          {selectedPhase && (
            <>
              {/* Drawer header */}
              <div className="shrink-0 border-b border-stone-400 bg-[#101927] px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="mb-2 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-graphite-3">
                      Phase
                    </div>

                    <h2 className="text-lg font-semibold leading-6 text-graphite">
                      {selectedPhase.title}
                    </h2>

                    {selectedPhase.category && (
                      <div className="mt-2 font-mono text-[0.65rem] text-graphite-3">
                        {selectedPhase.category}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleDrawerClose}
                    aria-label="Close"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-stone-400 bg-[#182334] text-graphite-3 transition-colors hover:bg-[#202d3e] hover:text-graphite"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex gap-2">
                  <div className="rounded-md border border-stone-400 bg-[#141f2d] px-3 py-2">
                    <div className="font-mono text-sm font-semibold text-graphite">
                      {selectedPhase.topics?.length ?? 0}
                    </div>
                    <div className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-graphite-3">
                      Topics
                    </div>
                  </div>

                  <div className="rounded-md border border-stone-400 bg-[#141f2d] px-3 py-2">
                    <div className="font-mono text-sm font-semibold text-graphite">
                      {selectedPhase.topics?.reduce(
                        (sum, topic) => sum + (topic.tasks?.length ?? 0),
                        0,
                      ) ?? 0}
                    </div>
                    <div className="mt-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-graphite-3">
                      Tasks
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer content */}
              <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d1622] px-5 py-5 sm:px-6">
                <div className="space-y-3">
                  {selectedPhase.topics?.map((topic, topicIndex) => (
                    <section
                      key={topic.id}
                      className="rounded-lg border border-stone-400 bg-[#141f2d]"
                    >
                      <div className="border-b border-stone-400 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-[0.6rem] text-graphite-3">
                            {String(topicIndex + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3 className="text-[0.8rem] font-medium text-graphite">
                              {topic.title}
                            </h3>

                            {topic.category && (
                              <p className="mt-0.5 font-mono text-[0.6rem] text-graphite-3">
                                {topic.category}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {topic.tasks?.length ? (
                          <div className="space-y-2">
                            {topic.tasks.map((task, taskIndex) => (
                              <div
                                key={task.id}
                                className="flex items-start gap-2.5 rounded-md bg-[#101927] px-3 py-2.5"
                              >
                                <span className="mt-0.5 font-mono text-[0.58rem] text-graphite-3">
                                  {String(taskIndex + 1).padStart(2, "0")}
                                </span>

                                <span className="text-[0.72rem] leading-5 text-graphite-2">
                                  {task.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="font-mono text-[0.65rem] text-graphite-3">
                            No tasks in this topic.
                          </p>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
