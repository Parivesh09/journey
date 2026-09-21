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
  return <div className={cn("sheet", className)}>{children}</div>;
}

export function SectionHead({
  index,
  title,
  instruction,
  aside,
  tone = "paper",
  className,
}: {
  index?: string;
  title: ReactNode;
  instruction?: ReactNode;
  aside?: ReactNode;
  tone?: "paper" | "ink";
  className?: string;
}) {
  const onPaper = tone === "paper";
  return (
    <header className={className}>
      <div className="flex items-baseline gap-3">
        {index ? (
          <span
            className={cn(
              "shrink-0 rounded-md bg-amber/12 px-1.5 py-0.5 text-[0.68rem] font-semibold tabular-nums",
              onPaper ? "text-amber-ink" : "text-amber",
            )}
          >
            {index}
          </span>
        ) : null}
        <h2
          className={cn(
            "text-[1.0625rem] font-semibold tracking-tight text-balance",
            onPaper ? "text-graphite" : "text-bone",
          )}
        >
          {title}
        </h2>
        <span
          aria-hidden
          className={cn(
            "h-px min-w-4 flex-1",
            onPaper ? "bg-rule" : "bg-rule-2",
          )}
        />
        {aside ? (
          <span
            className={cn(
              "shrink-0 font-mono text-[0.7rem] tabular-nums",
              onPaper ? "text-graphite-2" : "text-bone-2",
            )}
          >
            {aside}
          </span>
        ) : null}
      </div>
      {instruction ? (
        <p
          className={cn(
            "mt-2 max-w-[68ch] text-[0.8125rem] leading-5",
            onPaper ? "text-graphite-2" : "text-bone-2",
          )}
        >
          {instruction}
        </p>
      ) : null}
    </header>
  );
}

const stampTones = {
  neutral: "text-graphite-2",
  amber: "text-amber-ink",
  valid: "text-valid",
  stamp: "text-stamp",
  ink: "text-bone-2",
  amberInk: "text-amber",
} as const;

export function Stamp({
  tone = "neutral",
  className,
  children,
}: {
  tone?: keyof typeof stampTones;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("stamp", stampTones[tone], className)}>{children}</span>
  );
}

export function Num({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>{children}</span>
  );
}

export function Bubble({
  filled,
  label,
  disabled,
  busy,
  onClick,
  className,
}: {
  filled: boolean;
  label: string;
  disabled?: boolean;
  busy?: boolean;
  onClick?: () => void;
  className?: string;
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
      className={cn("bubble", className)}
    >
      {busy ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      ) : null}
    </button>
  );
}

export function Loader({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-[0.72rem] font-medium",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden
        className="h-1.5 w-5 animate-pulse rounded-full bg-amber"
      />
      {label}
    </span>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="mt-4 space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-stone-400 py-3"
        >
          <span className="bubble" />
          <span
            className="h-3 animate-pulse rounded-md bg-rule-2"
            style={{ width: `${55 + ((index * 13) % 30)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function EmptyNote({
  children,
  tone = "paper",
}: {
  children: ReactNode;
  tone?: "paper" | "ink";
}) {
  return (
    <p
      className={cn(
        "mt-4 rounded-xl border border-dashed px-4 py-4 text-[0.8125rem] leading-5",
        tone === "paper"
          ? "border-stone-400 bg-paper/50 text-graphite-2"
          : "border-stone-400-2 text-bone-2",
      )}
    >
      {children}
    </p>
  );
}

// Form utilities

export function FormGroup({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.72rem] font-medium text-stamp mt-1" role="alert">
      {children}
    </p>
  );
}

export function FormSuccess({ children }: { children: ReactNode }) {
  return (
    <p className="text-[0.72rem] font-medium text-valid mt-1" role="alert">
      {children}
    </p>
  );
}

// Toast notification

export function Toast({
  children,
  type = "info",
}: {
  children: ReactNode;
  type?: "info" | "success" | "error";
}) {
  const tone =
    type === "success"
      ? "text-valid"
      : type === "error"
        ? "text-stamp"
        : "text-graphite-2";
  return (
    <div className="toast">
      <span className={cn("text-[0.875rem] font-medium", tone)}>
        {children}
      </span>
    </div>
  );
}
