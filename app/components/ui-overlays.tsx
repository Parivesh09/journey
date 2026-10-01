"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
