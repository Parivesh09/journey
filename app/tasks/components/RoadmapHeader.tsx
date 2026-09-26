"use client";

import { Plus } from "lucide-react";
import { SectionHead, Stamp } from "@/app/components/ui";
import type { RoadmapSummary, MilestonesData } from "@/lib/types";

interface RoadmapHeaderProps {
  data: MilestonesData | null;
  title: string;
  selectedId: string;
  roadmaps: RoadmapSummary[];
  onSelectChange: (id: string) => void;
  onActivateOpen: () => void;
}

export function RoadmapHeader({
  data,
  title,
  selectedId,
  roadmaps,
  onSelectChange,
  onActivateOpen,
}: RoadmapHeaderProps) {
  return (
    <section>
      {data ? (
        <>
          <SectionHead
            index="01"
            title={data.roadmap.title}
            instruction={data.roadmap.description}
            aside={`${data.milestones.length} milestones`}
          />
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="min-w-[12rem] flex-1 text-[0.72rem] font-semibold text-graphite-muted">
              Active roadmap
              <select
                value={selectedId}
                onChange={(event) => onSelectChange(event.target.value)}
                className="field mt-1 appearance-none pr-6"
              >
                {roadmaps.length === 0 ? (
                  <option value="">No active roadmap</option>
                ) : (
                  roadmaps.map((roadmap) => (
                    <option key={roadmap.id} value={roadmap.id}>
                      {roadmap.title}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={onActivateOpen}
              className="btn btn-secondary shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Activate
            </button>
          </div>
        </>
      ) : (
        <>
          <SectionHead
            index="01"
            title={title}
            instruction="Milestones gate each other — a milestone unlocks only when its prerequisites are done."
          />
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="min-w-[12rem] flex-1 text-[0.72rem] font-semibold text-graphite-muted">
              Active roadmap
              <select
                value={selectedId}
                onChange={(event) => onSelectChange(event.target.value)}
                className="field mt-1 appearance-none pr-6"
              >
                {roadmaps.length === 0 ? (
                  <option value="">No active roadmap</option>
                ) : (
                  roadmaps.map((roadmap) => (
                    <option key={roadmap.id} value={roadmap.id}>
                      {roadmap.title}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={onActivateOpen}
              className="btn btn-secondary shrink-0"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Activate
            </button>
          </div>
        </>
      )}
    </section>
  );
}