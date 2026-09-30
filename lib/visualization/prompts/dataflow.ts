import { SHARED_SYSTEM_PROMPT, buildUserPrompt, buildDiagramTypeDescription } from "./shared";

export const DATAFLOW_SYSTEM_PROMPT = `${SHARED_SYSTEM_PROMPT}

${buildDiagramTypeDescription("dataflow")}

## Dataflow Schema Requirements

The output must be a JSON object with these required fields:
- schema_version: 1
- diagram_type: "dataflow"
- meta: { title: string, output: string, quality_profile?: "standard" | "showcase" }
- nodes: array of objects with id, type, label (required), optional: sublabel, tag, icon, brand, sources, x, y
- edges?: array of objects with from, to, optional: id, label, variant, kind ("stream" | "batch" | "query" | "control"), fromSide, toSide, route, via?, labelAt?, labelDx?, labelDy?, labelSegment?, width?
- boundaries?: array of objects with kind ("region" | "security-group"), label, wraps, pad?
- cards?: array of objects with dot, title, items

## Guidelines for Roadmaps
- Nodes = major data/knowledge sources or sinks
- Edges = how knowledge flows from one concept to another
- Use "stream" for continuous learning progression
- Use "batch" for topic-based learning chunks
- Use "query" for practice/application phases
- Use "control" for assessment/evaluation steps
- Show data (knowledge) transformation and flow
`;

export function buildDataflowPrompt(
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
    systemPrompt: DATAFLOW_SYSTEM_PROMPT,
    userPrompt: buildUserPrompt("dataflow", context),
  };
}