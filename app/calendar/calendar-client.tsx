"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Check, MousePointer2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, PageHeader, SectionHead, Stamp, Card, CardContent, Loader, Dialog, Input, FormGroup, PrimaryButton, SecondaryButton, EmptyState, DailyTasksModal } from "@/app/components/ui";
import { formatMonthYear, formatWeekRange, formatDay, addMonths, addWeeks, addDays, getDaysInMonth, getWeekDays, isSameDay, isToday, startOfWeek, endOfWeek, getTimeSlots } from "@/lib/utils";
import { useGetDailyTasksQuery, useCreateTaskMutation, useCreateStudySessionMutation, useToggleTaskCompleteTodayMutation } from "@/lib/api";
import { useTaskTimer } from "@/lib/store/timer-hooks";

export default function CalendarClient({
  initialView,
  initialDate,
}: {
  initialView: "month" | "week" | "day";
  initialDate: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { startTask } = useTaskTimer();

  const [view, setView] = useState(initialView);
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(initialDate));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");

  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [studyMinutes, setStudyMinutes] = useState(60);
  const [studyTaskId, setStudyTaskId] = useState<string | null>(null);

  const { data: dailyData, isLoading: dailyLoading, error: dailyError } = useGetDailyTasksQuery({ tab: view === "day" ? "daily" : "all" });
  const [createTask] = useCreateTaskMutation();
  const [createStudySession] = useCreateStudySessionMutation();
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();

  const routines = dailyData?.routines ?? [];
  const connected = dailyData?.connected ?? [];

  const days = getWeekDays(currentDate);

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await createTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        isPersonalDaily: true,
      }).unwrap();
      setNewTaskTitle("");
      setIsTaskModalOpen(false);
    } catch {
      // Error handled by toast
    }
  }

  async function addStudySession() {
    if (studyMinutes < 1) return;
    try {
      await createStudySession({ minutes: studyMinutes }).unwrap();
      setStudyMinutes(60);
      setIsStudyModalOpen(false);
    } catch {
      // Error handled by toast
    }
  }

  async function toggleTaskComplete(taskId: string) {
    try {
      await toggleTaskCompleteToday(taskId).unwrap();
    } catch {
      // Error handled by toast
    }
  }

  function handleDateChange(newDate: Date) {
    setCurrentDate(newDate);
  }

  function handleViewChange(newView: "month" | "week" | "day") {
    setView(newView);
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <Sheet>
      <PageHeader title="Calendar" subtitle="Schedule and track your daily tasks" />
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <PrimaryButton
              onClick={() => handleDateChange(addWeeks(currentDate, -1))}
              size="sm"
              variant="secondary"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </PrimaryButton>
            <span className="font-mono text-lg text-foreground w-40 text-center">
              {formatWeekRange(currentDate)}
            </span>
            <PrimaryButton
              onClick={() => handleDateChange(addWeeks(currentDate, 1))}
              size="sm"
              variant="secondary"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
          <div className="flex items-center gap-2 border-l border-border pl-4">
            <button
              onClick={() => handleViewChange("month")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === "month" ? "bg-primary text-primary-foreground" : "text-graphite-muted hover:bg-muted"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handleViewChange("week")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === "week" ? "bg-primary text-primary-foreground" : "text-graphite-muted hover:bg-muted"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handleViewChange("day")}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                view === "day" ? "bg-primary text-primary-foreground" : "text-graphite-muted hover:bg-muted"
              }`}
            >
              Day
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PrimaryButton onClick={() => { setIsTaskModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </PrimaryButton>
          <SecondaryButton onClick={() => { setIsStudyModalOpen(true); }}>
            <Check className="w-4 h-4 mr-2" />
            Log Study
          </SecondaryButton>
        </div>
      </div>

      {dailyLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : dailyError ? (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          Unable to load tasks. Please try again.
        </div>
      ) : (
        <>
          {view === "month" && (
            <div className="grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="p-2 text-center text-xs font-medium text-graphite-muted">
                  {day}
                </div>
              ))}
              {(() => {
                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const startDay = firstDay.getDay();
                const daysInMonth = getDaysInMonth(currentDate.getMonth() + 1, currentDate.getFullYear());
                const cells = [];
                for (let i = 0; i < startDay; i++) {
                  cells.push(<div key={`empty-${i}`} className="aspect-square" />);
                }
                for (let d = 1; d <= daysInMonth; d++) {
                  const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
                  const isTodayDate = isToday(date);
                  const isSelected = isSameDay(date, selectedDate);
                  const dayRoutines = routines.filter((r) => {
                    // Simplified - in real app check if routine is for this day
                    return true;
                  });
                  cells.push(
                    <div
                      key={d}
                      onClick={() => { setSelectedDate(date); handleViewChange("day"); }}
                      className={`aspect-square p-2 rounded-lg transition-colors relative cursor-pointer ${
                        isTodayDate ? "bg-primary/10 border border-primary" : "bg-card hover:bg-muted"
                      } ${isSelected ? "ring-2 ring-primary" : ""}`}
                    >
                      <span className={`text-sm font-medium ${isTodayDate ? "text-primary" : "text-foreground"}`}>
                        {d}
                      </span>
                      {dayRoutines.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {dayRoutines.slice(0, 3).map((routine) => (
                            <div
                              key={routine.id}
                              className="text-xs bg-primary/10 text-primary px-1 rounded truncate"
                            >
                              {routine.title}
                            </div>
                          ))}
                          {dayRoutines.length > 3 && (
                            <div className="text-xs text-graphite-faint">+{dayRoutines.length - 3} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }
                return cells;
              })()}
            </div>
          )}
          {view === "week" && (
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => (
                <div key={day.toISOString()} className="min-h-[200px] p-2 bg-card rounded-lg border border-border">
                  <div className={`text-sm font-medium ${isSameDay(day, new Date()) ? "text-primary" : "text-foreground"}`}>
                    {formatDay(day)}
                  </div>
                  <div className="mt-2 space-y-1">
                    {connected
                      .filter((c) => isSameDay(new Date(c.task.startTime ?? c.task.endTime ?? day), day))
                      .slice(0, 4)
                      .map((item) => (
                        <div
                          key={item.pinId}
                          className="text-xs bg-amber/10 text-amber px-1.5 py-0.5 rounded truncate"
                        >
                          {item.task.title}
                        </div>
                      ))}
                    {routines
                      .filter((r) => r.dailySlot)
                      .slice(0, 4)
                      .map((routine) => (
                        <div
                          key={routine.id}
                          className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded truncate"
                        >
                          {routine.title}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          {view === "day" && (
            <div className="space-y-4">
              <SectionHead index="01" title="Tasks for Today" />
              <div className="space-y-2">
                {routines.length === 0 && connected.length === 0 ? (
                  <EmptyState
                    title="No tasks scheduled"
                    description="Add a routine or pull a roadmap task to get started"
                    action={
                      <PrimaryButton onClick={() => { setIsTaskModalOpen(true); }}>
                        Add Task
                      </PrimaryButton>
                    }
                  />
                ) : (
                  <>
                    {routines.map((routine) => (
                      <Card key={routine.id} className="p-4">
                        <div className="flex items-start gap-4">
                          <Bubble
                            filled={routine.doneToday}
                            busy={false}
                            label={routine.doneToday ? "Mark not done" : "Mark done"}
                            onClick={() => toggleTaskComplete(routine.id)}
                            disabled={false}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground truncate">
                                {routine.title}
                              </h3>
                              <Stamp tone="valid">Routine</Stamp>
                            </div>
                            {routine.description && (
                              <p className="mt-1 text-sm text-graphite-muted line-clamp-2">
                                {routine.description}
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-3 text-sm text-graphite-faint">
                              {routine.dailySlot && (
                                <span className="flex items-center gap-1">
                                  <MousePointer2 className="w-3.5 h-3.5" />
                                  {routine.dailySlot}
                                </span>
                              )}
                              {(routine.plannedHours || routine.plannedMinutes || routine.plannedSeconds) && (
                                <span className="font-mono">
                                  {formatTime((routine.plannedHours ?? 0) * 3600 + (routine.plannedMinutes ?? 0) * 60 + (routine.plannedSeconds ?? 0))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {connected.map((item) => (
                      <Card key={item.pinId} className="p-4">
                        <div className="flex items-start gap-4">
                          <Bubble
                            filled={false}
                            busy={false}
                            label={`Complete ${item.task.title}`}
                            onClick={() => toggleTaskComplete(item.task.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-foreground truncate">
                                {item.task.title}
                              </h3>
                              <Stamp tone="amber">Roadmap</Stamp>
                            </div>
                            <p className="mt-1 text-sm text-graphite-muted truncate">
                              {item.task.milestoneTitle ?? item.task.phaseTitle} / {item.task.topicTitle ?? "General"}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Task Modal */}
      <Dialog open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Add Task">
        <form onSubmit={addTask} className="space-y-4">
          <FormGroup label="Task Title">
            <Input
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="e.g. Review DSA flashcards"
            />
          </FormGroup>
          <FormGroup label="Priority">
            <select
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              className="input"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </FormGroup>
          <div className="pt-4 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setIsTaskModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!newTaskTitle.trim()}>
              Add Task
            </PrimaryButton>
          </div>
        </form>
      </Dialog>

      {/* Study Session Modal */}
      <Dialog open={isStudyModalOpen} onClose={() => setIsStudyModalOpen(false)} title="Log Study Session">
        <form onSubmit={addStudySession} className="space-y-4">
          <FormGroup label="Duration (minutes)">
            <Input
              type="number"
              min="1"
              max="480"
              value={studyMinutes}
              onChange={(e) => setStudyMinutes(Number(e.target.value))}
            />
          </FormGroup>
          <FormGroup label="Associated Task (optional)">
            <select
              value={studyTaskId ?? ""}
              onChange={(e) => setStudyTaskId(e.target.value || null)}
              className="input"
            >
              <option value="">None</option>
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
              {connected.map((c) => (
                <option key={c.pinId} value={c.task.id}>
                  {c.task.title} (Roadmap)
                </option>
              ))}
            </select>
          </FormGroup>
          <div className="pt-4 flex justify-end gap-3">
            <SecondaryButton type="button" onClick={() => setIsStudyModalOpen(false)}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={studyMinutes < 1}>
              Log Session
            </PrimaryButton>
          </div>
        </form>
      </Dialog>
    </Sheet>
  );
}