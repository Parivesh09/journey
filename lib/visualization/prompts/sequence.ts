import { SHARED_SYSTEM_PROMPT, buildUserPrompt, buildDiagramTypeDescription } from "./shared";

export const SEQUENCE_SYSTEM_PROMPT = `${SHARED_SYSTEM_PROMPT}

${buildDiagramTypeDescription("sequence")}

## Sequence Schema Requirements

The output must be a JSON object with these required fields:
- schema_version: 1
- diagram_type: "sequence"
- meta: { title: string, output: string, quality_profile?: "standard" | "showcase" }
- participants: array of objects with id, label, type, optional: sublabel, icon, brand, sources
- messages: array of objects with from, to, label (required), optional: id, variant, kind ("request" | "response" | "async" | "event" | "self"), fromSide, toSide, route, via?, labelAt?, labelDx?, labelDy?, labelSegment?, width?
- groups?: array of objects with id, label, participants, fromCol, toCol, variant?
- cards?: array of objects with dot, title, items

## Guidelines for Roadmaps
- Participants = major conceptual groups or learning phases
- Messages = key concepts, prerequisites, or learning dependencies
- Show how concepts build on each other
- Time flows top to bottom
- Keep to 5-12 participants for readability
`;

export function buildSequencePrompt(
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
    systemPrompt: SEQUENCE_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt("sequence", context),
  };
}