import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import AppShell from "@/app/components/shell";
import { SectionHead, Stamp } from "@/app/components/ui";
import ActivateButton from "../activate-button";
import TemplateAccordion from "../template-accordion";

export const metadata: Metadata = {
  title: "Roadmap Details",
  description: "Explore roadmap structure, phases, topics, and tasks",
};

export default async function RoadmapDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const paramsValue = await params;
  const rawId = paramsValue.id;

  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-bone-2">
        Please sign in to view roadmap details.
      </div>
    );
  }

  const userActivated = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: rawId } },
    select: { id: true },
  });

  const template = readRoadmap(rawId);
  console.log("template", template);
  const activated = !!userActivated;

  const totalPhases = template.phases.length;
  const totalTopics = template.phases.reduce(
    (sum, p) => sum + (p.topics ?? []).length,
    0,
  );
  const totalTasks = template.phases.reduce(
    (sum, p) =>
      sum +
      (p.topics ?? []).reduce((tSum, t) => tSum + (t.tasks ?? []).length, 0),
    0,
  );

  return (
    <AppShell active="roadmaps">
      <main className="mx-auto max-w-[1120px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="sheet overflow-hidden px-5 py-7 sm:px-8 sm:py-9">
          <Link
            href="/roadmaps"
            className="mb-6 inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-graphite-2 hover:text-graphite"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to roadmaps
          </Link>

          <div className="flex flex-col gap-4 border-b border-stone-400 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-graphite sm:text-3xl">
                  {template.title}
                </h1>
                {activated ? (
                  <Stamp tone="valid">Enrolled</Stamp>
                ) : (
                  <Stamp tone="amber">Available</Stamp>
                )}
              </div>
              {template.description && (
                <p className="mt-2 max-w-[65ch] text-[0.875rem] leading-6 text-graphite-2">
                  {template.description}
                </p>
              )}
            </div>

            <div className="shrink-0">
              {activated ? (
                <span className="inline-flex  items-center gap-1.5 font-mono text-[0.75rem] font-medium text-valid">
                  ✓ Active in your workspace
                </span>
              ) : (
                <ActivateButton templateId={template.id} />
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-stone-400 bg-[#101927]">
              <div className="text-[1.2rem] font-bold text-graphite">
                {totalPhases}
              </div>
              <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-graphite-3">
                Phases
              </div>
            </div>
            <div>
              <div className="text-[1.2rem] font-bold text-graphite">
                {totalTopics}
              </div>
              <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-graphite-3">
                Topics
              </div>
            </div>
            <div>
              <div className="text-[1.2rem] font-bold text-graphite">
                {totalTasks}
              </div>
              <div className="mt-0.5 text-[0.65rem] uppercase tracking-wider text-graphite-3">
                Total Tasks
              </div>
            </div>
          </div>

          {template.milestones.length > 0 && (
            <section className="mt-8 border-t border-stone-400 pt-6">
              <SectionHead
                index="01"
                title="Milestones"
                instruction="High-level target checkpoints in this roadmap."
              />

              <TemplateAccordion
                milestones={template.milestones}
                phases={template.phases}
              />
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}

{
  /* <section className="mt-8 border-t border-stone-400 pt-6">
            <SectionHead
              index="02"
              title="Full Syllabus"
              instruction="Every phase and topic included when you enroll."
            />
            <div className="mt-5 space-y-6">
              {template.phases.map((phase, pIdx) => {
                const phaseTopics = phase.topics ?? [];
                const phaseTaskCount = phaseTopics.reduce(
                  (sum, t) => sum + (t.tasks ?? []).length,
                  0,
                );

                return (
                  <div
                    key={phase.id}
                    className="p-5 rounded-lg border border-stone-400 bg-[#101927]"
                  >
                    <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-3 font-mono text-[0.7rem] font-bold text-graphite-2">
                          {pIdx + 1}
                        </span>
                        <h3 className="text-[0.95rem] font-semibold text-graphite">
                          {phase.title}
                        </h3>
                      </div>
                      <span className="font-mono text-[0.72rem] text-graphite-3">
                        {phaseTopics.length} topics · {phaseTaskCount} tasks
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {phaseTopics.map((topic) => {
                        const tCount = (topic.tasks ?? []).length;
                        return (
                          <div
                            key={topic.id}
                            className="flex items-center justify-between rounded-lg border border-stone-400 bg-ink-2 px-3 py-2 text-[0.8rem]"
                          >
                            <span
                              className="truncate font-medium text-graphite"
                              title={topic.title}
                            >
                              {topic.title}
                            </span>
                            <span className="ml-2 shrink-0 font-mono text-[0.68rem] text-graphite-3">
                              {tCount} {tCount === 1 ? "task" : "tasks"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section> */
}
