"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import AppShell from "@/app/components/shell";
import { PageHeader, Sheet, Stamp, Card } from "@/app/components/ui";
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
    | "idle"
    | "generating"
    | "validating"
    | "rendering"
    | "ready"
    | "stale"
    | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(defaultDiagramType);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeDiagramUrl, setIframeDiagramUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Sync theme with app theme
  useEffect(() => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute("data-theme") || "dark";
    setTheme(currentTheme === "light" ? "light" : "dark");

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.attributeName === "data-theme") {
          const newTheme = html.getAttribute("data-theme") || "dark";
          setTheme(newTheme === "light" ? "light" : "dark");
        }
      }
    });

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  // Update iframe theme when theme changes
  useEffect(() => {
    if (iframeDiagramUrl) {
      const newUrl = iframeDiagramUrl.replace(
        /theme=(light|dark)/,
        `theme=${theme}`,
      );
      setIframeDiagramUrl(newUrl);
    }
  }, [theme, iframeDiagramUrl]);

  async function fetchDiagram() {
    setGenerationState("idle");
    setError(null);

    try {
      const res = await fetch(`/api/roadmaps/${id}/visualization`);
      const data = await res.json();

      console.log("Fetched diagram data:", data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to load visualization");
      }

      // Get the specific diagram type if we have one
      const diagramRes = await fetch(
        `/api/roadmaps/${id}/visualization?diagramType=${selectedType}`,
      );
      const diagramData = await diagramRes.json();

      console.log("Fetched diagram data 123:", diagramData);

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

  // Fetch initial diagram
  useEffect(() => {
    fetchDiagram();
  }, [id, selectedType]);

  async function getDiagramUrl(diagramId: string) {
    try {
      const res = await fetch(
        `/api/visualization/embed/${diagramId}?theme=${theme}`,
      );
      if (!res.ok) {
        throw new Error("Failed to get diagram URL");
      }
      const data = await res;
      console.log("Fetched diagram URL:", data);
      return data.url;
    } catch (err) {
      console.error("Error fetching diagram URL:", err);
      return null;
    }
  }

  useEffect(() => {
    if (diagram && diagram.id) {
      getDiagramUrl(diagram.id).then((url) => {
        setIframeDiagramUrl(url);
      });
    }
  }, [diagram, theme]);

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
          `/api/roadmaps/${id}/visualization/${diagramId}`,
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
            statusData.error || "Generation failed during processing",
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

  const handleFullscreen = useCallback(async () => {
    const container = document.querySelector(
      ".diagram-frame-container",
    ) as HTMLElement;
    if (!container) return;

    if (!isFullscreen) {
      try {
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
          await container.webkitRequestFullscreen();
        } else if (container.msRequestFullscreen) {
          await container.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error("Fullscreen request failed:", err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsFullscreen(false);
      } catch (err) {
        console.error("Exit fullscreen failed:", err);
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFull = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  const handleOpenInNewTab = useCallback(() => {
    if (!diagram) return;
    const url = `/api/visualization/embed/${diagram.id}?theme=${theme}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [diagram, theme]);

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
          <p className="mb-4">{error || "Failed to generate visualization"}</p>
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
            <div>
              <p className="label text-primary">Visualization</p>
              <h1 className="text-2xl font-bold text-foreground font-display tracking-tight">
                {roadmapTitle}
              </h1>
            </div>
          </div>
        </div>

        {/* Diagram Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-shrink-0 items-center justify-between px-4 py-2 bg-background/50 backdrop-blur-sm border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-foreground/60 text-sm">
                {diagram
                  ? `Generated ${new Date(diagram.generatedAt).toLocaleDateString()}`
                  : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <VisualizationButton
                onClick={handleOpenInNewTab}
                className="btn btn-secondary"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </VisualizationButton>
              <VisualizationButton
                onClick={handleFullscreen}
                className="btn btn-secondary"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </VisualizationButton>
            </div>
          </div>

          {/* Diagram Frame */}
          <div
            className="diagram-frame-container flex-1 relative overflow-hidden bg-background"
            ref={(el) => {
              // Store reference for fullscreen
            }}
          >
            {generationState === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center text-graphite-muted">
                Click "Regenerate" to create your visualization
              </div>
            )}

            {diagram && diagram.id && (
              <iframe
                src={`/api/visualization/embed/${diagram.id}?theme=${theme}`}
                className="w-full h-full border-0"
                title="Roadmap visualization"
                style={{ minHeight: 0 }}
                allowFullScreen
              />
            )}

            {generationState === "generating" && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur">
                <div className="text-center">
                  <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary"></div>
                  <p className="mt-4 text-foreground">
                    Generating visualization...
                  </p>
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
        </div>
      </div>
    </Sheet>
  );
}
