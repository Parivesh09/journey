"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { Stamp } from "@/app/components/ui";
import { cn } from "@/lib/utils";

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
    setSelectedPhase(null);
  };

  useEffect(() => {
    if (!isDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen]);

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
      <div className="space-y-2">
        {milestones.map((milestone, index) => {
          const isOpen = openId === milestone.id;
          const milestonePhases = milestone.phases
            .map((phaseId) => phases.find((phase) => phase.id === phaseId))
            .filter((phase): phase is Phase => Boolean(phase));

          return (
            <div key={milestone.id} className="border border-border rounded">
<button
                    type="button"
                    onClick={() =>
                      setOpenId((current) =>
                        current === milestone.id ? null : milestone.id,
                      )
                    }
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-muted/50 transition-colors"
                  >
                <div className="flex items-center gap-4">
                  <div className="font-mono text-[0.8rem] text-primary font-semibold tabular-nums w-8">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="text-[0.95rem] font-semibold text-foreground">
                      {milestone.title}
                    </h3>
                    <p className="font-mono text-[0.7rem] text-graphite-faint">
                      {milestonePhases.length} {milestonePhases.length === 1 ? "phase" : "phases"}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-graphite-faint transition-transform",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t border-border px-5 pb-4">
                  {milestone.description && (
                    <p className="py-4 text-[0.85rem] text-graphite-muted max-w-[65ch]">
                      {milestone.description}
                    </p>
                  )}

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
                          className="w-full flex items-center justify-between gap-4 px-4 py-3 border border-border rounded hover:border-border hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-mono text-[0.7rem] text-graphite-faint tabular-nums w-6">
                              {String(phaseIndex + 1).padStart(2, "0")}
                            </div>
                            <div>
                              <h4 className="text-[0.85rem] font-medium text-foreground">
                                {phase.title}
                              </h4>
                              <p className="font-mono text-[0.65rem] text-graphite-faint mt-0.5">
                                {topicCount} {topicCount === 1 ? "topic" : "topics"} · {taskCount} {taskCount === 1 ? "task" : "tasks"}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-graphite-faint" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

<div className={cn(
          "fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-4 transition-opacity",
          isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleDrawerClose}
          />
        
<aside className={cn(
            "relative w-full sm:w-[420px] h-full sm:h-auto sm:max-h-[85vh] bg-surface shadow-xl border-l sm:border border-border",
            "transition-transform duration-200",
            isDrawerOpen ? "translate-x-0" : "translate-x-full"
          )}>
          {selectedPhase && (
            <>
              <div className="border-b border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[0.65rem] uppercase tracking-wide text-graphite-faint">
                      Phase
                    </div>
                    <h2 className="text-[1.1rem] font-semibold text-graphite mt-1">
                      {selectedPhase.title}
                    </h2>
                    {selectedPhase.category && (
                      <p className="font-mono text-[0.7rem] text-graphite-faint mt-1">
                        {selectedPhase.category}
                      </p>
                    )}
                  </div>
<button
                      onClick={handleDrawerClose}
                      className="p-1 hover:bg-muted rounded"
                    >
                    <X className="h-4 w-4 text-graphite-muted" />
                  </button>
                </div>

<div className="flex gap-3 mt-4">
                <div className="border border-border rounded px-3 py-2 text-center">
                  <div className="font-mono text-[1.1rem] font-semibold text-foreground">
                    {selectedPhase.topics?.length ?? 0}
                  </div>
                  <div className="font-mono text-[0.6rem] uppercase tracking-wide text-graphite-faint">
                    Topics
                  </div>
                </div>
                <div className="border border-border rounded px-3 py-2 text-center">
                  <div className="font-mono text-[1.1rem] font-semibold text-foreground">
                      {selectedPhase.topics?.reduce(
                        (sum, topic) => sum + (topic.tasks?.length ?? 0),
                        0,
                      ) ?? 0}
                    </div>
                    <div className="font-mono text-[0.6rem] uppercase tracking-wide text-graphite-faint">
                      Tasks
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto h-[calc(100%-200px)] p-5 space-y-3">
                {selectedPhase.topics?.map((topic, topicIndex) => (
                  <div key={topic.id} className="border border-border rounded">
                    <div className="border-b border-border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[0.7rem] text-graphite-faint w-6">
                          {String(topicIndex + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3 className="text-[0.9rem] font-medium text-foreground">
                            {topic.title}
                          </h3>
                          {topic.category && (
                            <p className="font-mono text-[0.65rem] text-graphite-faint mt-0.5">
                              {topic.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-2">
                      {topic.tasks?.length ? (
                        topic.tasks.map((task, taskIndex) => (
                          <div key={task.id} className="flex gap-2.5 py-1.5">
                            <span className="font-mono text-[0.65rem] text-graphite-faint w-5">
                              {String(taskIndex + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[0.85rem] text-graphite-muted">
                              {task.title}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="font-mono text-[0.7rem] text-graphite-faint py-2">
                          No tasks in this topic
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>
      </div>
    </>
  );
}
