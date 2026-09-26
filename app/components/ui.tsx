"use client";

import type { ReactNode } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Sheet({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("sheet m-auto my-6 max-w-[1280px] px-8 py-8", className)}>
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

  return (
    <span className={cn("badge", toneClass, className)}>
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
      className="bubble"
    >
      {busy ? (
        <span className="absolute inset-0 grid place-items-center">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
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
        className
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
      <div className={cn("progress-bar", variant === "accent" && "progress-bar-accent")}>
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 dialog-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        aria-describedby={description ? "dialog-description" : undefined}
      >
        <div className="dialog w-full max-w-lg max-h-[90vh] overflow-hidden">
          {(title || description) && (
            <div className="px-6 py-4 border-b border-border">
              {title && (
                <h2 id="dialog-title" className="text-xl font-semibold text-foreground font-display">
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
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
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
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
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
  return (
    <input
      className={cn("input", className)}
      {...props}
    />
  );
}

export function Label({ children, className, htmlFor }: { children: ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label className={cn("label", className)} htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("caption", className)}>
      {children}
    </p>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("card", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-4 border-b border-border", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-4 border-t border-border bg-muted/30", className)}>
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
        className={`fixed inset-0 z-50 flex justify-end sm:items-center p-0 sm:p-4 transition-opacity duration-200 ease-out ${
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
          className={`relative w-full sm:w-[480px] h-full sm:max-h-[90vh] bg-surface card flex flex-col transition-transform duration-250 ease-out ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
            {title && (
              <div className="flex items-center justify-between border-b border-border px-6 py-5">
                <h3 className="text-[1.5rem] font-semibold text-foreground font-display">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-2 rounded hover:bg-muted transition-colors"
                  aria-label="Close drawer"
                >
                  <svg className="h-5 w-5 text-graphite-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-6">
              {children}
            </div>
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
    secondary: "bg-secondary text-foreground hover:bg-secondary/80 border-border",
    tertiary: "text-graphite-muted hover:text-foreground hover:bg-muted border-transparent",
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("p-2 rounded-lg transition-colors", variantClass, className)}
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
