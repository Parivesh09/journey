"use client";

import type { ReactNode } from "react";
import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("sheet m-auto my-6 max-w-[1120px] px-6 py-8", className)}>
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
    <div className="border-b border-hairline pb-6 mb-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[1.85rem] font-bold tracking-tight text-graphite">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[0.9rem] text-graphite-muted max-w-[65ch]">
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
    <div className="mb-6">
      <div className="flex items-baseline gap-3">
        {index && (
          <span className="font-mono text-[0.8rem] font-medium text-highlighter-amber tabular-nums">
            {index}
          </span>
        )}
        <h2 className="text-[1.05rem] font-semibold text-graphite flex-1">
          {title}
        </h2>
        {aside && (
          <span className="font-mono text-[0.7rem] text-graphite-faint tabular-nums">
            {aside}
          </span>
        )}
      </div>
      {instruction && (
        <p className="mt-2 text-[0.85rem] leading-relaxed text-graphite-muted max-w-[65ch]">
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
    neutral: "text-graphite-faint",
    amber: "text-highlighter-amber",
    valid: "text-valid-green",
    stamp: "text-stamp-red",
    ink: "text-bone-faint",
  }[tone];

  return (
    <span className={cn("stamp", toneClass, className)}>
      {children}
    </span>
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
    <span className={cn("font-mono tabular-nums", className)}>
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
      className="bubble"
    >
      {busy ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-highlighter-amber" />
        </span>
      ) : null}
    </button>
  );
}

export function ProgressBar({
  value,
  label,
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="w-full">
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {label && (
        <div className="mt-2 font-mono text-[0.7rem] text-graphite-faint flex justify-between">
          <span>{label}</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}
    </div>
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
        className
      )}
      onClick={onClick}
    >
      {children}
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
    <div className="text-center py-12 px-6 border border-dashed border-hairline rounded bg-paper-shade/50">
      <p className="text-[0.9rem] font-semibold text-graphite">
        {title}
      </p>
      <p className="mt-2 text-[0.85rem] text-graphite-muted max-w-[40ch] mx-auto">
        {description}
      </p>
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}

export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-graphite-muted">
      <div className="h-1.5 w-5 bg-highlighter-amber rounded animate-pulse" />
      <span className="text-[0.75rem] font-mono">{label}</span>
    </div>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-paper-shade animate-pulse rounded" />
      ))}
    </div>
  );
}

export function FormGroup({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[0.7rem] uppercase tracking-wide font-medium text-graphite-muted">
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[0.7rem] text-stamp-red font-medium">{error}</p>
      )}
    </div>
  );
}

export function PrimaryButton({
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
      className={cn("btn btn-primary", className)}
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
      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end sm:items-center p-0 sm:p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-ink-ground/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside
            className="relative w-full sm:w-[420px] h-full sm:max-h-[90vh] bg-paper shadow-xl border-l sm:border border-hairline flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
                <h3 className="text-[1.05rem] font-semibold text-graphite">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-paper-shade"
                  aria-label="Close drawer"
                >
                  <svg className="h-5 w-5 text-graphite-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              {children}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function IconButton({
  children,
  onClick,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("p-1.5 rounded border border-hairline hover:border-hairline-strong hover:bg-paper-shade transition-colors", className)}
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
