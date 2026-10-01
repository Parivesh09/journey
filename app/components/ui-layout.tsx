"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
