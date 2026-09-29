"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Play, X } from "lucide-react";

export function Sheet({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("sheet m-auto my-6 max-w-[1280px] px-8 py-8", className)}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-b border-border pb-8 mb-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-foreground font-display">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[1rem] text-graphite-muted max-w-[75ch] leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function SectionHead({
  index,
  title,
  instruction,
  aside,
}: {
  index?: string;
  title: ReactNode;
  instruction?: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-baseline gap-4">
        {index && (
          <span className="font-mono text-[0.8rem] font-medium text-primary tabular-nums">
            {index}
          </span>
        )}
        <h3 className="text-[1.5rem] font-semibold text-foreground flex-1 font-display">
          {title}
        </h3>
        {aside && (
          <span className="font-mono text-[0.7rem] text-graphite-faint tabular-nums">
            {aside}
          </span>
        )}
      </div>
      {instruction && (
        <p className="mt-3 text-[1rem] leading-relaxed text-graphite-muted max-w-[75ch]">
          {instruction}
        </p>
      )}
    </div>
  );
}

export function Stamp({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "amber" | "valid" | "stamp" | "ink";
  className?: string;
  children: ReactNode;
}) {
  const toneClass = {
    neutral: "badge",
    amber: "badge-accent",
    valid: "badge-success",
    stamp: "badge-destructive",
    ink: "text-graphite-faint",
  }[tone];

  return <span className={cn("badge", toneClass, className)}>{children}</span>;
}

export function Num({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums text-foreground", className)}>
      {children}
    </span>
  );
}

export function Bubble({
  filled,
  label,
  disabled,
  busy,
  onClick,
}: {
  filled: boolean;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={filled}
      aria-label={label}
      disabled={disabled || busy}
      onClick={onClick}
      data-filled={filled}
      className="bubble transition-all duration-fast"
    >
      {busy ? (
        <span className="absolute inset-0 grid place-items-center animate-pulse-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        </span>
      ) : null}
    </button>
  );
}

export function TaskRow({
  children,
  className,
  completed,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  completed?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        "task-row",
        completed && "completed",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function ProgressBar({
  value,
  label,
  variant = "primary",
}: {
  value: number;
  label?: string;
  variant?: "primary" | "accent";
}) {
  return (
    <div className="w-full">
      <div
        className={cn(
          "progress-bar",
          variant === "accent" && "progress-bar-accent",
        )}
      >
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {label && (
        <div className="mt-2 font-mono text-sm text-graphite-faint flex justify-between">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  children,
  title,
  description,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 dialog-overlay animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <div
          className="dialog w-full max-w-lg max-h-[90vh] overflow-hidden animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {(title || description) && (
            <div className="px-6 py-4 border-b border-border">
              {title && (
                <h2
                  id="dialog-title"
                  className="text-xl font-semibold text-foreground font-display"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p id="dialog-description" className="mt-1 caption">
                  {description}
                </p>
              )}
            </div>
          )}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="text-center py-16 px-8 card">
      <p className="text-[1.25rem] font-semibold text-foreground font-display">
        {title}
      </p>
      <p className="mt-2 text-[1rem] text-graphite-muted max-w-[40ch] mx-auto leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-graphite-muted">
      <div className="h-1.5 w-5 bg-primary rounded animate-pulse" />
      <span className="text-sm font-mono">{label}</span>
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

export function FormGroup({
  label,
  children,
  error,
  hint,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="label">{label}</label>
      {children}
      {hint && <p className="caption">{hint}</p>}
      {error && <p className="text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
  size = "md",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-primary", sizeClasses[size], className)}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-secondary", className)}
    >
      {children}
    </button>
  );
}

export function AccentButton({
  children,
  onClick,
  disabled,
  className,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-accent", className)}
    >
      {children}
    </button>
  );
}

export function TertiaryButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn("btn btn-tertiary", className)}
    >
      {children}
    </button>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label className={cn("label", className)} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function Caption({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("caption", className)}>{children}</p>;
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("px-6 py-4 border-t border-border bg-muted/30", className)}
    >
      {children}
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <>
      <div
        className={`fixed inset-0 z-50 flex justify-end sm:items-center p-0 sm:p-4 gpu-transition ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <aside
          className={`relative w-full sm:w-[480px] h-full sm:max-h-[90vh] bg-surface card flex flex-col gpu-transition ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <h3 className="text-[1.5rem] font-semibold text-foreground font-display">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-muted transition-colors"
                aria-label="Close drawer"
              >
                <svg
                  className="h-5 w-5 text-graphite-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
        </aside>
      </div>
    </>
  );
}

export function IconButton({
  children,
  onClick,
  className,
  ariaLabel,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "tertiary";
}) {
  const variantClass = {
    primary: "bg-primary text-white hover:bg-primary/90 border-transparent",
    secondary:
      "bg-secondary text-foreground hover:bg-secondary/80 border-border",
    tertiary:
      "text-graphite-muted hover:text-foreground hover:bg-muted border-transparent",
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "p-2 rounded-lg transition-all duration-fast",
        "hover:scale-[1.02] active:scale-[0.98]",
        variantClass,
        className,
      )}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function GearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.22 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10a10 10 0 0 0 10-10a10 10 0 0 0-10-10zm0 5a3 3 0 1 1 0 6 3 3 0 0 1-6 0z" />
    </svg>
  );
}

