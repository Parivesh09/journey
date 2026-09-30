import { SHARED_SYSTEM_PROMPT, buildUserPrompt, buildDiagramTypeDescription } from "./shared";

export const ARCHITECTURE_SYSTEM_PROMPT = `${SHARED_SYSTEM_PROMPT}

${buildDiagramTypeDescription("architecture")}

## Architecture Schema Requirements

The output must be a JSON object with these required fields:
- schema_version: 1
- diagram_type: "architecture"
- meta: {
    title: string,
    output: string,
    subtitle?: string,
    animation?: "trace" | "none",
    visual_preset?: "classic" | "signal-flow" | "blueprint" | "editorial",
    quality_profile?: "standard" | "showcase",
    locale?: string,
    translations?: Record<string, string>,
    repository?: { url: string; provider: "github" | "gitee"; link_mode: "web" | "local-only"; revision: string },
    views?: Array<{ id: string; label: string; focus: string[]; note?: string }>,
    legend?: { mode?: "auto" | "all" | "hidden"; entries?: Record<"frontend" | "backend" | "database" | "cloud" | "security" | "messagebus" | "external", { label: string; visible?: boolean }> },
    viewBox?: [number, number],
    engineering_profile?: "deployment-ownership"
  }
- layout: { mode: "grid"; origin?: [number, number]; cols: number; gapX?: number; gapY?: number; cellW?: number; cellH?: number }
- components: array of objects with id, type, label (required), optional: sublabel, tag, icon, brand, sources, row, col, pos, size
- boundaries?: array of objects with kind ("region" | "security-group"), label, wraps (array of component IDs), pad?
- connections?: array of objects with from, to (component IDs), optional: id, label, variant ("default" | "emphasis" | "security" | "dashed"), fromSide, toSide, route ("auto" | "straight" | "orthogonal-h" | "orthogonal-v"), via?, labelAt?, labelDx?, labelDy?, labelSegment?, width?
- cards?: array of objects with dot ("cyan" | "emerald" | "violet" | "amber" | "rose" | "orange" | "slate"), title, items (array of strings)

## Component Types
- frontend: User-facing UI components
- backend: Server-side services, APIs
- database: Data storage
- cloud: Cloud infrastructure, CDN, load balancers
- security: Auth, encryption, security groups
- messagebus: Queues, event buses
- external: Third-party services, users

## Required Component Grid Positioning
- Every component MUST have "row" (0-indexed) and "col" (0-indexed) for grid positioning
- The layout.cols defines the number of columns in the grid
- Use row 0 for top row, increasing downward
- Use col 0 for leftmost column, increasing rightward
- Distribute components evenly across the grid

## Layout Requirements
- layout.mode MUST be "grid"
- layout.cols MUST be specified (typically 3-5 for architecture diagrams)
- layout.gapX and layout.gapY optional (defaults work well)
- layout.cellW and layout.cellH optional

## Meta Requirements
- meta.title: The roadmap title
- meta.output: "archify"
- meta.subtitle: Brief description of the architecture focus
- meta.animation: "none" (recommended for learning diagrams)
- meta.visual_preset: "classic" (recommended for learning diagrams)
- meta.quality_profile: "standard" or "showcase"
- meta.locale: "en" (default)
- meta.engineering_profile: "deployment-ownership" (optional)

## Component Types
- frontend: User-facing UI components
- backend: Server-side services, APIs
- database: Data storage
- cloud: Cloud infrastructure, CDN, load balancers
- security: Auth, encryption, security groups
- messagebus: Queues, event buses
- external: Third-party services, users

## Guidelines for Roadmaps
- Group related topics into conceptual components
- Show prerequisite relationships as connections
- Use boundaries to represent major milestones or phases
- Keep to 8-15 primary nodes for readability
- Use "emphasis" variant for primary learning flow
- Use "security" variant for auth/validation concepts
- Use "dashed" for optional/advanced paths
- Distribute components across the grid with meaningful row/col positions
- Use both row/col AND pos/size for precise positioning
- Use boundaries to group related components into regions or security groups
- Use cards to provide additional context/legend information

## Cards (IMPORTANT for legend)
- Add 2-3 cards with dot colors:
  - cyan: Main flow / user journey
  - emerald: Technology stack / key technologies
  - rose: Security / authentication / critical paths
  - amber: Notes / advanced / optional
- Each card: dot, title, items (array of strings)

## Boundaries (RECOMMENDED)
- Use "region" boundaries for major phases/milestones
- Use "security-group" boundaries for trust/security boundaries
- Set "pad": 14-20 for comfortable spacing

## Cards (IMPORTANT for legend)
- Add 2-3 cards with dot colors:
  - cyan: Main flow / user journey
  - emerald: Technology stack / key technologies
  - rose: Security / authentication / critical paths
  - amber: Notes / advanced / optional
- Each card: dot, title, items (array of strings)

## Boundaries (RECOMMENDED)
- Use "region" boundaries for major phases/milestones
- Use "security-group" boundaries for trust/security boundaries
- Set "pad": 14-20 for comfortable spacing
`;

export function buildArchitecturePrompt(
  context: {
    roadmap: { id: string; title: string; description: string | null };
    sections: Array<{
      id: string;
      title: string;
      topics: Array<{
        id: string;
        title: string;
        tasks: Array<{ id: string; title: string }>;
      }>;
    }>;
  }
): { systemPrompt: string; userPrompt: string } {
  return {
    systemPrompt: ARCHITECTURE_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt("architecture", context),
  };
}