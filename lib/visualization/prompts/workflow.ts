import { SHARED_SYSTEM_PROMPT, buildUserPrompt, buildDiagramTypeDescription } from "./shared";

export const WORKFLOW_SYSTEM_PROMPT = `${SHARED_SYSTEM_PROMPT}

${buildDiagramTypeDescription("workflow")}

## Workflow Schema Requirements

The output must be a JSON object with these required fields:
- schema_version: 2
- diagram_type: "workflow"
- meta: { title: string, output: string, quality_profile?: "standard" | "showcase", visual_preset?: "classic" | "signal-flow" | "blueprint" | "editorial", animation?: "trace" | "none" }
- lanes: array of objects with id, label, variant? ("normal" | "exception")
- phases?: array of objects with id, label, fromCol, toCol, variant?
- groups?: array of objects with id, label, lane, fromCol, toCol, variant?
- mainPath?: array of node IDs representing the primary flow
- semanticChecks?: object with allowedRoots, allowedTerminals, requiredEdges, requiredPaths
- nodes: array of objects with id, lane, col (0-5), type, label (required), optional: sublabel, tag, icon, brand, sources, width, height, yOffset
- edges?: array of objects with from, to, optional: id, label, variant, role ("main" | "branch" | "async" | "return" | "error"), fromSide, toSide, route, via?, labelAt?, labelDx?, labelDy?, labelSegment?, channelX?, channelY?, bias?, width?
- cards?: array of objects with dot, title, items

## Guidelines for Roadmaps
- Lanes = major phases or categories (e.g., "Frontend", "Backend", "DevOps", "Testing")
- Columns = progression steps (0=start, 5=end)
- Nodes = key learning milestones, not individual tasks
- Main path = the primary learning sequence
- Use "emphasis" for required/core concepts
- Use "security" for validation/testing gates
- Use "dashed" for optional/advanced topics
- Keep nodes to 10-20 for readability
`;

export function buildWorkflowPrompt(
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
    systemPrompt: WORKFLOW_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt("workflow", context),
  };
}