export function SunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export function MoonIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "dark";
    }
    return "dark";
  });

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      document.documentElement.setAttribute("data-theme", newTheme);
    } catch {}
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-all duration-fast",
        "hover:bg-muted/50 hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
      title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      <span className="block transition-transform duration-200 ease-out">
        {theme === "light" ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}

export function CountdownTimer({
  targetTime,
}: {
  targetTime: Date | string | null | undefined;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!targetTime) {
      setTimeLeft(null);
      setIsPast(false);
      return;
    }

    const target = new Date(targetTime).getTime();

    const updateTimer = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
      setIsPast(false);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  if (!timeLeft) return null;

  return (
    <div className="flex items-center gap-1.5 font-mono text-xs">
      <span
        className={`px-2 py-0.5 rounded bg-primary/10 text-primary ${isPast ? "opacity-50" : ""}`}
      >
        {String(timeLeft.hours).padStart(2, "0")}
      </span>
      <span className="text-graphite-muted">:</span>
      <span
        className={`px-2 py-0.5 rounded bg-primary/10 text-primary ${isPast ? "opacity-50" : ""}`}
      >
        {String(timeLeft.minutes).padStart(2, "0")}
      </span>
      <span className="text-graphite-muted">:</span>
      <span
        className={`px-2 py-0.5 rounded bg-primary/10 text-primary ${isPast ? "opacity-50" : ""}`}
      >
        {String(timeLeft.seconds).padStart(2, "0")}
      </span>
      {isPast && <span className="text-xs text-destructive ml-1">Overdue</span>}
    </div>
  );
}

// Types for daily tasks modal
export interface DailyTaskForDate {
  routines: Array<{
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    plannedHours: number | null;
    plannedMinutes: number | null;
    plannedSeconds: number | null;
    dailySlot: string | null;
    startTime?: Date | string | null;
    endTime?: Date | string | null;
    doneToday: boolean;
  }>;
  connected: Array<{
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
  }>;
}

interface DailyTasksModalProps {
  open: boolean;
  onClose: () => void;
  date: Date;
  tasks: DailyTaskForDate;
  onStartTask: (task: { id: string; title: string; description?: string | null; plannedSeconds: number; kind: "routine" | "task"; isDailyTask: boolean }) => void;
}

