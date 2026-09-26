"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, PageHeader, SectionHead, Stamp, Card, CardContent, Loader, Dialog, Input, FormGroup, PrimaryButton, SecondaryButton, EmptyState } from "@/app/components/ui";
import { formatMonthYear, formatWeekRange, formatDay, addMonths, addWeeks, addDays, getDaysInMonth, getWeekDays, isSameDay, isToday, startOfWeek, endOfWeek, getTimeSlots } from "@/lib/utils";
import { useGetDailyTasksQuery, useCreateTaskMutation, useCreateStudySessionMutation, useToggleTaskCompleteTodayMutation } from "@/lib/api";

export default function CalendarClient({
  initialView,
  initialDate,
}: {
  initialView: "month" | "week" | "day";
  initialDate: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [view, setView] = useState(initialView);
  const [currentDate, setCurrentDate] = useState(new Date(initialDate));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(initialDate));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("MEDIUM");

  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [studyMinutes, setStudyMinutes] = useState("");

  const { data: dailyData, isLoading } = useGetDailyTasksQuery("daily");
  const [createTask] = useCreateTaskMutation();
  const [createStudySession] = useCreateStudySessionMutation();
  const [toggleTaskCompleteToday] = useToggleTaskCompleteTodayMutation();

  const routines = dailyData?.routines ?? [];
  const connected = dailyData?.connected ?? [];

  const activeDate = selectedDate;

  const handlePrev = () => {
    setCurrentDate((current) => {
      if (view === "month") return addMonths(current, -1);
      if (view === "week") return addWeeks(current, -1);
      return addDays(current, -1);
    });
  };

  const handleNext = () => {
    setCurrentDate((current) => {
      if (view === "month") return addMonths(current, 1);
      if (view === "week") return addWeeks(current, 1);
      return addDays(current, 1);
    });
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleViewChange = (newView: "month" | "week" | "day") => {
    setView(newView);
    const params = new URLSearchParams(window.location.search);
    params.set("view", newView);
    startTransition(() => {
      router.replace(`/calendar?${params.toString()}`);
    });
  };

  const navigate = (date: Date) => {
    const params = new URLSearchParams(window.location.search);
    params.set("date", date.toISOString().split("T")[0]);
    startTransition(() => {
      router.replace(`/calendar?${params.toString()}`);
    });
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);
    if (view === "day") {
      navigate(date);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStudySession = async (e: React.FormEvent) => {
    e.preventDefault();
    const mins = Number(studyMinutes);
    if (!mins || mins <= 0) return;
    try {
      await createStudySession({ minutes: mins }).unwrap();
      setStudyMinutes("");
      setIsStudyModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Navigation effect - handles URL updates after date changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("date", currentDate.toISOString().split("T")[0]);
    router.replace(`/calendar?${params.toString()}`);
  }, [currentDate, router]);

  // Selected date navigation for day view
  useEffect(() => {
    if (view === "day") {
      const params = new URLSearchParams(window.location.search);
      params.set("date", selectedDate.toISOString().split("T")[0]);
      router.replace(`/calendar?${params.toString()}`);
    }
  }, [selectedDate, view, router]);

  // Build tasks and sessions mapping for selected current view period
  const calendarDays = view === "month" ? getDaysInMonth(currentDate) : getWeekDays(currentDate);

  // Routines and connected tasks are "today" tasks, but we can match them for visualization
  const getDailySummary = (day: Date) => {
    const isDayToday = isToday(day);
    if (!isDayToday) return { routinesCount: 0, completedRoutines: 0, connectedCount: 0 };
    const routinesCount = routines.length;
    const completedRoutines = routines.filter((r) => r.doneToday).length;
    const connectedCount = connected.length;
    return { routinesCount, completedRoutines, connectedCount };
  };

  // Render functions for each view
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1 border-t border-l border-border bg-border rounded-xl overflow-hidden card">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
        <div key={day} className="bg-muted/40 py-3 text-center label">
          {day}
        </div>
      ))}
      {calendarDays.map((day, idx) => {
        const isCurrentMonth = day.getMonth() === currentDate.getMonth();
        const isTodayDate = isToday(day);
        const isSelected = isSameDay(day, selectedDate);
        const summary = getDailySummary(day);

        return (
          <div
            key={idx}
            onClick={() => handleSelectDate(day)}
            className={cn(
              "bg-surface min-h-[110px] p-3 flex flex-col justify-between transition-all cursor-pointer relative",
              !isCurrentMonth && "opacity-40 bg-muted/10",
              isTodayDate && "ring-2 ring-primary ring-inset",
              isSelected && "bg-primary/5"
            )}
          >
            <div className="flex justify-between items-center mb-2">
              <span className={cn(
                "font-mono text-sm tabular-nums",
                isTodayDate ? "text-primary font-bold" : "text-graphite-faint"
              )}>
                {day.getDate()}
              </span>
              {isTodayDate && (
                <Stamp tone="amber" className="text-[0.6rem] px-1.5 py-0.5">Today</Stamp>
              )}
            </div>

            <div className="space-y-1.5 mt-2">
              {summary.routinesCount > 0 && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span className="text-[0.68rem] text-graphite-muted">
                    {summary.completedRoutines}/{summary.routinesCount}
                  </span>
                </div>
              )}
              {summary.connectedCount > 0 && (
                <div className="flex items-center gap-1.5 px-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-[0.68rem] text-graphite-muted">
                    {summary.connectedCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-muted/30">
        <div className="px-2 py-2 label text-center">Time</div>
        {calendarDays.map((day, idx) => (
          <div key={idx} className="px-2 py-2 text-center border-l border-border">
            <div className="label">{day.toLocaleDateString("en-US", { weekday: "short" })}</div>
            <div className={cn(
              "font-mono text-lg font-semibold tabular-nums mt-1",
              isToday(day) ? "text-primary" : "text-foreground"
            )}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[60px_repeat(7,1fr)]">
        {getTimeSlots(selectedDate, 60).map((slot, slotIdx) => (
          <div key={slotIdx} className="grid grid-cols-[60px_repeat(7,1fr)] border-t border-border">
            <div className="px-2 py-1 label text-right pr-2 text-graphite-faint border-r border-border">
              {slot.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
            </div>
            {calendarDays.map((day, dayIdx) => (
              <div key={dayIdx} className="border-l border-border min-h-[80px] relative">
                {isToday(day) && isSameDay(slot, new Date()) && (
                  <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <SectionHead
            index="01"
            title="Daily Habit Routines"
            instruction="Keep consistency with daily practice sessions"
          />
          {routines.length === 0 ? (
            <EmptyState
              title="No routines scheduled"
              description="Routines repeat automatically every single day."
            />
          ) : (
            <div className="space-y-2 mt-4">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="flex items-center justify-between p-4 border border-border rounded-xl bg-surface hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        try {
                          await toggleTaskCompleteToday(routine.id).unwrap();
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className={cn(
                        "h-6 w-6 rounded-full border border-border flex items-center justify-center transition-colors",
                        routine.doneToday && "bg-success border-success text-white"
                      )}
                    >
                      {routine.doneToday && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <span className={cn("text-sm font-medium", routine.doneToday && "line-through text-graphite-faint")}>
                      {routine.title}
                    </span>
                  </div>
                  <Stamp tone="valid">Habit</Stamp>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <SectionHead
            index="02"
            title="Focus Tasks scheduled"
            instruction="Active tracks schedules and milestone focus elements"
          />
          {connected.length === 0 ? (
            <EmptyState
              title="No tasks connected"
              description="Tasks pulled from your active study roadmap."
            />
          ) : (
            <div className="space-y-2 mt-4">
              {connected.map((item) => (
                <div
                  key={item.pinId}
                  className="flex items-center justify-between p-4 border border-border rounded-xl bg-surface"
                >
                  <span className="text-sm font-medium">{item.task.title}</span>
                  <Stamp tone="amber">Roadmap</Stamp>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <main className="px-6 py-8 sm:px-8 lg:px-12 bg-background min-h-screen">
      <Sheet>
        <PageHeader
          title="Plan"
          subtitle="Your editorial study planner — schedules, milestones, routines, and logged sessions"
          action={
            <div className="flex gap-3">
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4" />
                Add Daily Task
              </button>
              <button
                onClick={() => setIsStudyModalOpen(true)}
                className="btn btn-accent"
              >
                <Plus className="h-4 w-4" />
                Log Focus
              </button>
            </div>
          }
        />

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-display text-foreground min-w-[200px]">
              {view === "month" && formatMonthYear(currentDate)}
              {view === "week" && formatWeekRange(startOfWeek(currentDate), endOfWeek(currentDate))}
              {view === "day" && formatDay(currentDate)}
            </h2>
            <div className="flex items-center border border-border rounded-lg bg-surface">
              <button
                onClick={handlePrev}
                className="p-2 hover:bg-muted/50 transition-colors border-r border-border rounded-l-lg"
                title="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-2 text-sm font-medium hover:bg-muted/50 transition-colors font-sans"
              >
                Today
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-muted/50 transition-colors border-l border-border rounded-r-lg"
                title="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex border border-border rounded-lg bg-surface p-1">
            {(["month", "week", "day"] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize font-sans",
                  view === v
                    ? "bg-primary text-white"
                    : "text-graphite-muted hover:text-foreground hover:bg-muted/50"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader label="Preparing planner..." />
              </div>
            ) : view === "month" ? (
              renderMonthView()
            ) : view === "week" ? (
              renderWeekView()
            ) : (
              renderDayView()
            )}
          </div>

          {/* Right hand Planner Sidecar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <SectionHead
                  index="01"
                  title="Day Agenda"
                  instruction={formatDay(activeDate)}
                />
                
                <div className="space-y-4 mt-6">
                  {isToday(activeDate) ? (
                    <>
                      <div className="border-l-4 border-success pl-3 py-1">
                        <span className="label block text-[0.68rem]">Habit routines</span>
                        <span className="text-sm font-semibold text-foreground">
                          {routines.filter(r => r.doneToday).length} of {routines.length} completed
                        </span>
                      </div>
                      <div className="border-l-4 border-primary pl-3 py-1">
                        <span className="label block text-[0.68rem]">Roadmap items</span>
                        <span className="text-sm font-semibold text-foreground">
                          {connected.length} active scheduled
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-lg text-center">
                      <p className="caption">Daily tracking details are loaded dynamically for the current session.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <SectionHead
                  index="02"
                  title="Next Actions"
                  instruction="Keep track of SDE study goals"
                />
                <div className="space-y-3 mt-4">
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="w-full btn btn-secondary justify-start font-sans"
                  >
                    <Plus className="h-4 w-4" />
                    Add routine Habit
                  </button>
                  <button
                    onClick={() => setIsStudyModalOpen(true)}
                    className="w-full btn btn-tertiary justify-start font-sans text-primary hover:bg-primary/5"
                  >
                    <Plus className="h-4 w-4" />
                    Log study Session
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Task Creation Modal */}
        <Dialog
          open={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="Add routine Habit"
          description="Create a repeatable task that returns to your agenda daily"
        >
          <form onSubmit={handleAddTask} className="space-y-5">
            <FormGroup label="Title">
              <Input
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. 45 min LeetCode session"
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

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <SecondaryButton onClick={() => setIsTaskModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                Create Habit
              </PrimaryButton>
            </div>
          </form>
        </Dialog>

        {/* Study Logging Modal */}
        <Dialog
          open={isStudyModalOpen}
          onClose={() => setIsStudyModalOpen(false)}
          title="Log study Session"
          description="Directly log the focused SDE practice duration completed"
        >
          <form onSubmit={handleAddStudySession} className="space-y-5">
            <FormGroup label="Duration (minutes)">
              <Input
                required
                type="number"
                min={1}
                max={1440}
                value={studyMinutes}
                onChange={(e) => setStudyMinutes(e.target.value)}
                placeholder="60"
              />
            </FormGroup>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <SecondaryButton onClick={() => setIsStudyModalOpen(false)}>
                Cancel
              </SecondaryButton>
              <PrimaryButton type="submit">
                Log Session
              </PrimaryButton>
            </div>
          </form>
        </Dialog>
      </Sheet>
    </main>
  );
}