"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, Link as LinkIcon, Edit, Trash2, Sun, Moon, Coffee, Play, Pause, RotateCcw } from "lucide-react";
import {
  SectionHead,
  Stamp,
  Bubble,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
  FormGroup,
  Dialog,
  Input,
  Caption,
  CountdownTimer,
} from "@/app/components/ui";
import { useTaskTimer } from "@/app/components/task-timer-context";
import {
  useGetDailyTasksQuery,
  useCreateTaskMutation,
  useToggleTaskCompleteTodayMutation,
  useGetRoadmapsQuery,
  useGetDailyRoadmapsQuery,
  useLinkRoadmapMutation,
  useUnlinkRoadmapMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from "@/lib/api";
import type { ApiError, RoadmapSummary } from "@/lib/types";

type Routine = {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  plannedHours: number | null;
  plannedMinutes: number | null;
  plannedSeconds: number | null;
  estimatedMinutes: number | null;
  dailySlot: string | null;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
  doneToday: boolean;
  isPersonalDaily: boolean;
};

type Connected = {
  pinId: string;
  task: {
    id: string;
    title: string;
    description?: string | null;
    status: string;
    priority: string;
    phaseTitle: string | null;
    topicTitle: string | null;
    milestoneTitle: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    plannedHours: number | null;
    plannedMinutes: number | null;
    plannedSeconds: number | null;
  };
};

type ActiveRoadmap = RoadmapSummary;

type LinkedRoadmap = {
  id: string;
  roadmapId: string;
  roadmap: {
    id: string;
    title: string;
    description: string | null;
  };
};

function RoutineRow({
  routine,
  updating,
  onToggle,
  onEdit,
  onDelete,
}: {
  routine: Routine;
  updating: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const totalSeconds = (routine.plannedHours ?? 0) * 3600 + (routine.plannedMinutes ?? 0) * 60 + (routine.plannedSeconds ?? 0);
  const showTimer = totalSeconds > 0;
  const { state, startTask, pauseTask, resumeTask, restartTask, isTaskActive, canStartTask } = useTaskTimer();

  const isActive = isTaskActive(routine.id);
  const isRunning = isActive && state.status === "running";
  const isPaused = isActive && state.status === "paused";
  const isCompleted = isActive && state.status === "completed_pending";

  const handleStart = () => {
    if (!canStartTask(routine.id)) return;
    startTask({
      id: routine.id,
      title: routine.title,
      description: routine.description,
      plannedSeconds: totalSeconds,
      kind: "routine",
      isDailyTask: true,
    });
  };

  const handlePause = () => pauseTask();
  const handleResume = () => resumeTask();
  const handleRestart = () => restartTask();

    return (
    <div className="task-row py-3 group transition-colors duration-fast hover:bg-muted/30">
      <Bubble
        filled={routine.doneToday}
        busy={updating}
        label={routine.doneToday ? "Mark not done" : "Mark done"}
        onClick={onToggle}
        disabled={showTimer && !isCompleted}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p
            className={`truncate text-sm transition-all duration-fast ${
              routine.doneToday 
                ? "text-graphite-faint line-through opacity-60" 
                : "text-foreground font-medium"
            }`}
          >
            {routine.title}
          </p>
          <Stamp tone="valid">Routine</Stamp>
        </div>
        {routine.description && (
          <p className="mt-1 truncate text-sm text-graphite-muted line-clamp-2">
            {routine.description}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <p className="font-mono text-xs text-graphite-faint">
            Every day · {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s {routine.doneToday && "· done today"}
          </p>
          {(routine.startTime ?? routine.endTime) && (
            <CountdownTimer targetTime={routine.startTime ?? routine.endTime} />
          )}
          {showTimer && isActive && (
            <span className="font-mono text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
              {String(Math.floor(state.remainingMs / 60000)).padStart(2, "0")}:{String(Math.floor((state.remainingMs % 60000) / 1000)).padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Stamp tone="neutral" className="text-xs shrink-0">
          {routine.priority}
        </Stamp>
        {showTimer && isActive && (
          <div className="flex items-center gap-1">
            {isRunning && (
              <button
                onClick={handlePause}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Pause timer"
                title="Pause timer"
              >
                <Pause className="h-3.5 w-3.5" />
              </button>
            )}
            {isPaused && (
              <button
                onClick={handleResume}
                className="p-1.5 rounded hover:bg-muted transition-colors"
                aria-label="Resume timer"
                title="Resume timer"
              >
                <Play className="h-3.5 w-3.5" />
              </button>
            )}
            {(!isRunning && !isPaused) && (
              <button
                onClick={handleRestart}
                className="p-1.5 rounded hover:bg-muted transition-colors opacity-50 cursor-not-allowed"
                aria-label="Restart timer"
                title="Restart timer"
                disabled
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        {showTimer && !isActive && canStartTask(routine.id) && (
          <button
            onClick={handleStart}
            className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors"
            aria-label="Start Task"
            title="Start Task"
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onEdit();
            }}
            className="p-1.5 rounded hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            style={{ pointerEvents: "auto", zIndex: 10 }}
            aria-label="Edit routine"
            title="Edit routine"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
            className="p-1.5 rounded hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
            style={{ pointerEvents: "auto", zIndex: 10 }}
            aria-label="Delete routine"
            title="Delete routine"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function DailyTab() {
  const {
    data: dailyData,
    isLoading: loading,
    error: dailyError,
  } = useGetDailyTasksQuery("daily");

  const { data: roadmapsData, isLoading: roadmapsLoading } =
    useGetRoadmapsQuery(undefined, {
      skip: false,
    });
  const { data: dailyRoadmapsData } = useGetDailyRoadmapsQuery();

  const [createTask, { isLoading: adding }] = useCreateTaskMutation();
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();
  const [linkRoadmap] = useLinkRoadmapMutation();
  const [unlinkRoadmap] = useUnlinkRoadmapMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const routines: Routine[] = dailyData?.routines ?? [];
  const connected: Connected[] = dailyData?.connected ?? [];
  const activeRoadmaps: ActiveRoadmap[] = roadmapsData?.roadmaps ?? [];
  const linkedRoadmaps: LinkedRoadmap[] =
    dailyRoadmapsData?.linkedRoadmaps ?? [];

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDailySlot, setNewDailySlot] = useState("");
  const [newPlannedHours, setNewPlannedHours] = useState<number | "">(0);
  const [newPlannedMinutes, setNewPlannedMinutes] = useState<number | "">(60);
  const [newPlannedSeconds, setNewPlannedSeconds] = useState<number | "">(0);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState<
    "personal" | "roadmap"
  >("personal");
  const [linkingRoadmap, setLinkingRoadmap] = useState<string | null>(null);
  const [unlinkingRoadmap, setUnlinkingRoadmap] = useState<string | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDailySlot, setEditDailySlot] = useState("");
  const [editPlannedHours, setEditPlannedHours] = useState<number | "">(0);
  const [editPlannedMinutes, setEditPlannedMinutes] = useState<number | "">(60);
  const [editPlannedSeconds, setEditPlannedSeconds] = useState<number | "">(0);
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [deletingRoutine, setDeletingRoutine] = useState<Routine | null>(null);

  const linkedRoadmapIds = useMemo(
    () => new Set(linkedRoadmaps.map((item) => item.roadmapId)),
    [linkedRoadmaps],
  );

  async function addRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setError("");
    try {
      await createTask({
        title,
        description: newDescription.trim() || undefined,
        priority: "MEDIUM",
        isPersonalDaily: true,
        dailySlot: newDailySlot || undefined,
        plannedHours: newPlannedHours !== "" && newPlannedHours !== undefined ? Number(newPlannedHours) : undefined,
        plannedMinutes: newPlannedMinutes !== "" && newPlannedMinutes !== undefined ? Number(newPlannedMinutes) : undefined,
        plannedSeconds: newPlannedSeconds !== "" && newPlannedSeconds !== undefined ? Number(newPlannedSeconds) : undefined,
        startTime: newStartTime || undefined,
        endTime: newEndTime || undefined,
      }).unwrap();
      setNewTitle("");
      setNewDescription("");
      setNewDailySlot("");
      setNewPlannedHours(0);
      setNewPlannedMinutes(60);
      setNewPlannedSeconds(0);
      setNewStartTime("");
      setNewEndTime("");
      setAddModalOpen(false);
    } catch {
      setError("Unable to add that routine. Please try again.");
    }
  }

  function extractErrorMessage(reason: unknown): string {
    if (reason && typeof reason === "object" && "data" in reason) {
      const data = (reason as { data?: ApiError }).data;
      if (data && typeof data.error === "string") {
        return data.error;
      }
    }
    return "";
  }

  async function toggleRoutine(routine: Routine) {
    setUpdating(routine.id);
    setError("");
    try {
      await toggleTaskCompleteToday(routine.id).unwrap();
    } catch {
      setError("Unable to update that routine. Please try again.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleEditRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRoutine || !editTitle.trim()) return;
    setError("");
    try {
      await updateTask({
        id: editingRoutine.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        dailySlot: editDailySlot || undefined,
        plannedHours: editPlannedHours !== "" && editPlannedHours !== undefined ? Number(editPlannedHours) : undefined,
        plannedMinutes: editPlannedMinutes !== "" && editPlannedMinutes !== undefined ? Number(editPlannedMinutes) : undefined,
        plannedSeconds: editPlannedSeconds !== "" && editPlannedSeconds !== undefined ? Number(editPlannedSeconds) : undefined,
        startTime: editStartTime || undefined,
        endTime: editEndTime || undefined,
      }).unwrap();
      setEditingRoutine(null);
      setEditTitle("");
      setEditDescription("");
      setEditDailySlot("");
      setEditPlannedHours(0);
      setEditPlannedMinutes(60);
      setEditPlannedSeconds(0);
      setEditStartTime("");
      setEditEndTime("");
      setSuccess("Routine updated successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Unable to update routine. Please try again.");
    }
  }

  async function handleDeleteRoutine() {
    if (!deletingRoutine) return;
    setError("");
    try {
      await deleteTask(deletingRoutine.id).unwrap();
      setDeletingRoutine(null);
      setSuccess("Routine deleted successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Unable to delete routine. Please try again.");
    }
}
  async function handleLinkRoadmap(roadmapId: string) {
    setLinkingRoadmap(roadmapId);
    setError("");
    try {
      await linkRoadmap(roadmapId).unwrap();
    } catch (reason: unknown) {
      const message = extractErrorMessage(reason);
      setError(message || "Unable to link roadmap.");
    } finally {
      setLinkingRoadmap(null);
    }
  }

  async function handleUnlinkRoadmap(roadmapId: string) {
    setUnlinkingRoadmap(roadmapId);
    setError("");
    try {
      await unlinkRoadmap(roadmapId).unwrap();
    } catch (reason: unknown) {
      const message = extractErrorMessage(reason);
      setError(message || "Unable to unlink roadmap.");
    } finally {
      setUnlinkingRoadmap(null);
    }
  }

  async function completeConnected(item: Connected) {
    setUpdating(item.task.id);
    setError("");
    try {
      await updateTask({ id: item.task.id, status: "COMPLETED" }).unwrap();
    } catch (reason: unknown) {
      const message = extractErrorMessage(reason);
      setError(message || "Unable to complete that task.");
    } finally {
      setUpdating(null);
    }
  }

  const remaining = routines.filter((routine) => !routine.doneToday).length;

  return (
    <div className="space-y-10">
      {(error || dailyError) && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          {error || "Unable to load your daily feed. Please try again."}
        </div>
      )}

      <div className="flex justify-between items-center pb-4 border-b border-border">
        <div>
          <h2 className="text-xl font-semibold text-foreground font-display">
            Today&apos;s Workspace
          </h2>
          <p className="text-sm text-graphite-muted">
            Personal daily routines and roadmap tasks
          </p>
        </div>
        <PrimaryButton onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Daily Task
        </PrimaryButton>
      </div>

      <section>
        <SectionHead
          index="01"
          title="Every-day Habits"
          instruction={
            routines.length === 0
              ? "Small, repeatable habits you keep regardless of roadmap"
              : `${remaining} of ${routines.length} left today. Routines reset each day.`
          }
        />

        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-12 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : routines.length === 0 ? (
          <EmptyState
            title="No routines yet"
            description="Start with one habit you can keep every day"
            action={
              <SecondaryButton
                onClick={() => {
                  setActiveTabInModal("personal");
                  setAddModalOpen(true);
                }}
              >
                Add Personal Routine
              </SecondaryButton>
            }
          />
        ) : (
          <div className="mt-6 border-t border-border">
            {routines.map((routine) => (
              <RoutineRow
                key={routine.id}
                routine={routine}
                updating={updating === routine.id}
                onToggle={() => toggleRoutine(routine)}
                onEdit={() => {
                  setEditingRoutine(routine);
                  setEditTitle(routine.title);
                  setEditDescription(routine.description ?? "");
                  setEditDailySlot(routine.dailySlot ?? "");
                  setEditPlannedMinutes(routine.plannedMinutes ?? 60);
                  setEditStartTime(routine.startTime ? new Date(routine.startTime).toISOString().slice(0, 16) : "");
                  setEditEndTime(routine.endTime ? new Date(routine.endTime).toISOString().slice(0, 16) : "");
                }}
                onDelete={() => setDeletingRoutine(routine)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHead
          index="02"
          title="Focus Tasks"
          instruction="Roadmap tasks you've pulled into your day"
          aside={`${connected.length} connected`}
        />

        {loading ? (
          <div className="mt-6 space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-muted animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : connected.length === 0 ? (
          <EmptyState
            title="Nothing connected"
            description="Pick unfinished roadmap tasks to work on here"
            action={
              <SecondaryButton
                onClick={() => {
                  setActiveTabInModal("roadmap");
                  setAddModalOpen(true);
                }}
              >
                Pull From Roadmap
              </SecondaryButton>
            }
          />
        ) : (
          <div className="mt-6 border-t border-hairline">
            {connected.map((item) => (
              <div key={item.pinId} className="task-row py-3">
                <Bubble
                  filled={false}
                  busy={updating === item.task.id}
                  label={`Complete ${item.task.title}`}
                  onClick={() => completeConnected(item)}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[0.9rem] font-medium text-graphite">
                      {item.task.title}
                    </p>
                    <Stamp tone="amber">Roadmap</Stamp>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-[0.7rem] text-graphite-faint">
                    {item.task.milestoneTitle ?? item.task.phaseTitle} /{" "}
                    {item.task.topicTitle ?? "General"}
                  </p>
                </div>
                <Stamp tone="neutral" className="text-[0.7rem]">
                  {item.task.priority}
                </Stamp>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Unified Add Task Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="card max-w-xl w-full max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-foreground font-display">
                Add Daily Task
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-graphite-muted hover:text-foreground text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-border px-6">
              <button
                type="button"
                onClick={() => setActiveTabInModal("personal")}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTabInModal === "personal"
                    ? "border-primary text-foreground"
                    : "border-transparent text-graphite-muted hover:text-foreground"
                }`}
              >
                Personal Routine
              </button>
              <button
                type="button"
                onClick={() => setActiveTabInModal("roadmap")}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTabInModal === "roadmap"
                    ? "border-primary text-foreground"
                    : "border-transparent text-graphite-muted hover:text-foreground"
                }`}
              >
                From Active Roadmap
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTabInModal === "personal" ? (
                <form onSubmit={addRoutine} className="space-y-4">
                  <FormGroup label="Routine Title">
                    <input
                      autoFocus
                      value={newTitle}
                      onChange={(event) => setNewTitle(event.target.value)}
                      placeholder="e.g. 30 min DSA Practice, Review Flashcards"
                      className="input"
                    />
                  </FormGroup>
                  <FormGroup label="Description (optional)">
                    <textarea
                      value={newDescription}
                      onChange={(event) => setNewDescription(event.target.value)}
                      placeholder="What does this routine involve?"
                      className="input min-h-[80px]"
                      rows={3}
                    />
                  </FormGroup>
                  <FormGroup label="Daily Slot (optional)">
                    <select
                      value={newDailySlot}
                      onChange={(event) => setNewDailySlot(event.target.value)}
                      className="input"
                    >
                      <option value="">None</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                    </select>
                  </FormGroup>
                  <FormGroup label="Planned Time">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="label text-xs">Hours</label>
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={newPlannedHours ?? ""}
                          onChange={(event) => setNewPlannedHours(event.target.valueAsNumber || 0)}
                          className="input"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Minutes</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={newPlannedMinutes ?? ""}
                          onChange={(event) => setNewPlannedMinutes(event.target.valueAsNumber || 0)}
                          className="input"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">Seconds</label>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={newPlannedSeconds ?? ""}
                          onChange={(event) => setNewPlannedSeconds(event.target.valueAsNumber || 0)}
                          className="input"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </FormGroup>
                  <div className="grid grid-cols-2 gap-4">
                    <FormGroup label="Start Time (optional)">
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(event) => setNewStartTime(event.target.value)}
                        className="input"
                      />
                    </FormGroup>
                    <FormGroup label="End Time (optional)">
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(event) => setNewEndTime(event.target.value)}
                        className="input"
                      />
                    </FormGroup>
                  </div>
                  <p className="caption">
                    Personal routines repeat every day and help build strong
                    study habits.
                  </p>
                  <div className="pt-4 flex justify-end gap-3">
                    <SecondaryButton onClick={() => {
                      setAddModalOpen(false);
                      setNewTitle("");
                      setNewDescription("");
                      setNewDailySlot("");
                      setNewPlannedMinutes(60);
                      setNewStartTime("");
                      setNewEndTime("");
                    }}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton
                      type="submit"
                      disabled={adding || !newTitle.trim()}
                    >
                      {adding ? "Adding..." : "Add Routine"}
                    </PrimaryButton>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-graphite-muted">
                    {
                      "Link a roadmap to automatically include its daily tasks in your workspace. Daily tasks from linked roadmaps will appear in your 'Focus Tasks' section."
                    }
                  </p>

                  {roadmapsLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-16 bg-muted animate-pulse rounded-lg"
                        />
                      ))}
                    </div>
                  ) : activeRoadmaps.length === 0 ? (
                    <EmptyState
                      title="No active roadmaps"
                      description="Activate a roadmap from the Roadmap Library first"
                      action={
                        <SecondaryButton onClick={() => setAddModalOpen(false)}>
                          Browse Roadmaps
                        </SecondaryButton>
                      }
                    />
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {activeRoadmaps.map((roadmap) => {
                        const isLinked = linkedRoadmapIds.has(roadmap.id);
                        const isLinking = linkingRoadmap === roadmap.id;
                        const isUnlinking = unlinkingRoadmap === roadmap.id;

                        return (
                          <div
                            key={roadmap.id}
                            className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/30 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {roadmap.title}
                                </p>
                                {isLinked && <Stamp tone="valid">Linked</Stamp>}
                              </div>
                              {roadmap.description && (
                                <p className="mt-1 text-xs text-graphite-faint truncate">
                                  {roadmap.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-xs text-graphite-faint">
                                <span className="flex items-center gap-1">
                                  <LinkIcon className="h-3.5 w-3.5" />
                                  {roadmap.dailyTaskCount} daily tasks
                                </span>
                              </div>
                            </div>
                            {isLinked ? (
                              <SecondaryButton
                                onClick={() => handleUnlinkRoadmap(roadmap.id)}
                                disabled={isUnlinking}
                                className="shrink-0"
                              >
                                {isUnlinking ? "Unlinking..." : "Unlink"}
                              </SecondaryButton>
                            ) : (
                              <PrimaryButton
                                onClick={() => handleLinkRoadmap(roadmap.id)}
                                disabled={isLinking}
                                className="shrink-0"
                              >
                                {isLinking ? "Linking..." : "Link Roadmap"}
                              </PrimaryButton>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
        </div>
      )}

      {/* Edit Routine Modal */}
      <Dialog
        open={!!editingRoutine}
        onClose={() => { 
          setEditingRoutine(null); 
          setEditTitle(""); 
          setEditDescription("");
          setEditDailySlot("");
          setEditPlannedHours(0);
          setEditPlannedMinutes(60);
          setEditPlannedSeconds(0);
          setEditStartTime("");
          setEditEndTime("");
        }}
        title="Edit Routine"
      >
        <form onSubmit={handleEditRoutine} className="space-y-4">
          <FormGroup label="Routine Title">
            <Input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="e.g. 30 min DSA Practice"
            />
          </FormGroup>
          <FormGroup label="Description (optional)">
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="What does this routine involve?"
              className="input min-h-[80px]"
              rows={3}
            />
          </FormGroup>
          <FormGroup label="Daily Slot (optional)">
            <select
              value={editDailySlot}
              onChange={(e) => setEditDailySlot(e.target.value)}
              className="input"
            >
              <option value="">None</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </FormGroup>
          <FormGroup label="Planned Time">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="label text-xs">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={editPlannedHours ?? ""}
                  onChange={(event) => setEditPlannedHours(event.target.valueAsNumber || 0)}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label text-xs">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editPlannedMinutes ?? ""}
                  onChange={(event) => setEditPlannedMinutes(event.target.valueAsNumber || 0)}
                  className="input"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="label text-xs">Seconds</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={editPlannedSeconds ?? ""}
                  onChange={(event) => setEditPlannedSeconds(event.target.valueAsNumber || 0)}
                  className="input"
                  placeholder="0"
                />
              </div>
            </div>
          </FormGroup>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Start Time (optional)">
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="input"
              />
            </FormGroup>
            <FormGroup label="End Time (optional)">
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="input"
              />
            </FormGroup>
          </div>
          <Caption>Changes apply to this routine going forward.</Caption>
          <div className="pt-4 flex justify-end gap-3">
            <SecondaryButton onClick={() => { 
              setEditingRoutine(null); 
              setEditTitle(""); 
              setEditDescription("");
              setEditDailySlot("");
              setEditPlannedMinutes(60);
              setEditStartTime("");
              setEditEndTime("");
            }}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!!updating || !editTitle.trim()}>
              {updating ? "Saving..." : "Save Changes"}
            </PrimaryButton>
          </div>
        </form>
      </Dialog>

      {/* Delete Routine Confirmation */}
      <Dialog
        open={!!deletingRoutine}
        onClose={() => setDeletingRoutine(null)}
        title="Delete Routine"
        description="This will permanently remove the routine and its history."
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete <strong className="font-medium">{deletingRoutine?.title}</strong>?
            This cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <SecondaryButton onClick={() => setDeletingRoutine(null)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton
              onClick={handleDeleteRoutine}
              disabled={!!updating}
              className="btn-destructive"
            >
              {updating ? "Deleting..." : "Delete Routine"}
            </PrimaryButton>
          </div>
        </div>
      </Dialog>

      {success && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success animate-slide-up">
          {success}
        </div>
      )}
    </div>
  );
}

function ConnectedRow({
  item,
  updating,
  onComplete,
}: {
  item: Connected;
  updating: boolean;
  onComplete: () => void;
}) {
  return (
    <div className="task-row py-3 group">
      <Bubble
        filled={false}
        busy={updating}
        label={`Complete ${item.task.title}`}
        onClick={onComplete}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {item.task.title}
          </p>
          <Stamp tone="amber">Roadmap</Stamp>
        </div>
        {item.task.description && (
          <p className="mt-1 truncate text-sm text-graphite-muted line-clamp-2">
            {item.task.description}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-3 flex-wrap">
          <p className="flex items-center gap-2 font-mono text-xs text-graphite-faint">
            <Moon className="h-3.5 w-3.5" />
            <span>
              {item.task.milestoneTitle ?? item.task.phaseTitle} / {item.task.topicTitle ?? "General"}
            </span>
          </p>
          {(item.task.startTime ?? item.task.endTime) && (
            <CountdownTimer targetTime={item.task.startTime ?? item.task.endTime} />
          )}
        </div>
      </div>
      <Stamp tone="neutral" className="text-xs">
        {item.task.priority}
      </Stamp>
    </div>
  );
}

function getSlotIcon(slot: string | null) {
  if (!slot) return <Coffee className="h-3.5 w-3.5" />;
  const s = slot.toLowerCase();
  if (s.includes("morning")) return <Sun className="h-3.5 w-3.5" />;
  if (s.includes("afternoon")) return <Sun className="h-3.5 w-3.5" />;
  if (s.includes("evening")) return <Moon className="h-3.5 w-3.5" />;
  return <Coffee className="h-3.5 w-3.5" />;
}
