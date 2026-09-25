"use client";

import { cn } from "@/lib/utils";
import { Drawer } from "@/app/components/ui";
import type { RoadmapSummary } from "@/lib/types";

interface ActivateRoadmapModalProps {
  open: boolean;
  onClose: () => void;
  roadmaps: RoadmapSummary[];
  activating: boolean;
  onActivate: (roadmapId: string) => void;
}

export function ActivateRoadmapModal({
  open,
  onClose,
  roadmaps,
  activating,
  onActivate,
}: ActivateRoadmapModalProps) {
  const KNOWN_TEMPLATES = [
    { roadmapId: "fullstack-v1", title: "Full Stack Web Development" },
    { roadmapId: "sde-master-roadmap", title: "SDE Master Roadmap" },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Activate a roadmap"
    >
      <div className="space-y-8">
        <div className="mt-4 border-t border-stone-400">
          {KNOWN_TEMPLATES.map((template) => {
            const active = roadmaps.some(
              (roadmap) => roadmap.id === template.roadmapId,
            );
            return (
              <div
                key={template.roadmapId}
                className="flex items-center justify-between gap-3 border-b border-stone-400 py-3"
              >
                <span className="text-[0.9rem] font-medium text-graphite">
                  {template.title}
                </span>
                <button
                  type="button"
                  disabled={active || activating}
                  onClick={() => onActivate(template.roadmapId)}
                  className={cn(
                    "btn shrink-0 px-3 py-1.5 text-[0.75rem]",
                    active ? "btn-secondary" : "btn-primary",
                  )}
                >
                  {active
                    ? "Active"
                    : activating
                    ? "Activating"
                    : "Activate"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </Drawer>
  );
}