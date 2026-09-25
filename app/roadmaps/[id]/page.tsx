import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, Stamp } from "@/app/components/ui";
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
      <div className="flex min-h-[60vh] items-center justify-center p-6 text-bone-muted">
        Please sign in to view roadmap details.
      </div>
    );
  }

  const userActivated = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId: rawId } },
    select: { id: true },
  });

  const template = readRoadmap(rawId);
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
    <AppShell active="roadmap">
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <Link
            href="/roadmaps"
            className="inline-flex items-center gap-1.5 font-mono text-[0.75rem] text-graphite-muted hover:text-graphite mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to roadmaps
          </Link>

          <PageHeader
            title={template.title}
            subtitle={template.description}
            action={
              activated ? (
                <Stamp tone="valid">Enrolled · Active</Stamp>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary px-3 py-1.5 text-xs font-medium"
                >
                  Activate
                </button>
              )
            }
          />

          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "Phases", value: totalPhases },
              { label: "Topics", value: totalTopics },
              { label: "Tasks", value: totalTasks },
            ].map((stat) => (
              <div key={stat.label} className="border border-hairline rounded p-4 text-center">
                <div className="font-mono text-[1.5rem] font-semibold text-graphite">
                  {stat.value}
                </div>
                <div className="text-[0.7rem] uppercase tracking-wide text-graphite-faint mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {template.milestones.length > 0 && (
            <SectionHead
              index="01"
              title="Milestones"
              instruction="High-level target checkpoints in this roadmap"
            />
          )}

          <TemplateAccordion
            milestones={template.milestones}
            phases={template.phases}
          />
        </Sheet>
      </main>
    </AppShell>
  );
}
