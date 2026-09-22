import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  readRoadmap,
  ROADMAP_IDS,
  type RoadmapTemplate,
} from "@/lib/business/roadmap-templates";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, Stamp } from "@/app/components/ui";
import ActivateButton from "./activate-button";

export const metadata: Metadata = {
  title: "Roadmaps — Library",
  description: "Browse and activate roadmap templates",
};

export default async function RoadmapsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-bone-muted">
        Please sign in to browse roadmaps.
      </div>
    );
  }

  const activatedRoadmapIds = await prisma.userRoadmap
    .findMany({
      where: { userId: user.id },
      select: { roadmapId: true },
    })
    .then((rows) => rows.map((r) => r.roadmapId));

  const templates = await Promise.all(
    ROADMAP_IDS.map(async (publicId) => {
      try {
        const template = readRoadmap(publicId);
        const activated = activatedRoadmapIds.includes(template.id);
        return { template, activated };
      } catch (error) {
        console.error(`Failed to load template ${publicId}:`, error);
        return null;
      }
    }),
  );

  const validTemplates = templates.filter(
    (t): t is { template: RoadmapTemplate; activated: boolean } => t !== null,
  );

  return (
    <AppShell active="roadmap">
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <PageHeader
            title="Roadmap Library"
            subtitle="Pick a curriculum track to inspect its full structure, then enroll to schedule it into your daily plan"
          />

          <SectionHead
            index="01"
            title="Available Tracks"
            aside={`${validTemplates.length} tracks`}
          />

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {validTemplates.map(({ template, activated }) => {
              const totalPhases = template.phases.length;
              const totalTopics = template.phases.reduce(
                (sum, p) => sum + (p.topics ?? []).length,
                0,
              );
              const totalTasks = template.phases.reduce(
                (sum, p) =>
                  sum +
                  (p.topics ?? []).reduce(
                    (tSum, t) => tSum + (t.tasks ?? []).length,
                    0,
                  ),
                0,
              );

              return (
                <Link
                  key={template.id}
                  href={`/roadmaps/${template.id}`}
                  className="group border border-hairline rounded hover:border-hairline-strong transition-colors bg-paper"
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[1.05rem] font-semibold text-graphite group-hover:text-amber-ink">
                          {template.title}
                        </h3>
                        {template.description && (
                          <p className="mt-2 text-[0.85rem] leading-relaxed text-graphite-muted line-clamp-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      <Stamp tone={activated ? "valid" : "amber"} className="shrink-0">
                        {activated ? "Enrolled" : "Available"}
                      </Stamp>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="text-center py-2 border border-hairline rounded">
                        <div className="font-mono text-[1.1rem] font-semibold text-graphite">
                          {totalPhases}
                        </div>
                        <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
                          Phases
                        </div>
                      </div>
                      <div className="text-center py-2 border border-hairline rounded">
                        <div className="font-mono text-[1.1rem] font-semibold text-graphite">
                          {totalTopics}
                        </div>
                        <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
                          Topics
                        </div>
                      </div>
                      <div className="text-center py-2 border border-hairline rounded">
                        <div className="font-mono text-[1.1rem] font-semibold text-graphite">
                          {totalTasks}
                        </div>
                        <div className="text-[0.65rem] uppercase tracking-wide text-graphite-faint mt-0.5">
                          Tasks
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between">
                      <span className="font-mono text-[0.7rem] text-graphite-faint">
                        {template.milestones.length} milestones
                      </span>
                      <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] text-amber-ink group-hover:text-highlighter-amber">
                        View
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}
