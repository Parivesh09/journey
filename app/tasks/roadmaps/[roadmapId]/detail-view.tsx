"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Play, Pause, RotateCcw } from "lucide-react";
import { useRoadmapItemActionMutation } from "@/lib/api";
import { useTaskTimer } from "@/app/components/task-timer-context";
import { useRouter } from "next/navigation";
import { PageHeader, Sheet, SectionHead, Stamp, Card, CardContent, Num, ProgressBar, Bubble } from "@/app/components/ui";
import TemplateAccordion from "../../../roadmaps/template-accordion";
import type { RoadmapExecution, MilestoneExecution, TopicExecution, TaskExecution } from "@/lib/types/roadmap-execution";

interface RoadmapDetailViewProps {
  userId: string;
  roadmapId: string;
  template: any;
  execution: RoadmapExecution | null;
  activated: boolean;
  totalPhases: number;
  totalTopics: number;
  totalTasks: number;
  totalMilestones: number;
}

export default function RoadmapDetailView({
  userId,
  roadmapId,
  template,
  execution,
  activated,
  totalPhases,
  totalTopics,
  totalTasks,
  totalMilestones,
}: RoadmapDetailViewProps) {
  const [itemId, setItemId] = React.useState<string | null>(null);
  const [action, setAction] = React.useState<string>("start");
  const router = useRouter();
  const { mutate: roadmapItemAction } = useRoadmapItemActionMutation();
  const { startTimer, pauseTimer, resumeTimer, resetTimer, activeTask } = useTaskTimer();

  if (!execution) {
    return (
      <Sheet>
        <div className="text-center py-12">
          <p className="text-graphite-muted">Roadmap not found or not activated.</p>
        </div>
      </Sheet>
    );
  }

  const handleItemAction = async (e: React.MouseEvent, id: string, act: string) => {
    e.preventDefault();
    e.stopPropagation();
    setItemId(id);
    setAction(act);
    
    try {
      await roadmapItemAction({ itemId: id, action: act, roadmapId }).unwrap();
      // In a real implementation, we would refetch or update optimistically
    } catch (error) {
      console.error("Failed to perform roadmap item action:", error);
    } finally {
      setItemId(null);
      setAction("start");
    }
  };

  const handleStartTimer = (id: string) => {
    startTimer({
      id,
      kind: execution?.kind ?? "roadmap-item",
      roadmapId,
      topicId: undefined,
      milestoneId: undefined,
    });
  };

  const handlePauseTimer = () => {
    pauseTimer();
  };

  const handleResumeTimer = () => {
    resumeTimer();
  };

  const handleResetTimer = () => {
    resetTimer();
  };

  return (
    <>
      <Link
        href="/tasks/roadmaps"
        className="inline-flex items-center gap-1.5 font-mono text-sm text-graphite-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to roadmaps
      </Link>

      {/* Hero Section */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2-2"></path></svg>
              </div>
              <div>
                <p className="label text-primary">Roadmap</p>
                <h1 className="text-3xl font-bold text-foreground font-display tracking-tight">
                  {template.title}
                </h1>
              </div>
            </div>
            {template.description && (
              <p className="text-base text-graphite-muted max-w-2xl leading-relaxed">
                {template.description}
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            {activated ? (
              <>
                <Stamp tone="valid" className="text-sm">Enrolled · Active</Stamp>
                {/* Visualization Button */}
                <a
                  href={`/roadmaps/${roadmapId}/visualize`}
                  className="btn btn-secondary px-4 py-2 text-sm font-medium ml-3"
                >
                  ✦ Visualize
                </a>
              </>
            ) : null}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2"></path></svg>
              </div>
              <div>
                <p className="label">Milestones</p>
                <p className="text-2xl font-bold text-foreground font-display">
                  <Num>{totalMilestones}</Num>
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <p className="label">Phases</p>
                <p className="text-2xl font-bold text-foreground font-display">
                  <Num>{totalPhases}</Num>
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <p className="label">Topics</p>
                <p className="text-2xl font-bold text-foreground font-display">
                  <Num>{totalTopics}</Num>
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <p className="label">Tasks</p>
                <p className="text-2xl font-bold text-foreground font-display">
                  <Num>{totalTasks}</Num>
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div>
                <p className="label">Time Spent</p>
                <p className="text-2xl font-bold text-foreground font-display">
                  {execution?.timeProgress.actualSeconds !== undefined 
                    ? `${Math.floor(execution.timeProgress.actualSeconds / 3600)}h ${Math.floor((execution.timeProgress.actualSeconds % 3600) / 60)}m ${execution.timeProgress.actualSeconds % 60}s`
                    : "0h 0m 0s"}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="label">Overall Progress</span>
          <span className="font-mono text-lg font-semibold text-primary">
            {execution?.progress.percent ?? 0}%
          </span>
        </div>
        <ProgressBar value={execution?.progress.percent ?? 0} />
        <p className="mt-2 caption">
          {execution?.progress.completed ?? 0} of {execution?.progress.total ?? 0} tasks complete
        </p>
      </div>

      {/* Milestones Section */}
      {execution.milestones.length > 0 && (
        <>
          <SectionHead
            index="01"
            title="Milestones"
            instruction="High-level target checkpoints in this roadmap"
          />
          <TemplateAccordion
            milestones={execution.milestones}
            phases={template.phases}
            enableTaskTimer={true}
          />
        </>
      )}
     </>
   );
 }