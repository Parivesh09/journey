import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppShell from "@/app/components/shell";
import VisualizationClient from "./visualize-client";
import { readRoadmap } from "@/lib/business/roadmap-templates";

export const metadata: Metadata = {
  title: "Visualization",
  description: "Interactive roadmap visualization",
};

export default async function VisualizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const paramsValue = await params;
  const id = paramsValue.id;

  const user = await getCurrentUser();
  if (!user) {
    return (
      <AppShell active="roadmap" user={null}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <div className="sheet m-auto my-6 max-w-[1280px] px-8 py-8">
            <div className="text-center py-12">
              <p className="text-graphite-muted">Please sign in to view visualizations.</p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  // Fetch roadmap info
  const [roadmapTemplate, config] = await Promise.all([
    readRoadmap(id),
    prisma.roadmapVisualizationConfig.findUnique({ where: { roadmapId: id } }),
  ]);

  if (!roadmapTemplate) {
    return (
      <AppShell active="roadmap" user={{ name: user.name, email: user.email }}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <div className="sheet m-auto my-6 max-w-[1280px] px-8 py-8">
            <div className="text-center py-12">
              <p className="text-graphite-muted">Roadmap not found.</p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  if (!config?.archifyEnabled) {
    return (
      <AppShell active="roadmap" user={{ name: user.name, email: user.email }}>
        <main className="px-6 py-8 sm:px-8 lg:px-12">
          <div className="sheet m-auto my-6 max-w-[1280px] px-8 py-8">
            <div className="text-center py-12">
              <p className="text-graphite-muted">
                Visualization is not enabled for this roadmap.
              </p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell active="roadmap" user={{ name: user.name, email: user.email }}>
      <main className="px-6 py-8 sm:px-8 lg:px-12">
        <VisualizationClient
          id={id}
          roadmapTitle={roadmapTemplate.title}
          defaultDiagramType={config.defaultDiagramType ?? "architecture"}
        />
      </main>
    </AppShell>
  );
}