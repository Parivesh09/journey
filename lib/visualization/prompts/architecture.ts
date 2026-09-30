import { SHARED_SYSTEM_PROMPT, buildUserPrompt, buildDiagramTypeDescription } from "./shared";

export const ARCHITECTURE_SYSTEM_PROMPT = `${SHARED_SYSTEM_PROMPT}

${buildDiagramTypeDescription("architecture")}

## Architecture Schema Requirements

The output must be a JSON object with these required fields:
- schema_version: 1
- diagram_type: "architecture"
- meta: { title: string, output: string, quality_profile?: "standard" | "showcase" }
- components: array of objects with id, type, label (required), optional: sublabel, tag, icon, brand, sources, row, col, pos, size
- boundaries?: array of objects with kind ("region" | "security-group"), label, wraps (array of component IDs), pad?
- connections?: array of objects with from, to (component IDs), optional: id, label, variant ("default" | "emphasis" | "security" | "dashed"), fromSide, toSide, route ("auto" | "straight" | "orthogonal-h" | "orthogonal-v"), via?, labelAt?, labelDx?, labelDy?, labelSegment?, width?
- cards?: array of objects with dot, title, items (array of strings)

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