export function DailyTasksModal({ open, onClose, date, tasks, onStartTask }: DailyTasksModalProps) {
  if (!open) return null;

  const formatDate = (d: Date) => {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const getTotalSeconds = (hours: number | null, minutes: number | null, seconds: number | null) => {
    return (hours ?? 0) * 3600 + (minutes ?? 0) * 60 + (seconds ?? 0);
  };

  const allTasks = [
    ...tasks.routines.map((r) => ({ ...r, kind: "routine" as const, plannedSeconds: getTotalSeconds(r.plannedHours, r.plannedMinutes, r.plannedSeconds) })),
    ...tasks.connected.map((c) => ({ ...c.task, kind: "connected" as const, plannedSeconds: getTotalSeconds(c.task.plannedHours, c.task.plannedMinutes, c.task.plannedSeconds) })),
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Tasks for ${formatDate(date)}`}
      description={`${tasks.routines.length} routines and ${tasks.connected.length} connected tasks`}
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {allTasks.length === 0 ? (
          <EmptyState
            title="No tasks scheduled"
            description="No routines or connected tasks for this date"
          />
        ) : (
          <div className="space-y-3">
            {allTasks.map((task, idx) => (
              <div
                key={`${task.kind}-${task.id}-${idx}`}
                className="flex items-center justify-between p-4 border border-border rounded-xl bg-surface transition-all duration-fast hover:bg-muted/30"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    {task.description && (
                      <p className="mt-0.5 truncate text-xs text-graphite-muted line-clamp-1">{task.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-xs text-graphite-faint">
                      <Stamp tone={task.kind === "routine" ? "valid" : "amber"} className="text-[0.65rem]">
                        {task.kind === "routine" ? "Routine" : "Roadmap"}
                      </Stamp>
                      {task.kind === "connected" && task.phaseTitle && (
                        <span className="font-mono">{task.phaseTitle}</span>
                      )}
                      {task.plannedSeconds && task.plannedSeconds > 0 && (
                        <span className="font-mono">
                          {Math.floor(task.plannedSeconds / 60)}m {task.plannedSeconds % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <PrimaryButton
                  onClick={() => onStartTask({
                    id: task.id,
                    title: task.title,
                    description: task.description,
                    plannedSeconds: task.plannedSeconds || 60 * 60,
                    kind: task.kind === "routine" ? "routine" : "task",
                    isDailyTask: task.kind === "routine",
                  })}
                  className="shrink-0"
                  size="sm"
                >
                  Start
                </PrimaryButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}

export function TaskTimer({
  durationMinutes,
  isRunning,
  onStart,
  onComplete,
  onCancel,
}: {
  durationMinutes: number;
  isRunning: boolean;
  onStart: () => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
  } | null>(null);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(null);
      setHasCompleted(false);
      return;
    }

    if (!timeLeft) {
      setTimeLeft({ minutes: durationMinutes, seconds: 0 });
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev) return null;
        if (prev.minutes === 0 && prev.seconds === 0) {
          clearInterval(interval);
          setHasCompleted(true);
          onComplete();
          return { minutes: 0, seconds: 0 };
        }
        if (prev.seconds === 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { minutes: prev.minutes, seconds: prev.seconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, durationMinutes, timeLeft, onComplete]);

  if (!isRunning && !timeLeft) {
    return (
      <button
        onClick={onStart}
        className="p-1.5 rounded hover:bg-primary/10 hover:text-primary transition-colors"
        disabled={hasCompleted}
        aria-label={hasCompleted ? "Completed" : "Start Task"}
        title={hasCompleted ? "Completed" : "Start Task"}
      >
        <Play className="h-3.5 w-3.5" />
      </button>
    );
  }

  if (hasCompleted) {
    return (
      <span className="text-xs font-mono text-success px-2 py-1 rounded bg-success/10">
        ✓ Done
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-xs px-2 py-1 rounded bg-destructive/10 text-destructive">
        {String(timeLeft?.minutes ?? 0).padStart(2, "0")}:
        {String(timeLeft?.seconds ?? 0).padStart(2, "0")}
      </span>
      <button
        onClick={onCancel}
        className="p-1.5 rounded hover:bg-muted transition-colors"
        aria-label="Cancel timer"
        title="Cancel timer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
