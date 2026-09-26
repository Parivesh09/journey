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
import { PageHeader, Sheet, SectionHead, Stamp, Card, CardContent, Num } from "@/app/components/ui";

export const metadata: Metadata = {
  title: "Roadmaps — Library",
  description: "Browse and activate roadmap templates",
};

export default async function RoadmapsPage() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppShell active="roadmap" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">Please sign in to browse roadmaps.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
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

  const enrolledCount = validTemplates.filter(t => t.activated).length;

  return (
    <AppShell active="roadmap" user={{ name: user.name, email: user.email }}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          {/* Hero */}
          <div className="mb-10">
            <p className="text-lg text-graphite-muted mb-2">Your path to SDE mastery.</p>
            <p className="text-sm text-graphite-faint">Pick a curriculum track to inspect its full structure, then enroll to schedule it into your daily plan.</p>
          </div>

          <PageHeader
            title="Roadmap Library"
            subtitle={`${validTemplates.length} tracks · ${enrolledCount} enrolled`}
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
                  className="group"
                >
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary font-display">
                            {template.title}
                          </h3>
                          {template.description && (
                            <p className="mt-2 text-sm leading-relaxed text-graphite-muted line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <Stamp tone={activated ? "valid" : "amber"} className="shrink-0">
                          {activated ? "Enrolled" : "Available"}
                        </Stamp>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="text-center py-3 rounded-lg bg-muted">
                          <div className="font-mono text-xl font-semibold text-foreground">
                            <Num>{totalPhases}</Num>
                          </div>
                          <div className="label">Phases</div>
                        </div>
                        <div className="text-center py-3 rounded-lg bg-muted">
                          <div className="font-mono text-xl font-semibold text-foreground">
                            <Num>{totalTopics}</Num>
                          </div>
                          <div className="label">Topics</div>
                        </div>
                        <div className="text-center py-3 rounded-lg bg-muted">
                          <div className="font-mono text-xl font-semibold text-foreground">
                            <Num>{totalTasks}</Num>
                          </div>
                          <div className="label">Tasks</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                        <span className="font-mono text-xs text-graphite-faint">
                          {template.milestones.length} milestones
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-xs text-primary group-hover:text-primary/80">
                          View
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </Sheet>
      </main>
    </AppShell>
  );
}