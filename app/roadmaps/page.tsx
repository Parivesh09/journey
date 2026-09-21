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
import { SectionHead, Stamp } from "@/app/components/ui";
import ActivateButton from "./activate-button";

export const metadata: Metadata = {
  title: "Roadmaps — Library",
  description: "Browse and activate roadmap templates",
};

export default async function RoadmapsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-bone-2">
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
    <AppShell active="roadmaps">
      <main className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="sheet overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
          <SectionHead
            index="01"
            title="Roadmap library"
            instruction="Pick a curriculum track to inspect its full structure, then enroll to schedule it into your daily plan."
            aside={`${validTemplates.length} tracks`}
          />

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                  className="group sheet flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[1.05rem] font-bold tracking-tight text-graphite group-hover:text-amber-ink">
                          {template.title}
                        </h3>
                        {template.description && (
                          <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-5 text-graphite-2">
                            {template.description}
                          </p>
                        )}
                      </div>
                      {activated ? (
                        <Stamp tone="valid" className="shrink-0">
                          Enrolled
                        </Stamp>
                      ) : (
                        <Stamp tone="amber" className="shrink-0">
                          Available
                        </Stamp>
                      )}
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-stone-400 bg-paper/40 px-2 py-2 text-center">
                        <div className="font-mono text-[1.05rem] font-bold text-graphite">
                          {totalPhases}
                        </div>
                        <div className="mt-0.5 text-[0.62rem] uppercase tracking-wider text-graphite-3">
                          Phases
                        </div>
                      </div>
                      <div className="rounded-lg border border-stone-400 bg-paper/40 px-2 py-2 text-center">
                        <div className="font-mono text-[1.05rem] font-bold text-graphite">
                          {totalTopics}
                        </div>
                        <div className="mt-0.5 text-[0.62rem] uppercase tracking-wider text-graphite-3">
                          Topics
                        </div>
                      </div>
                      <div className="rounded-lg border border-stone-400 bg-paper/40 px-2 py-2 text-center">
                        <div className="font-mono text-[1.05rem] font-bold text-graphite">
                          {totalTasks}
                        </div>
                        <div className="mt-0.5 text-[0.62rem] uppercase tracking-wider text-graphite-3">
                          Tasks
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-5">
                      {activated ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-[0.72rem] font-medium text-valid">
                          <span className="h-1.5 w-1.5 rounded-full bg-valid" />
                          Enrolled · active in your plan
                        </span>
                      ) : (
                        <ActivateButton templateId={template.id} />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-stone-400 bg-paper/50 px-5 py-3">
                    <span className="font-mono text-[0.68rem] text-graphite-3">
                      {template.milestones.length} milestones
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono text-[0.7rem] font-medium text-amber-ink transition-colors group-hover:text-amber">
                      View details
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
