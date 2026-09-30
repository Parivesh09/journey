import { SHARED_SYSTEM_PROMPT, buildUserPrompt, buildDiagramTypeDescription } from "./shared";

export const LIFECYCLE_SYSTEM_PROMPT = `${SHARED_SYSTEM_PROMPT}

${buildDiagramTypeDescription("lifecycle")}

## Lifecycle Schema Requirements

The output must be a JSON object with these required fields:
- schema_version: 1
- diagram_type: "lifecycle"
- meta: { title: string, output: string, quality_profile?: "standard" | "showcase" }
- states: array of objects with id, label, type ("initial" | "terminal" | "active" | "waiting" | "error" | "transient"), optional: sublabel, icon, brand, sources, x, y
- transitions?: array of objects with from, to (state IDs), optional: id, label, variant, trigger, condition, action, fromSide, toSide, route, via?, labelAt?, labelDx?, labelDy?, labelSegment?, width?
- regions?: array of objects with id, label, wraps (array of state IDs), pad?
- cards?: array of objects with dot, title, items

## State Types
- initial: Starting point (e.g., "Beginner", "No Experience")
- terminal: End states (e.g., "Job Ready", "Certified", "Graduate")
- active: Learning in progress (e.g., "Studying", "Practicing", "Building")
- waiting: Pausing states (e.g., "Review", "Revision", "Pending Assessment")
- error: Failed states requiring retry (e.g., "Needs Improvement", "Requires Review")
- transient: Temporary processing states (e.g., "Compiling", "Testing", "Deploying")

## Guidelines for Roadmaps
- States = major learning phases or skill levels
- Transitions = progression, assessment, or regression paths
- Use "initial" for roadmap starting point
- Use "terminal" for completion goals
- Use "active" for current learning activities
- Use "waiting" for review/reflection periods
- Use "error" for concepts requiring remediation
`;

export function buildLifecyclePrompt(
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
    systemPrompt: LIFECYCLE_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt("lifecycle", context),
  };
}