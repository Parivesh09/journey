import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function VisualizationButton({
  className,
  children,
  onClick,
  disabled = false,
}: {
  className?: string;
  children: ReactNode;
  onClick: () => Promise<void> | void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={cn(
        "btn btn-secondary",
        className,
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={async (e) => {
        e.preventDefault();
        await onClick();
      }}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function VisualizationTypeSelector({
  value,
  onChange,
  className,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}) {
  const types = [
    { value: "architecture", label: "Architecture" },
    { value: "workflow", label: "Workflow" },
    { value: "sequence", label: "Sequence" },
    { value: "dataflow", label: "Data Flow" },
    { value: "lifecycle", label: "Lifecycle" },
  ];

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium text-foreground mb-2">
        Diagram Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-4 py-2 border border-border rounded-md bg-background text-foreground",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        disabled={disabled}
      >
        {types.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function VisualizationGenerationState({
  status,
  className,
}: {
  status: "idle" | "generating" | "validating" | "rendering" | "ready" | "stale" | "error";
  className?: string;
}) {
  const labels: Record<string, string> = {
    idle: "Ready to visualize",
    generating: "Generating visualization...",
    validating: "Validating diagram...",
    rendering: "Preparing view...",
    ready: "Visualization ready!",
    stale: "Visualization needs update",
    error: "Generation failed",
  };

  const icons: Record<string, string> = {
    idle: "✦",
    generating: "○",
    validating: "○",
    rendering: "○",
    ready: "✓",
    stale: "⟳",
    error: "✕",
  };

  return (
    <div className={cn("text-sm text-foreground/60", className)}>
      <span className="mr-2">{icons[status]}</span>
      <span>{labels[status]}</span>
    </div>
  );
}

export function VisualizationToolbar({
  onRegenerate,
  onExport,
  onFullscreen,
  className,
}: {
  onRegenerate: () => Promise<void>;
  onExport: () => Promise<void>;
  onFullscreen: () => Promise<void>;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2 p-4 bg-background/50 backdrop-blur", className)}>
      <VisualizationButton
        onClick={onRegenerate}
        className="px-3 py-1.5 text-sm"
      >
        ⟳ Regenerate
      </VisualizationButton>
      <VisualizationButton
        onClick={onExport}
        className="px-3 py-1.5 text-sm"
      >
        ⬇️ Export
      </VisualizationButton>
      <VisualizationButton
        onClick={onFullscreen}
        className="px-3 py-1.5 text-sm"
      >
        ⛶ Fullscreen
      </VisualizationButton>
    </div>
  );
}