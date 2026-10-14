import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { readRoadmap } from "@/lib/business/roadmap-templates";
import { getRoadmapExecution } from "@/lib/business/roadmap-progress";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, SectionHead, Stamp, Card, CardContent, Num } from "@/app/components/ui";
import RoadmapDetailView from "./detail-view";

export const metadata: Metadata = {
  title: "Roadmap Details",
  description: "Execute and track your roadmap progress",
};

export default async function RoadmapDetailPage({
  params,
}: {
  params: Promise<{ roadmapId: string }>;
}) {
  const user = await getCurrentUser();
  const paramsValue = await params;
  const roadmapId = paramsValue.roadmapId;

  if (!user) {
    return (
      <AppShell active="today" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">Please sign in to view roadmap execution.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  const userActivated = await prisma.userRoadmap.findUnique({
    where: { userId_roadmapId: { userId: user.id, roadmapId } },
    select: { id: true },
  });

  let template;
  try {
    template = readRoadmap(roadmapId);
  } catch {
    return (
      <AppShell active="today" user={{ name: user.name, email: user.email }}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">Roadmap not found.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  const activated = !!userActivated;

  if (!activated) {
    return (
      <AppShell active="today" user={{ name: user.name, email: user.email }}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="text-center py-12">
              <p className="text-graphite-muted">Roadmap not found or not activated.</p>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const roadmapId = formData.get("roadmapId") as string;
                  const res = await fetch("/api/roadmaps", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ roadmapId }),
                  });
                  if (res.ok) {
                    // Refresh the page
                  }
                }}
              >
                <button type="submit" className="btn btn-primary px-6 py-3 text-sm font-medium">
                  Activate Roadmap
                </button>
                <input type="hidden" name="roadmapId" value={roadmapId} />
              </form>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

  // Fetch execution data server-side
  let execution;
  try {
    execution = await getRoadmapExecution(user.id, roadmapId);
  } catch {
    return (
      <AppShell active="today" user={{ name: user.name, email: user.email }}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <Sheet>
            <div className="p-6">
              <p className="text-sm text-destructive">Failed to load roadmap execution. Please try again.</p>
            </div>
          </Sheet>
        </main>
      </AppShell>
    );
  }

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
  const totalMilestones = template.milestones.length;

  return (
    <AppShell active="today" user={{ name: user.name, email: user.email }}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <Sheet>
          <RoadmapDetailView
            userId={user.id}
            roadmapId={roadmapId}
            template={template}
            execution={execution}
            activated={activated}
            totalPhases={totalPhases}
            totalTopics={totalTopics}
            totalTasks={totalTasks}
            totalMilestones={totalMilestones}
          />
        </Sheet>
      </main>
    </AppShell>
  );
}