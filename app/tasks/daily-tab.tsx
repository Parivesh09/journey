"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import {
  SectionHead,
  Stamp,
  Bubble,
  PrimaryButton,
  SecondaryButton,
  EmptyState,
} from "@/app/components/ui";
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
import { AddDailyTaskModal } from "./components/AddDailyTaskModal";
import { RoutineRow } from "./components/RoutineRow";
import { EditRoutineModal } from "./components/EditRoutineModal";
import { DeleteRoutineDialog } from "./components/DeleteRoutineDialog";
import type { ApiError } from "@/lib/types";
import type {
  Routine,
  Connected,
  ActiveRoadmap,
  LinkedRoadmap,
} from "./components/daily-types";

export default function DailyTab() {
  const {
    data: dailyData,
    isLoading: loading,
    error: dailyError,
  } = useGetDailyTasksQuery({ tab: "daily" });

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

  console.log("edit routine", editingRoutine);
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
        plannedHours:
          newPlannedHours !== "" && newPlannedHours !== undefined
            ? Number(newPlannedHours)
            : undefined,
        plannedMinutes:
          newPlannedMinutes !== "" && newPlannedMinutes !== undefined
            ? Number(newPlannedMinutes)
            : undefined,
        plannedSeconds:
          newPlannedSeconds !== "" && newPlannedSeconds !== undefined
            ? Number(newPlannedSeconds)
            : undefined,
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
        plannedHours:
          editPlannedHours !== "" && editPlannedHours !== undefined
            ? Number(editPlannedHours)
            : undefined,
        plannedMinutes:
          editPlannedMinutes !== "" && editPlannedMinutes !== undefined
            ? Number(editPlannedMinutes)
            : undefined,
        plannedSeconds:
          editPlannedSeconds !== "" && editPlannedSeconds !== undefined
            ? Number(editPlannedSeconds)
            : undefined,
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
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
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
                  setEditStartTime(
                    routine.startTime
                      ? new Date(routine.startTime).toISOString().slice(0, 16)
                      : "",
                  );
                  setEditEndTime(
                    routine.endTime
                      ? new Date(routine.endTime).toISOString().slice(0, 16)
                      : "",
                  );
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
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
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

      {addModalOpen && (
        <AddDailyTaskModal
          onClose={() => setAddModalOpen(false)}
          activeTabInModal={activeTabInModal}
          setActiveTabInModal={setActiveTabInModal}
          newTitle={newTitle}
          setNewTitle={setNewTitle}
          newDescription={newDescription}
          setNewDescription={setNewDescription}
          newDailySlot={newDailySlot}
          setNewDailySlot={setNewDailySlot}
          newPlannedHours={newPlannedHours}
          setNewPlannedHours={setNewPlannedHours}
          newPlannedMinutes={newPlannedMinutes}
          setNewPlannedMinutes={setNewPlannedMinutes}
          newPlannedSeconds={newPlannedSeconds}
          setNewPlannedSeconds={setNewPlannedSeconds}
          newStartTime={newStartTime}
          setNewStartTime={setNewStartTime}
          newEndTime={newEndTime}
          setNewEndTime={setNewEndTime}
          addRoutine={addRoutine}
          adding={adding}
          roadmapsLoading={roadmapsLoading}
          activeRoadmaps={activeRoadmaps}
          linkedRoadmapIds={linkedRoadmapIds}
          linkingRoadmap={linkingRoadmap}
          unlinkingRoadmap={unlinkingRoadmap}
          handleLinkRoadmap={handleLinkRoadmap}
          handleUnlinkRoadmap={handleUnlinkRoadmap}
        />
      )}

      <EditRoutineModal
        editingRoutine={editingRoutine}
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
        onCancel={() => {
          setEditingRoutine(null);
          setEditTitle("");
          setEditDescription("");
          setEditDailySlot("");
          setEditPlannedMinutes(60);
          setEditStartTime("");
          setEditEndTime("");
        }}
        handleEditRoutine={handleEditRoutine}
        updating={updating}
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        editDailySlot={editDailySlot}
        setEditDailySlot={setEditDailySlot}
        editPlannedHours={editPlannedHours}
        setEditPlannedHours={setEditPlannedHours}
        editPlannedMinutes={editPlannedMinutes}
        setEditPlannedMinutes={setEditPlannedMinutes}
        editPlannedSeconds={editPlannedSeconds}
        setEditPlannedSeconds={setEditPlannedSeconds}
        editStartTime={editStartTime}
        setEditStartTime={setEditStartTime}
        editEndTime={editEndTime}
        setEditEndTime={setEditEndTime}
      />

      <DeleteRoutineDialog
        deletingRoutine={deletingRoutine}
        onClose={() => setDeletingRoutine(null)}
        handleDeleteRoutine={handleDeleteRoutine}
        updating={updating}
      />

      {success && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success animate-slide-up">
          {success}
        </div>
      )}
    </div>
  );
}
