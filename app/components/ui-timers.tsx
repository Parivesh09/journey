"use client";

import { useState, useEffect } from "react";
import { Play, X } from "lucide-react";

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
