"use client";

import { Plus } from "lucide-react";
import { EmptyState as EmptyStateUI } from "@/app/components/ui";

interface RoadmapEmptyProps {
  title: string;
  roadmaps: Array<{ id: string; title: string; description: string | null }>;
  onActivateOpen: () => void;
}

export function RoadmapEmpty({
  title,
  roadmaps,
  onActivateOpen,
}: RoadmapEmptyProps) {
  return (
    <div className="mt-6">
      <EmptyStateUI
        title="No roadmap active"
        description="Activate one to start working through its milestones"
      />
      <button
        type="button"
        onClick={onActivateOpen}
        className="btn btn-primary mt-4"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Activate a roadmap
      </button>
    </div>
  );
}