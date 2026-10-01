"use client";

import { useState } from "react";
import { ChevronDown, Play, Pause, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskTimer } from "@/lib/store/timer-hooks";
import type { RoadmapTemplatePhase, RoadmapTemplateTopic, RoadmapTemplateTask, RoadmapTemplateMilestone } from "@/lib/types/roadmap";

type Phase = RoadmapTemplatePhase;
type Milestone = RoadmapTemplateMilestone;

interface TemplateAccordionProps {
  milestones: Milestone[];
  phases: Phase[];
  enableTaskTimer?: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function TaskItemNoTimer({
  task,
  taskIndex,
}: {
  task: RoadmapTemplateTask;
  taskIndex: number;
}) {
  return (
    <div className="flex gap-2.5 py-1.5">
      <span className="font-mono text-[0.65rem] text-graphite-faint w-5">
        {String(taskIndex + 1).padStart(2, "0")}
      </span>
      <span className="text-[0.85rem] text-graphite-muted">
        {task.title}
      </span>
    </div>
  );
}

function TaskItemWithTimer({
  task,
  taskIndex,
  phaseTitle,
  topicTitle,
}: {
  task: RoadmapTemplateTask;
  taskIndex: number;
  phaseTitle: string;
  topicTitle: string;
}) {
  const { state, startTask, pauseTask, resumeTask, restartTask, isTaskActive, canStartTask } = useTaskTimer();
  const totalSeconds = (task.plannedHours ?? 0) * 3600 + (task.plannedMinutes ?? 0) * 60 + (task.plannedSeconds ?? 0);

  const isActive = isTaskActive(task.id);
  const isRunning = isActive && state.status === "running";
  const isPaused = isActive && state.status === "paused";
  const isCompleted = isActive && state.status === "completed_pending";

  const handleStart = () => {
    if (!canStartTask(task.id)) return;
    startTask({
      id: task.id,
      title: task.title,
      description: null,
      plannedSeconds: totalSeconds,
      kind: "roadmap",
      isDailyTask: false,
      phaseTitle,
      topicTitle,
    });
  };

  const handlePause = () => pauseTask();
  const handleResume = () => resumeTask();
  const handleRestart = () => restartTask();

  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="font-mono text-[0.65rem] text-graphite-faint w-5">
        {String(taskIndex + 1).padStart(2, "0")}
      </span>
      <span className="text-[0.85rem] text-graphite-muted flex-1 min-w-0 truncate">
        {task.title}
      </span>
      {totalSeconds > 0 && (
        <span className="font-mono text-[0.65rem] text-graphite-faint w-16 text-right">
          {formatTime(totalSeconds * 1000)}
        </span>
      )}
      {totalSeconds > 0 && isActive && (
        <span className="font-mono text-[0.65rem] text-destructive w-16 text-right">
          {formatTime(state.remainingMs)}
        </span>
      )}
      {totalSeconds > 0 && isActive && (
        <div className="flex items-center gap-1">
          {isRunning && (
            <button
              onClick={handlePause}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Pause timer"
              title="Pause"
            >
              <Pause className="w-3.5 h-3.5" />
            </button>
          )}
          {isPaused && (
            <button
              onClick={handleResume}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Resume timer"
              title="Resume"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
          {isCompleted && (
            <button
              onClick={handleRestart}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="Restart timer"
              title="Restart"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      {totalSeconds > 0 && !isActive && canStartTask(task.id) && (
        <button
          onClick={handleStart}
          className="p-1 rounded hover:bg-primary/10 hover:text-primary transition-colors"
          aria-label="Start timer"
          title="Start timer"
        >
          <Play className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function TaskItem({
  task,
  taskIndex,
  phaseTitle,
  topicTitle,
  enableTaskTimer,
}: {
  task: RoadmapTemplateTask;
  taskIndex: number;
  phaseTitle: string;
  topicTitle: string;
  enableTaskTimer: boolean;
}) {
  if (!enableTaskTimer) {
    return <TaskItemNoTimer task={task} taskIndex={taskIndex} />;
  }
  return (
    <TaskItemWithTimer
      task={task}
      taskIndex={taskIndex}
      phaseTitle={phaseTitle}
      topicTitle={topicTitle}
    />
  );
}

function TopicBlock({
  topic,
  phaseTitle,
  enableTaskTimer,
}: {
  topic: RoadmapTemplateTopic;
  phaseTitle: string;
  enableTaskTimer: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="ml-4 border-l border-border pl-4">
      <div className="flex items-center gap-2 py-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <ChevronDown className={cn("w-4 h-4 text-graphite-muted transition-transform", isOpen && "rotate-180")} />
        <span className="text-sm font-medium text-foreground">{topic.title}</span>
        {topic.tasks && topic.tasks.length > 0 && (
          <span className="text-xs text-graphite-faint">({topic.tasks.length})</span>
        )}
      </div>
      {isOpen && topic.tasks && (
        <div className="space-y-0.5 mt-1">
          {topic.tasks.map((task, idx) => (
            <TaskItem
              key={task.id}
              task={task}
              taskIndex={idx}
              phaseTitle={phaseTitle}
              topicTitle={topic.title}
              enableTaskTimer={enableTaskTimer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseBlock({
  phase,
  enableTaskTimer,
}: {
  phase: RoadmapTemplatePhase;
  enableTaskTimer: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 py-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <ChevronDown className={cn("w-5 h-5 text-graphite-muted transition-transform", isOpen && "rotate-180")} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{phase.title}</span>
            {phase.category && (
              <span className="badge badge-secondary text-xs">{phase.category}</span>
            )}
          </div>
        </div>
      </div>
      {isOpen && phase.topics && (
        <div className="ml-4 space-y-1">
          {phase.topics.map((topic) => (
            <TopicBlock
              key={topic.id}
              topic={topic}
              phaseTitle={phase.title}
              enableTaskTimer={enableTaskTimer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MilestoneCard({
  milestone,
  enableTaskTimer,
}: {
  milestone: RoadmapTemplateMilestone;
  enableTaskTimer: boolean;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="card mb-4">
      <div className="p-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <ChevronDown className={cn("w-5 h-5 text-graphite-muted transition-transform", isOpen && "rotate-180")} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="badge badge-primary text-xs font-medium">Milestone</span>
              <h3 className="text-lg font-semibold text-foreground">{milestone.title}</h3>
            </div>
            {milestone.description && (
              <p className="mt-1 text-sm text-graphite-muted">{milestone.description}</p>
            )}
          </div>
        </div>
      </div>
      {isOpen && milestone.phases && (
        <div className="px-4 pb-4">
          {milestone.phases.map((phaseId) => {
            // This would need the phases data passed in
            return null;
          })}
        </div>
      )}
    </div>
  );
}

export default function TemplateAccordion({
  milestones,
  phases,
  enableTaskTimer = true,
}: TemplateAccordionProps) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone) => (
        <div key={milestone.id} className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
            <span className="badge badge-primary text-sm font-medium">Milestone</span>
            <h3 className="text-lg font-semibold text-foreground">{milestone.title}</h3>
            {milestone.description && (
              <p className="text-sm text-graphite-muted ml-10">{milestone.description}</p>
            )}
          </div>
          {milestone.phases && milestone.phases.length > 0 && (
            <div className="ml-10 space-y-2">
              {milestone.phases.map((phaseId) => {
                const phase = phases.find((p) => p.id === phaseId);
                if (!phase) return null;
                return (
                  <PhaseBlock
                    key={phase.id}
                    phase={phase}
                    enableTaskTimer={enableTaskTimer}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}