"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AppShell from "@/app/components/shell";
import {
  PageHeader,
  Sheet,
  Stamp,
  Card,
} from "@/app/components/ui";
import {
  VisualizationButton,
  VisualizationTypeSelector,
  VisualizationGenerationState,
  VisualizationToolbar,
} from "@/lib/visualization/ui";

interface VisualizationClientProps {
  id: string;
  roadmapTitle: string;
  defaultDiagramType: string;
}

export default function VisualizationClient({
  id,
  roadmapTitle,
  defaultDiagramType,
}: VisualizationClientProps) {
  const [diagram, setDiagram] = useState<any>(null);
  const [generationState, setGenerationState] = useState<
    "idle" | "generating" | "validating" | "rendering" | "ready" | "stale" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(defaultDiagramType);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch initial diagram
  useEffect(() => {
    fetchDiagram();
  }, [id, selectedType]);

  async function fetchDiagram() {
    setGenerationState("idle");
    setError(null);

    try {
      const res = await fetch(`/api/roadmaps/${id}/visualization`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load visualization");
      }

      // Get the specific diagram type if we have one
      const diagramRes = await fetch(
        `/api/roadmaps/${id}/visualization?diagramType=${selectedType}`
      );
      const diagramData = await diagramRes.json();

      if (!diagramRes.ok) {
        // Fallback to any diagram
        setDiagram(data);
        setGenerationState("ready");
      } else {
        setDiagram(diagramData);
        setGenerationState("ready");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setGenerationState("error");
    }
  }

  async function handleRegenerate() {
    setGenerationState("generating");
    setError(null);

    try {
      const res = await fetch(`/api/roadmaps/${id}/visualization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadmapId: id,
          diagramType: selectedType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Poll for completion
      const diagramId = data.diagramId;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;

        const statusRes = await fetch(
          `/api/roadmaps/${id}/visualization/${diagramId}`
        );
        const statusData = await statusRes.json();

        if (!statusRes.ok) {
          throw new Error(statusData.error || "Failed to check status");
        }

        if (statusData.status === "ready") {
          setDiagram(statusData);
          setGenerationState("ready");
          return;
        } else if (statusData.status === "error") {
          throw new Error(
            statusData.error || "Generation failed during processing"
          );
        }
        // Otherwise still generating/validating/rendering
      }

      throw new Error("Generation timed out");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setGenerationState("error");
    }
  }

  async function handleExport() {
    if (!diagram) return;
    // TODO: Implement export functionality
    alert("Export functionality coming soon!");
  }

  async function handleFullscreen() {
    setIsFullscreen(!isFullscreen);
    // TODO: Implement actual fullscreen API
  }

  if (generationState === "error") {
    return (
      <Sheet>
        <Link
          href="/roadmaps"
          className="inline-flex items-center gap-1.5 font-mono text-sm text-graphite-muted hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to roadmap
        </Link>

        <PageHeader title="Visualization Error" />
        <div className="text-graphite-muted text-center py-8">
          <p className="mb-4">
            {error || "Failed to generate visualization"}
          </p>
          <VisualizationButton
            onClick={handleRegenerate}
            className="btn btn-secondary"
          >
            Try Again
          </VisualizationButton>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet>
      <Link
        href={`/roadmaps/${id}`}
        className="inline-flex items-center gap-1.5 font-mono text-sm text-graphite-muted hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {roadmapTitle}
      </Link>

      <div className="flex flex-col h-[100vh]">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between px-4 py-3 bg-background/50 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="text-primary text-xl">📊</span>
            </div>
            <div>
              <p className="label text-primary">Visualization</p>
              <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
                {roadmapTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <VisualizationTypeSelector
              value={selectedType}
              onChange={setSelectedType}
              disabled={generationState === "generating"}
            />
            <VisualizationGenerationState
              status={generationState}
            />
          </div>
        </div>

        {/* Diagram Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          {!isFullscreen && (
            <VisualizationToolbar
              onRegenerate={handleRegenerate}
              onExport={handleExport}
              onFullscreen={handleFullscreen}
            />
          )}

          {/* Diagram Frame */}
          <div className="flex-1 relative overflow-hidden bg-background">
            {generationState === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center text-graphite-muted">
                Click "Regenerate" to create your visualization
              </div>
            )}

            {diagram && diagram.viewerUrl && (
              <iframe
                src={`/visualization/embed/${diagram.id}`}
                className="w-full h-full border-0"
                title="Roadmap visualization"
                style={{ minHeight: 0 }}
              />
            )}

            {generationState === "generating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                  <p className="mt-4 text-foreground">Generating visualization...</p>
                </div>
              </div>
            )}

            {generationState === "validating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur">
                <div className="text-center">
                  <div className="animate-pulse h-8 w-8 border-4 border-primary/20"></div>
                  <p className="mt-4 text-foreground">Validating diagram...</p>
                </div>
              </div>
            )}

            {generationState === "rendering" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur">
                <div className="text-center">
                  <div className="h-8 w-8 bg-primary"></div>
                  <p className="mt-4 text-foreground">Preparing view...</p>
                </div>
              </div>
            )}

            {generationState === "stale" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur">
                <div className="text-center">
                  <p className="text-foreground/60">
                    This visualization was generated from an earlier version
                  </p>
                  <VisualizationButton
                    onClick={handleRegenerate}
                    className="btn btn-secondary mt-4"
                  >
                    Update Visualization
                  </VisualizationButton>
                </div>
              </div>
            )}
          </div>

          {/* Controls (hidden in fullscreen) */}
          {!isFullscreen && (
            <div className="flex items-center justify-between px-4 py-3 bg-background/50 backdrop-blur-sm border-t border-border text-sm">
              <div className="flex items-center gap-2">
                <span className="text-foreground/60">
                  {diagram ? `Generated ${new Date(diagram.generatedAt).toLocaleDateString()}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <VisualizationButton
                  onClick={handleExport}
                  className="btn btn-secondary"
                >
                  ⬇️ Export
                </VisualizationButton>
                <VisualizationButton
                  onClick={handleFullscreen}
                  className="btn btn-secondary"
                >
                  ⛶ Fullscreen
                </VisualizationButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}